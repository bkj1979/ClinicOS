import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";

export const runtime = "nodejs";

const localTranscriptionUrl = "http://127.0.0.1:8765/transcribe";
const maximumAudioBytes = 100 * 1024 * 1024;
const allowedAudioTypes = new Set([
  "audio/webm",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4a-latm",
]);

export async function POST(request: Request) {
  if (!getAuthenticatedUser(request)) return unauthorizedResponse();
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Upload a valid audio recording." }, { status: 400 });
  }

  const audio = formData.get("audio");
  const language = formData.get("language");
  if (!(audio instanceof File)) {
    return Response.json({ error: "Audio recording is required." }, { status: 400 });
  }
  if (audio.size === 0 || audio.size > maximumAudioBytes) {
    return Response.json({ error: "Recording must be between 1 byte and 100 MB." }, { status: 400 });
  }
  if (!allowedAudioTypes.has(audio.type)) {
    return Response.json({ error: "This browser audio format is not supported." }, { status: 415 });
  }
  if (typeof language !== "string" || !["en", "hi", "kn", "ta", "te", "auto"].includes(language)) {
    return Response.json({ error: "Select a supported transcription language." }, { status: 400 });
  }

  const localForm = new FormData();
  localForm.set("audio", audio, audio.name || "recording.webm");
  localForm.set("language", language);

  try {
    const response = await fetch(localTranscriptionUrl, {
      method: "POST",
      body: localForm,
      signal: AbortSignal.timeout(10 * 60 * 1000),
      cache: "no-store",
    });
    const result = await response.json() as { text?: string; language?: string; durationSeconds?: number; detail?: string };
    if (!response.ok) {
      return Response.json(
        { error: result.detail || "The local speech recognizer could not transcribe this recording." },
        { status: response.status },
      );
    }
    if (!result.text?.trim()) {
      return Response.json({ error: "The local speech recognizer returned an empty transcript." }, { status: 502 });
    }
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not reach the local Voice Scribe speech service:", error);
    return Response.json({
      error: "Local speech service is unavailable. Start it with `npm run voice-scribe:local` and try again.",
    }, { status: 503 });
  }
}
