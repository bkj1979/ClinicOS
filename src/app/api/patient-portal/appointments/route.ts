import { randomUUID } from "node:crypto";
import { APPOINTMENT_TIME_SLOT_SET } from "@/lib/appointment-scheduling";
import { getAuthenticatedPortalPatient, openPatientPortalDatabase } from "@/lib/patient-portal";

export const runtime = "nodejs";

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export async function POST(request: Request) {
  const patient = await getAuthenticatedPortalPatient(request);
  if (!patient) return Response.json({ error: "Sign in to request an appointment." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const doctorId = body && typeof body === "object" && !Array.isArray(body)
    ? (body as { doctorId?: unknown }).doctorId
    : undefined;
  const date = body && typeof body === "object" && !Array.isArray(body)
    ? (body as { date?: unknown }).date
    : undefined;
  const timeSlot = body && typeof body === "object" && !Array.isArray(body)
    ? (body as { timeSlot?: unknown }).timeSlot
    : undefined;
  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (typeof doctorId !== "string" || !doctorId.trim()
    || typeof date !== "string" || !isValidDate(date) || date < today || date > maxDate
    || typeof timeSlot !== "string" || !APPOINTMENT_TIME_SLOT_SET.has(timeSlot)) {
    return Response.json({ error: "Choose an available doctor, date within the next 90 days, and time." }, { status: 400 });
  }

  let database;
  try {
    database = await openPatientPortalDatabase();
    await database.exec("BEGIN IMMEDIATE");
    const doctor = await database.prepare(`
      SELECT id, name, specialization FROM users
      WHERE id = ? AND role = 'doctor' AND is_active = 1
    `).get(doctorId.trim()) as { id: string; name: string; specialization: string | null } | undefined;
    if (!doctor) {
      await database.exec("ROLLBACK");
      return Response.json({ error: "That doctor is not available." }, { status: 404 });
    }

    const occupied = await database.prepare(`
      SELECT 1 FROM appointments
      WHERE doctor_id = ? AND date = ? AND time_slot = ? AND status <> 'cancelled'
    `).get(doctor.id, date, timeSlot);
    if (occupied) {
      await database.exec("ROLLBACK");
      return Response.json({ error: "That time has just been booked. Choose another slot." }, { status: 409 });
    }

    const patientRecord = await database.prepare(`
      SELECT id, name, phone, age, gender FROM patients WHERE id = ?
    `).get(patient.id) as { id: string; name: string; phone: string; age: number; gender: string } | undefined;
    if (!patientRecord) {
      await database.exec("ROLLBACK");
      return Response.json({ error: "Your patient record is no longer available." }, { status: 404 });
    }

    const appointmentId = randomUUID();
    await database.prepare(`
      INSERT INTO appointments (
        id, patient_id, patient_name, patient_phone, patient_age, patient_gender,
        doctor_id, doctor_name, department, date, time_slot, type, status,
        token_number, chief_complaint, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', 'requested', NULL, NULL, ?, ?)
    `).run(
      appointmentId,
      patientRecord.id,
      patientRecord.name,
      patientRecord.phone,
      patientRecord.age,
      patientRecord.gender,
      doctor.id,
      doctor.name,
      doctor.specialization || "General Medicine",
      date,
      timeSlot,
      "Patient app booking request; awaiting clinic confirmation.",
      new Date().toISOString(),
    );
    await database.exec("COMMIT");
    return Response.json({ requested: true, id: appointmentId }, { status: 201 });
  } catch (error) {
    await database?.exec("ROLLBACK");
    if (error instanceof Error && /appointments_doctor_slot_unique_idx|UNIQUE constraint failed/i.test(error.message)) {
      return Response.json({ error: "That time has just been booked. Choose another slot." }, { status: 409 });
    }
    console.error("Could not submit a patient appointment request:", error);
    return Response.json({ error: "Unable to submit your appointment request." }, { status: 500 });
  } finally {
    database?.close();
  }
}
