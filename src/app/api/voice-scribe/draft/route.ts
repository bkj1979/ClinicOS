import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { openClinicDatabase, type ClinicDatabase } from "@/lib/database";

export const runtime = "nodejs";

interface DraftBody {
  transcript?: unknown;
  patient?: unknown;
  chiefComplaint?: unknown;
  visitType?: unknown;
}

interface PatientContext {
  id?: unknown;
  name?: unknown;
  age?: unknown;
  gender?: unknown;
}

interface SoapDraft {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validDraft(value: unknown): value is SoapDraft {
  if (!isRecord(value)) return false;
  return ["subjective", "objective", "assessment", "plan"]
    .every((key) => typeof value[key] === "string");
}

const allowedEnglishWords = new Set([
  "a", "about", "after", "all", "also", "am", "an", "and", "are", "as", "at", "be",
  "been", "before", "but", "by", "can", "could", "did", "do", "does", "for", "from",
  "had", "has", "have", "he", "her", "here", "him", "his", "how", "i", "if", "in",
  "into", "is", "it", "its", "may", "might", "more", "most", "my", "no", "not", "of",
  "on", "or", "our", "patient", "please", "she", "should", "so", "some", "than", "that",
  "the", "their", "them", "then", "there", "these", "they", "this", "those", "to", "too",
  "under", "up", "was", "we", "were", "what", "when", "which", "who", "will", "with",
  "would", "yes", "you", "your",
]);

function tokens(value: string): string[] {
  return value.toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:[.'’-][\p{L}\p{N}]+)*/gu) || [];
}

function keepTranscriptGroundedText(value: string, allowedTokens: Set<string>): string {
  const sentences = value.match(/[^.!?\n]+[.!?]?/g) || [];
  const groundedSentences = sentences
    .map((sentence) => sentence.trim())
    .filter((sentence) => {
      if (!sentence) return false;
      if (/^not documented(?:\s+in the transcript)?\.?$/i.test(sentence)) return true;
      return tokens(sentence).every(
        (token) => allowedTokens.has(token) || allowedEnglishWords.has(token),
      );
    });
  return groundedSentences.join(" ").trim() || "Not documented in the transcript; clinician review required.";
}

export async function POST(request: Request) {
  if (!await getAuthenticatedUser(request)) return unauthorizedResponse();
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isRecord(parsed)) {
    return Response.json({ error: "Draft request must be an object." }, { status: 400 });
  }
  const body = parsed as DraftBody;
  const transcript = requiredText(body.transcript);
  const complaint = requiredText(body.chiefComplaint);
  const visitType = requiredText(body.visitType);
  const patient = body.patient as PatientContext | null;
  if (!transcript || transcript.length > 100_000) {
    return Response.json({ error: "A transcript between 1 and 100,000 characters is required." }, { status: 400 });
  }
  if (!patient || !requiredText(patient.id) || !requiredText(patient.name)) {
    return Response.json({ error: "Select a registered patient before drafting notes." }, { status: 400 });
  }
  if (!["opd", "follow-up", "emergency", "teleconsult"].includes(visitType)) {
    return Response.json({ error: "Select a valid visit type." }, { status: 400 });
  }

  let patientRecord: PatientContext & { id: string; name: string };
  let database: ClinicDatabase | undefined;
  try {
    database = await openClinicDatabase();
    const row = await database.prepare(
      "SELECT id, name, age, gender FROM patients WHERE id = ?",
    ).get(requiredText(patient.id)) as { id: string; name: string; age: number; gender: string } | undefined;
    if (!row) {
      return Response.json({ error: "Selected patient was not found in the local registry." }, { status: 404 });
    }
    patientRecord = row;
  } catch (error) {
    console.error("Could not load patient context for local SOAP drafting:", error);
    return Response.json({ error: "Unable to load patient context from the local database." }, { status: 500 });
  } finally {
    database?.close();
  }

  const prompt = `You are a clinical documentation assistant. Draft concise notes from the supplied consultation transcript. This is a draft for clinician review, not medical advice.
Rules:
- Use only facts explicitly present in the transcript or patient context.
- Never infer, invent, or recommend diagnoses, examination findings, vital signs, test results, medicines, doses, or follow-up instructions.
- Never recommend that no action, treatment, or follow-up is needed unless the clinician explicitly says so in the transcript.
- If a SOAP section has no supporting information, say "Not documented."
- Copy only exact statements from the transcript; do not paraphrase or combine statements.
- Subjective: include patient statements only. Objective: include explicit clinician-stated findings only.
- Assessment: include a diagnosis only when the clinician explicitly names it. Plan: include only explicit clinician instructions.
- Return only a JSON object with exactly these string fields: subjective, objective, assessment, plan.
- Do not add a conclusion or recommendations to any section that are not directly stated in the transcript.
- Do not add Markdown fences or any additional fields.

Patient context: ${JSON.stringify({
    name: patientRecord.name,
    age: patientRecord.age,
    gender: patientRecord.gender,
    chiefComplaint: complaint || "Not provided",
    visitType,
  })}

Consultation transcript:
${transcript}`;

  try {
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.CLINICOS_LOCAL_LLM_MODEL || "qwen2.5:1.5b",
        prompt,
        format: "json",
        stream: false,
        options: { temperature: 0.1, num_ctx: 8192 },
      }),
      signal: AbortSignal.timeout(5 * 60 * 1000),
      cache: "no-store",
    });

    const result = await response.json() as { response?: string; error?: string };
    if (!response.ok) {
      console.error("Local LLM returned an error:", result.error || response.statusText);
      return Response.json({
        error: "The local language model could not draft the notes. Check that the selected Ollama model is installed.",
      }, { status: 502 });
    }
    if (typeof result.response !== "string") {
      return Response.json({ error: "The local language model returned an invalid response." }, { status: 502 });
    }

    let draft: unknown;
    try {
      draft = JSON.parse(result.response);
    } catch (error) {
      console.error("Local LLM returned invalid JSON:", error);
      return Response.json({ error: "The local language model returned notes in an invalid format. Try again." }, { status: 502 });
    }
    if (!validDraft(draft)) {
      return Response.json({ error: "The local language model did not return all required SOAP note sections." }, { status: 502 });
    }
    const allowedTokens = new Set(tokens(
      `${transcript} ${complaint} ${patientRecord.name} ${patientRecord.age} ${patientRecord.gender}`,
    ));
    const groundedDraft: SoapDraft = {
      subjective: keepTranscriptGroundedText(draft.subjective, allowedTokens),
      objective: keepTranscriptGroundedText(draft.objective, allowedTokens),
      assessment: keepTranscriptGroundedText(draft.assessment, allowedTokens),
      plan: keepTranscriptGroundedText(draft.plan, allowedTokens),
    };
    const summary = [groundedDraft.subjective, groundedDraft.objective, groundedDraft.assessment, groundedDraft.plan]
      .map((section) => section.trim())
      .filter((section) => section && !/^not documented/i.test(section))
      .join(" ");
    return Response.json(
      { ...groundedDraft, summary: summary || "No clinical details were captured in the draft." },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not reach the local Voice Scribe language model:", error);
    return Response.json({
      error: "Local AI model is unavailable. Start Ollama and install the configured model before drafting notes.",
    }, { status: 503 });
  }
}
