import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";

export const runtime = "nodejs";

const databasePath = join(process.cwd(), "prisma", "clinic-os.db");
const soapKeys = ["subjective", "objective", "assessment", "plan"] as const;
type SoapNotes = Record<(typeof soapKeys)[number], string>;

interface SaveEncounterBody {
  id?: unknown;
  patientId?: unknown;
  chiefComplaint?: unknown;
  visitType?: unknown;
  transcript?: unknown;
  notes?: unknown;
  summary?: unknown;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function saveEncounter(request: Request, updateExisting: boolean) {
  if (!getAuthenticatedUser(request)) return unauthorizedResponse();
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return Response.json({ error: "Encounter draft must be an object." }, { status: 400 });
  }

  const body = parsed as SaveEncounterBody;
  const encounterId = text(body.id);
  const patientId = text(body.patientId);
  const chiefComplaint = text(body.chiefComplaint);
  const visitType = text(body.visitType);
  const transcript = text(body.transcript);
  const summary = text(body.summary);
  const rawNotes = body.notes;
  const validVisitTypes = ["opd", "follow-up", "emergency", "teleconsult"];
  if (!patientId) {
    return Response.json({ error: "Select a patient before saving the encounter." }, { status: 400 });
  }
  if (!transcript) {
    return Response.json({ error: "A non-empty transcript is required to save the encounter draft." }, { status: 400 });
  }
  if (updateExisting && !encounterId) {
    return Response.json({ error: "Encounter ID is required to update a saved draft." }, { status: 400 });
  }
  if (!validVisitTypes.includes(visitType)) {
    return Response.json({ error: "Select a valid visit type." }, { status: 400 });
  }
  if (transcript.length > 100_000 || chiefComplaint.length > 1000 || summary.length > 10_000) {
    return Response.json({ error: "Encounter content exceeds the allowed size." }, { status: 413 });
  }
  if (!rawNotes || typeof rawNotes !== "object" || Array.isArray(rawNotes)) {
    return Response.json({ error: "SOAP notes are required." }, { status: 400 });
  }
  const notesObject = rawNotes as Record<string, unknown>;
  if (!soapKeys.every((key) => typeof notesObject[key] === "string")) {
    return Response.json({ error: "All four SOAP note sections must be text." }, { status: 400 });
  }
  const notes: SoapNotes = {
    subjective: text(notesObject.subjective),
    objective: text(notesObject.objective),
    assessment: text(notesObject.assessment),
    plan: text(notesObject.plan),
  };

  let database: DatabaseSync | undefined;
  try {
    database = new DatabaseSync(databasePath);
    database.exec("PRAGMA foreign_keys = ON");
    const patient = database.prepare(
      "SELECT id, name FROM patients WHERE id = ?",
    ).get(patientId) as { id: string; name: string } | undefined;
    if (!patient) {
      return Response.json({ error: "Selected patient was not found in the local registry." }, { status: 404 });
    }
    const doctor = database.prepare(`
      SELECT id, name, specialization
      FROM users
      WHERE id = 'u1' AND role = 'doctor' AND is_active = 1
    `).get() as { id: string; name: string; specialization: string | null } | undefined;
    if (!doctor) {
      return Response.json({ error: "The default local doctor profile is unavailable in SQLite." }, { status: 500 });
    }

    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    if (updateExisting) {
      const existing = database.prepare(
        "SELECT patient_id FROM encounters WHERE id = ? AND status = 'in-progress'",
      ).get(encounterId) as { patient_id: string } | undefined;
      if (!existing) {
        return Response.json({ error: "Saved draft not found or no longer editable." }, { status: 404 });
      }
      if (existing.patient_id !== patient.id) {
        return Response.json({ error: "A saved draft cannot be moved to another patient." }, { status: 409 });
      }
      database.prepare(`
        UPDATE encounters
        SET patient_name = ?, date = ?, department = ?, type = ?, chief_complaint = ?,
            notes_json = ?, ai_transcript = ?, ai_soap_notes = ?
        WHERE id = ? AND status = 'in-progress'
      `).run(
        patient.name,
        date,
        doctor.specialization || "General Medicine",
        visitType,
        chiefComplaint || "Not provided",
        JSON.stringify(notes),
        transcript || null,
        summary || null,
        encounterId,
      );
      return Response.json({ id: encounterId, status: "in-progress" });
    }

    const newEncounterId = randomUUID();
    database.prepare(`
      INSERT INTO encounters (
        id, patient_id, patient_name, doctor_id, doctor_name, date, department,
        type, chief_complaint, vitals_json, notes_json, diagnoses_json,
        prescriptions_json, lab_orders_json, procedures_json, follow_up_date,
        attachments_json, ai_transcript, ai_soap_notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, '[]', '[]', '[]', '[]', NULL, '[]', ?, ?, 'in-progress')
    `).run(
      newEncounterId,
      patient.id,
      patient.name,
      doctor.id,
      doctor.name,
      date,
      doctor.specialization || "General Medicine",
      visitType,
      chiefComplaint || "Not provided",
      JSON.stringify(notes),
      transcript || null,
      summary || null,
    );
    return Response.json({ id: newEncounterId, status: "in-progress" }, { status: 201 });
  } catch (error) {
    console.error("Failed to save Voice Scribe encounter to SQLite:", error);
    return Response.json({ error: "Unable to save the encounter draft to the local database." }, { status: 500 });
  } finally {
    database?.close();
  }
}

export async function POST(request: Request) {
  return saveEncounter(request, false);
}

export async function PATCH(request: Request) {
  return saveEncounter(request, true);
}

export async function DELETE(request: Request) {
  if (!getAuthenticatedUser(request)) return unauthorizedResponse();
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return Response.json({ error: "Encounter ID is required." }, { status: 400 });
  }
  const encounterId = text((parsed as { id?: unknown }).id);
  if (!encounterId) {
    return Response.json({ error: "Encounter ID is required." }, { status: 400 });
  }

  let database: DatabaseSync | undefined;
  try {
    database = new DatabaseSync(databasePath);
    const result = database.prepare(
      "DELETE FROM encounters WHERE id = ? AND status = 'in-progress'",
    ).run(encounterId);
    if (result.changes === 0) {
      return Response.json({ error: "Saved draft not found or no longer editable." }, { status: 404 });
    }
    return Response.json({ id: encounterId, deleted: true });
  } catch (error) {
    console.error("Failed to discard Voice Scribe encounter draft:", error);
    return Response.json({ error: "Unable to discard the saved draft from the local database." }, { status: 500 });
  } finally {
    database?.close();
  }
}
