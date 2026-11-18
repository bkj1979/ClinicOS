import { randomUUID } from "node:crypto";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { openClinicDatabase } from "@/lib/database";
import type { PrescriptionItem } from "@/lib/types";

export const runtime = "nodejs";

type SoapNotes = { subjective: string; objective: string; assessment: string; plan: string };
const vitalRanges: Record<string, { min: number; max: number }> = {
  temperature: { min: 30, max: 45 },
  bloodPressureSystolic: { min: 30, max: 300 },
  bloodPressureDiastolic: { min: 20, max: 200 },
  heartRate: { min: 20, max: 300 },
  respiratoryRate: { min: 4, max: 80 },
  oxygenSaturation: { min: 0, max: 100 },
  weight: { min: 0.3, max: 500 },
  height: { min: 20, max: 300 },
  bloodSugar: { min: 10, max: 2000 },
  painScale: { min: 0, max: 10 },
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseMedicines(value: unknown): PrescriptionItem[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20) return null;
  const medicines: PrescriptionItem[] = [];
  for (const medicine of value) {
    if (!medicine || typeof medicine !== "object" || Array.isArray(medicine)) return null;
    const item = medicine as Record<string, unknown>;
    const drugName = text(item.drugName);
    const dosage = text(item.dosage);
    const frequency = text(item.frequency);
    const duration = text(item.duration);
    const route = text(item.route);
    const quantity = Number(item.quantity);
    const beforeAfterFood = item.beforeAfterFood;
    if (!drugName || drugName.length > 200 || !dosage || dosage.length > 120
      || !frequency || frequency.length > 120 || !duration || duration.length > 120
      || !route || route.length > 60 || !Number.isInteger(quantity) || quantity < 1 || quantity > 10000
      || !["before", "after", "with", "any"].includes(String(beforeAfterFood))) return null;
    medicines.push({
      id: randomUUID(),
      drugName,
      genericName: text(item.genericName).slice(0, 200),
      dosage,
      frequency,
      duration,
      route,
      instructions: text(item.instructions).slice(0, 500) || undefined,
      quantity,
      beforeAfterFood: beforeAfterFood as PrescriptionItem["beforeAfterFood"],
    });
  }
  return medicines;
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role !== "doctor") {
    return Response.json({ error: "Only a doctor can save a mobile consultation." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Consultation details are required." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const patientId = text(input.patientId);
  const chiefComplaint = text(input.chiefComplaint);
  const subjective = text(input.subjective);
  const objective = text(input.objective);
  const assessment = text(input.assessment);
  const plan = text(input.plan);
  const diagnosis = text(input.diagnosis);
  const advice = text(input.advice);
  const followUpDate = text(input.followUpDate);
  const medicines = parseMedicines(input.medicines);
  const rawVitals = input.vitals;
  if (!patientId) return Response.json({ error: "Patient ID is required." }, { status: 400 });
  if (!chiefComplaint) return Response.json({ error: "Enter the chief complaint." }, { status: 400 });
  if (chiefComplaint.length > 1000 || [subjective, objective, assessment, plan, diagnosis, advice].some((value) => value.length > 5000)) {
    return Response.json({ error: "Consultation text exceeds the allowed length." }, { status: 413 });
  }
  if (!subjective && !objective && !assessment && !plan) {
    return Response.json({ error: "Enter at least one SOAP note before saving." }, { status: 400 });
  }
  if (!medicines) return Response.json({ error: "Check medicine details and try again." }, { status: 400 });
  if (rawVitals !== undefined && (!rawVitals || typeof rawVitals !== "object" || Array.isArray(rawVitals))) {
    return Response.json({ error: "Check the vital signs and try again." }, { status: 400 });
  }
  const vitals: Record<string, number> = {};
  if (rawVitals && typeof rawVitals === "object" && !Array.isArray(rawVitals)) {
    for (const [key, value] of Object.entries(rawVitals)) {
      const range = vitalRanges[key];
      if (!range || typeof value !== "number" || !Number.isFinite(value) || value < range.min || value > range.max) {
        return Response.json({ error: "One or more vital signs are outside the accepted range." }, { status: 400 });
      }
      vitals[key] = value;
    }
  }
  if (vitals.weight && vitals.height && !vitals.bmi) {
    vitals.bmi = Math.round((vitals.weight / ((vitals.height / 100) ** 2)) * 10) / 10;
  }
  if (followUpDate) {
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(followUpDate)
      ? new Date(`${followUpDate}T00:00:00.000Z`)
      : new Date(Number.NaN);
    if (Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== followUpDate) {
      return Response.json({ error: "Enter a valid follow-up date." }, { status: 400 });
    }
  }

  let database;
  try {
    database = await openClinicDatabase();
    await database.exec("PRAGMA foreign_keys = ON");
    await database.exec("BEGIN IMMEDIATE");
    const hasRelationship = await database.prepare(`
      SELECT 1
      WHERE EXISTS (SELECT 1 FROM appointments WHERE patient_id = ? AND doctor_id = ?)
         OR EXISTS (SELECT 1 FROM encounters WHERE patient_id = ? AND doctor_id = ?)
         OR EXISTS (SELECT 1 FROM prescriptions WHERE patient_id = ? AND doctor_id = ?)
    `).get(patientId, user.userId, patientId, user.userId, patientId, user.userId);
    if (!hasRelationship) {
      await database.exec("ROLLBACK");
      return Response.json({ error: "This patient is not in your assigned care records." }, { status: 404 });
    }
    const patient = await database.prepare(`
      SELECT id, name FROM patients WHERE id = ?
    `).get(patientId) as { id: string; name: string } | undefined;
    if (!patient) {
      await database.exec("ROLLBACK");
      return Response.json({ error: "Patient not found." }, { status: 404 });
    }

    const encounterId = randomUUID();
    const date = new Date().toISOString().slice(0, 10);
    const diagnoses = diagnosis
      ? [{ id: randomUUID(), icdCode: "", description: diagnosis, type: "primary" }]
      : [];
    const notes: SoapNotes = { subjective, objective, assessment, plan };
    await database.prepare(`
      INSERT INTO encounters (
        id, patient_id, patient_name, doctor_id, doctor_name, date, department,
        type, chief_complaint, vitals_json, notes_json, diagnoses_json,
        prescriptions_json, lab_orders_json, procedures_json, follow_up_date,
        attachments_json, ai_transcript, ai_soap_notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'opd', ?, ?, ?, ?, ?, '[]', '[]', ?, '[]', NULL, NULL, 'completed')
    `).run(
      encounterId,
      patient.id,
      patient.name,
      user.userId,
      user.name,
      date,
      user.specialization || "General Medicine",
      chiefComplaint,
      Object.keys(vitals).length > 0 ? JSON.stringify(vitals) : null,
      JSON.stringify(notes),
      JSON.stringify(diagnoses),
      JSON.stringify(medicines),
      followUpDate || null,
    );

    let prescriptionNo: string | undefined;
    if (medicines.length > 0) {
      prescriptionNo = `RX-${date.replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
      await database.prepare(`
        INSERT INTO prescriptions (
          id, prescription_no, patient_id, patient_name, doctor_id, doctor_name,
          encounter_id, date, items_json, diagnoses_json, advice, follow_up_date,
          status, qr_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'created', NULL)
      `).run(
        randomUUID(),
        prescriptionNo,
        patient.id,
        patient.name,
        user.userId,
        user.name,
        encounterId,
        date,
        JSON.stringify(medicines),
        JSON.stringify(diagnoses),
        advice,
        followUpDate || null,
      );
    }

    await database.exec("COMMIT");
    return Response.json({ encounterId, prescriptionNo }, { status: 201 });
  } catch (error) {
    await database?.exec("ROLLBACK");
    console.error("Could not save a doctor mobile consultation:", error);
    return Response.json({ error: "Unable to save this consultation. Please try again." }, { status: 500 });
  } finally {
    database?.close();
  }
}
