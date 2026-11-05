import { randomUUID } from "node:crypto";
import type { Appointment, AppointmentStatus, AppointmentType } from "@/lib/types";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { openClinicDatabase, type ClinicDatabase } from "@/lib/database";

export const runtime = "nodejs";

const timeSlots = new Set([
  "09:00 AM", "09:15 AM", "09:30 AM", "09:45 AM",
  "10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM",
  "11:00 AM", "11:15 AM", "11:30 AM", "11:45 AM",
  "12:00 PM", "12:15 PM", "12:30 PM", "12:45 PM",
  "02:00 PM", "02:15 PM", "02:30 PM", "02:45 PM",
  "03:00 PM", "03:15 PM", "03:30 PM", "03:45 PM",
  "04:00 PM", "04:15 PM", "04:30 PM", "04:45 PM",
  "05:00 PM", "05:15 PM", "05:30 PM", "05:45 PM",
]);
const appointmentTypes: AppointmentType[] = ["walk-in", "scheduled", "follow-up", "teleconsult"];
const appointmentStatuses: AppointmentStatus[] = [
  "scheduled", "waiting", "in-consultation", "completed", "cancelled", "no-show",
];

interface AppointmentRow {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  patient_age: number;
  patient_gender: string;
  doctor_id: string;
  doctor_name: string;
  department: string;
  date: string;
  time_slot: string;
  type: AppointmentType;
  status: AppointmentStatus;
  token_number: string | null;
  chief_complaint: string | null;
  notes: string | null;
  created_at: string;
}

interface CreateAppointmentBody {
  patientId?: unknown;
  doctorId?: unknown;
  date?: unknown;
  timeSlot?: unknown;
  type?: unknown;
  chiefComplaint?: unknown;
}

function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    patientAge: row.patient_age,
    patientGender: row.patient_gender,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    department: row.department,
    date: row.date,
    timeSlot: row.time_slot,
    type: row.type,
    status: row.status,
    tokenNumber: row.token_number ?? undefined,
    chiefComplaint: row.chief_complaint ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export async function GET(request: Request) {
  if (!await getAuthenticatedUser(request)) return unauthorizedResponse();
  let database: ClinicDatabase | undefined;

  try {
    database = await openClinicDatabase();
    const rows = await database
      .prepare("SELECT * FROM appointments ORDER BY date DESC, time_slot ASC")
      .all() as unknown as AppointmentRow[];
    return Response.json(rows.map(toAppointment));
  } catch (error) {
    console.error("Failed to load appointments from the database:", error);
    return Response.json({ error: "Unable to load appointments from the local database." }, { status: 500 });
  } finally {
    database?.close();
  }
}

export async function POST(request: Request) {
  if (!await getAuthenticatedUser(request)) return unauthorizedResponse();
  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
    return Response.json({ error: "Request body must be an appointment object." }, { status: 400 });
  }

  const body = parsedBody as CreateAppointmentBody;
  const patientId = text(body.patientId);
  const doctorId = text(body.doctorId);
  const date = text(body.date);
  const timeSlot = text(body.timeSlot);
  const type = text(body.type);
  const chiefComplaint = text(body.chiefComplaint);

  if (!patientId || !doctorId || !date || !timeSlot) {
    return Response.json({ error: "Patient, doctor, date, and time slot are required." }, { status: 400 });
  }
  if (!validDate(date) || date < new Date().toISOString().slice(0, 10)) {
    return Response.json({ error: "Choose a valid appointment date that is today or later." }, { status: 400 });
  }
  if (!timeSlots.has(timeSlot)) {
    return Response.json({ error: "Choose a valid appointment time slot." }, { status: 400 });
  }
  if (!appointmentTypes.includes(type as AppointmentType)) {
    return Response.json({ error: "Choose a valid appointment type." }, { status: 400 });
  }
  if (chiefComplaint.length > 1000) {
    return Response.json({ error: "Chief complaint must be 1000 characters or fewer." }, { status: 400 });
  }

  let database: ClinicDatabase | undefined;
  try {
    database = await openClinicDatabase();
    await database.exec("PRAGMA foreign_keys = ON");
    await database.exec("BEGIN IMMEDIATE");

    try {
      const patient = await database.prepare(
        "SELECT id, name, phone, age, gender FROM patients WHERE id = ?",
      ).get(patientId) as { id: string; name: string; phone: string; age: number; gender: string } | undefined;
      if (!patient) {
        await database.exec("ROLLBACK");
        return Response.json({ error: "The selected patient was not found. Refresh the patient list and try again." }, { status: 404 });
      }

      const doctor = await database.prepare(
        "SELECT id, name, specialization FROM users WHERE id = ? AND role = 'doctor' AND is_active = 1",
      ).get(doctorId) as { id: string; name: string; specialization: string | null } | undefined;
      if (!doctor) {
        await database.exec("ROLLBACK");
        return Response.json({ error: "The selected doctor is not available." }, { status: 404 });
      }

      const occupiedSlot = await database.prepare(
        "SELECT 1 FROM appointments WHERE doctor_id = ? AND date = ? AND time_slot = ? AND status <> 'cancelled'",
      ).get(doctor.id, date, timeSlot);
      if (occupiedSlot) {
        await database.exec("ROLLBACK");
        return Response.json({ error: "That time slot has already been booked for this doctor. Choose another slot." }, { status: 409 });
      }

      const nextToken = await database.prepare(
        "SELECT COALESCE(MAX(CAST(SUBSTR(token_number, 2) AS INTEGER)), 0) + 1 AS next_token FROM appointments WHERE date = ? AND token_number GLOB 'T[0-9]*'",
      ).get(date) as { next_token: number };
      const doctorName = doctor.name;
      const appointment: Appointment = {
        id: randomUUID(),
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        patientAge: patient.age,
        patientGender: patient.gender,
        doctorId: doctor.id,
        doctorName,
        department: doctor.specialization || "General Medicine",
        date,
        timeSlot,
        type: type as AppointmentType,
        status: "scheduled",
        tokenNumber: `T${String(nextToken.next_token).padStart(3, "0")}`,
        chiefComplaint: chiefComplaint || undefined,
        createdAt: new Date().toISOString(),
      };

      await database.prepare(`
        INSERT INTO appointments (
          id, patient_id, patient_name, patient_phone, patient_age, patient_gender,
          doctor_id, doctor_name, department, date, time_slot, type, status,
          token_number, chief_complaint, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        appointment.id,
        appointment.patientId,
        appointment.patientName,
        appointment.patientPhone,
        appointment.patientAge,
        appointment.patientGender,
        appointment.doctorId,
        appointment.doctorName,
        appointment.department,
        appointment.date,
        appointment.timeSlot,
        appointment.type,
        appointment.status,
        appointment.tokenNumber ?? null,
        appointment.chiefComplaint ?? null,
        null,
        appointment.createdAt,
      );

      await database.exec("COMMIT");
      return Response.json(appointment, { status: 201 });
    } catch (error) {
      await database.exec("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Failed to create appointment in the database:", error);
    return Response.json({ error: "Unable to create the appointment. Please try again." }, { status: 500 });
  } finally {
    database?.close();
  }
}

export async function PATCH(request: Request) {
  if (!await getAuthenticatedUser(request)) return unauthorizedResponse();
  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
    return Response.json({ error: "Request body must be an appointment update object." }, { status: 400 });
  }

  const body = parsedBody as { id?: unknown; status?: unknown };
  const id = text(body.id);
  const status = text(body.status);
  if (!id || !appointmentStatuses.includes(status as AppointmentStatus)) {
    return Response.json({ error: "A valid appointment ID and status are required." }, { status: 400 });
  }

  let database: ClinicDatabase | undefined;
  try {
    database = await openClinicDatabase();
    await database.prepare("UPDATE appointments SET status = ? WHERE id = ?").run(status, id);
    const row = await database.prepare("SELECT * FROM appointments WHERE id = ?").get(id) as AppointmentRow | undefined;
    if (!row) {
      return Response.json({ error: "Appointment not found." }, { status: 404 });
    }
    return Response.json(toAppointment(row));
  } catch (error) {
    console.error("Failed to update appointment in the database:", error);
    return Response.json({ error: "Unable to update the appointment. Please try again." }, { status: 500 });
  } finally {
    database?.close();
  }
}
