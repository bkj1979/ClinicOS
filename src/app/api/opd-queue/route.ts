import { randomUUID } from "node:crypto";
import type { Patient } from "@/lib/types";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { openClinicDatabase, type ClinicDatabase } from "@/lib/database";

export const runtime = "nodejs";

const genders: Patient["gender"][] = ["Male", "Female", "Other"];
const priorities = ["normal", "urgent", "emergency"] as const;
type QueuePriority = (typeof priorities)[number];
type QueueStatus = "waiting" | "in-consultation" | "completed" | "skipped";

interface QueuePatient {
  id: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorId: string;
  doctorName: string;
  department: string;
  type: string;
  status: QueueStatus;
  priority: QueuePriority;
  checkInTime: string;
  consultStartTime?: string;
  consultEndTime?: string;
  estimatedWaitMinutes: number;
  vitalsRecorded: boolean;
  chiefComplaint?: string;
}

interface WalkInBody {
  name?: unknown;
  phone?: unknown;
  age?: unknown;
  gender?: unknown;
  priority?: unknown;
  doctorId?: unknown;
  chiefComplaint?: unknown;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function dobFromAge(age: number, now: Date): string {
  const birthDate = new Date(Date.UTC(now.getUTCFullYear() - age, now.getUTCMonth(), now.getUTCDate()));
  return birthDate.toISOString().slice(0, 10);
}

function toQueuePatient(row: Record<string, unknown>): QueuePatient {
  return {
    id: String(row.id),
    tokenNumber: String(row.token_number),
    patientId: String(row.patient_id),
    patientName: String(row.patient_name),
    patientAge: Number(row.patient_age),
    patientGender: String(row.patient_gender),
    doctorId: String(row.doctor_id),
    doctorName: String(row.doctor_name),
    department: String(row.department),
    type: String(row.type),
    status: String(row.status) as QueueStatus,
    priority: String(row.priority) as QueuePriority,
    checkInTime: String(row.check_in_time),
    consultStartTime: row.consult_start_time ? String(row.consult_start_time) : undefined,
    consultEndTime: row.consult_end_time ? String(row.consult_end_time) : undefined,
    estimatedWaitMinutes: Number(row.estimated_wait_minutes),
    vitalsRecorded: Boolean(row.vitals_recorded),
    chiefComplaint: row.chief_complaint ? String(row.chief_complaint) : undefined,
  };
}

export async function GET(request: Request) {
  if (!await getAuthenticatedUser(request)) return unauthorizedResponse();
  let database: ClinicDatabase | undefined;

  try {
    database = await openClinicDatabase();
    const today = new Date().toISOString().slice(0, 10);
    const rows = await database.prepare(`
      SELECT queue.*, appointment.chief_complaint
      FROM opd_queue AS queue
      JOIN appointments AS appointment ON appointment.id = queue.appointment_id
      WHERE substr(queue.check_in_time, 1, 10) = ?
      ORDER BY queue.check_in_time ASC
    `).all(today) as unknown as Record<string, unknown>[];
    return Response.json(rows.map(toQueuePatient));
  } catch (error) {
    console.error("Failed to load today's OPD queue from SQLite:", error);
    return Response.json({ error: "Unable to load the OPD queue from the local database." }, { status: 500 });
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
    return Response.json({ error: "Request body must be a walk-in registration object." }, { status: 400 });
  }

  const body = parsedBody as WalkInBody;
  const name = text(body.name);
  const phone = text(body.phone).replace(/[\s()-]/g, "").replace(/^\+91/, "");
  const age = typeof body.age === "number" ? body.age : Number(body.age);
  const gender = text(body.gender);
  const priority = text(body.priority).toLowerCase();
  const doctorId = text(body.doctorId);
  const chiefComplaint = text(body.chiefComplaint);

  if (!name || name.length > 120) {
    return Response.json({ error: "Enter the patient's name (up to 120 characters)." }, { status: 400 });
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return Response.json({ error: "Enter a valid 10-digit Indian mobile number." }, { status: 400 });
  }
  if (!Number.isInteger(age) || age < 0 || age > 120) {
    return Response.json({ error: "Enter a valid age between 0 and 120." }, { status: 400 });
  }
  if (!genders.includes(gender as Patient["gender"])) {
    return Response.json({ error: "Select a valid gender." }, { status: 400 });
  }
  if (!priorities.includes(priority as QueuePriority)) {
    return Response.json({ error: "Select a valid queue priority." }, { status: 400 });
  }
  if (!doctorId) {
    return Response.json({ error: "Select a doctor for this walk-in." }, { status: 400 });
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
      const doctor = await database.prepare(`
        SELECT id, name, specialization
        FROM users
        WHERE id = ? AND role = 'doctor' AND is_active = 1
      `).get(doctorId) as { id: string; name: string; specialization: string | null } | undefined;

      if (!doctor) {
        await database.exec("ROLLBACK");
        return Response.json({ error: "The selected doctor is not available." }, { status: 404 });
      }

      const matchingPatients = await database.prepare(
        "SELECT id, name FROM patients WHERE phone = ?",
      ).all(phone) as { id: string; name: string }[];
      const existingPatient = matchingPatients.find(
        (patient) => patient.name.toLowerCase() === name.toLowerCase(),
      );

      if (!existingPatient && matchingPatients.length > 0) {
        await database.exec("ROLLBACK");
        return Response.json({
          error: "This phone number is already registered to another patient. Verify the number or select the existing patient from the patient registry.",
        }, { status: 409 });
      }

      const now = new Date();
      const checkedInAt = now.toISOString();
      let patientId: string;
      let uhid: string | undefined;

      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        const maxUhid = await database
          .prepare("SELECT COALESCE(MAX(CAST(SUBSTR(uhid, 4) AS INTEGER)), 100000) AS max_id FROM patients")
          .get() as { max_id: number };
        patientId = randomUUID();
        uhid = `COS${maxUhid.max_id + 1}`;
        await database.prepare(`
          INSERT INTO patients (
            id, uhid, name, phone, gender, dob, age,
            allergies_json, chronic_conditions_json, registered_at, total_visits
          ) VALUES (?, ?, ?, ?, ?, ?, ?, '[]', '[]', ?, 0)
        `).run(
          patientId,
          uhid,
          name,
          phone,
          gender,
          dobFromAge(age, now),
          age,
          now.toISOString().slice(0, 10),
        );
      }

      const tokenSequence = await database.prepare(`
        SELECT COALESCE(MAX(CAST(SUBSTR(token_number, 2) AS INTEGER)), 0) + 1 AS next_token
        FROM appointments
        WHERE date = ? AND token_number GLOB 'T[0-9]*'
      `).get(now.toISOString().slice(0, 10)) as { next_token: number };
      const tokenNumber = `T${String(tokenSequence.next_token).padStart(3, "0")}`;
      const appointmentId = randomUUID();
      const queueId = randomUUID();
      const department = doctor.specialization || "General Medicine";
      const patient = await database.prepare(
        "SELECT name, phone, age, gender FROM patients WHERE id = ?",
      ).get(patientId) as { name: string; phone: string; age: number; gender: string };
      let slotTime = now;
      let timeSlot = "";
      const formatTimeSlot = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      while (true) {
        timeSlot = formatTimeSlot.format(slotTime);
        const occupied = await database.prepare(`
          SELECT 1 FROM appointments
          WHERE doctor_id = ? AND date = ? AND time_slot = ? AND status <> 'cancelled'
        `).get(doctor.id, now.toISOString().slice(0, 10), timeSlot);
        if (!occupied) break;
        slotTime = new Date(slotTime.getTime() + 1000);
      }
      const waitingAhead = await database.prepare(`
        SELECT COUNT(*) AS count
        FROM opd_queue
        WHERE doctor_id = ? AND status = 'waiting'
          AND substr(check_in_time, 1, 10) = ?
      `).get(doctor.id, now.toISOString().slice(0, 10)) as { count: number };
      const estimatedWaitMinutes = waitingAhead.count * 15;

      await database.prepare(`
        INSERT INTO appointments (
          id, patient_id, patient_name, patient_phone, patient_age, patient_gender,
          doctor_id, doctor_name, department, date, time_slot, type, status,
          token_number, chief_complaint, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'walk-in', 'waiting', ?, ?, ?)
      `).run(
        appointmentId,
        patientId,
        patient.name,
        patient.phone,
        patient.age,
        patient.gender,
        doctor.id,
        doctor.name,
        department,
        now.toISOString().slice(0, 10),
        timeSlot,
        tokenNumber,
        chiefComplaint || null,
        checkedInAt,
      );

      await database.prepare(`
        INSERT INTO opd_queue (
          id, token_number, patient_id, patient_name, patient_age, patient_gender,
          appointment_id, doctor_id, doctor_name, department, type, status, priority,
          check_in_time, estimated_wait_minutes, vitals_recorded
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'walk-in', 'waiting', ?, ?, ?, 0)
      `).run(
        queueId,
        tokenNumber,
        patientId,
        patient.name,
        patient.age,
        patient.gender,
        appointmentId,
        doctor.id,
        doctor.name,
        department,
        priority,
        checkedInAt,
        estimatedWaitMinutes,
      );

      await database.exec("COMMIT");
      return Response.json({
        id: queueId,
        tokenNumber,
        patientId,
        patientName: patient.name,
        patientAge: patient.age,
        patientGender: patient.gender,
        doctorId: doctor.id,
        doctorName: doctor.name,
        department,
        type: "walk-in",
        status: "waiting",
        priority,
        checkInTime: checkedInAt,
        estimatedWaitMinutes,
        vitalsRecorded: false,
        chiefComplaint: chiefComplaint || undefined,
        patientCreated: !existingPatient,
        uhid,
      }, { status: 201 });
    } catch (error) {
      await database.exec("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Failed to register walk-in in the database:", error);
    return Response.json({ error: "Unable to add this walk-in to the queue. Please check the database and try again." }, { status: 500 });
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
    return Response.json({ error: "Request body must be a queue update object." }, { status: 400 });
  }

  const body = parsedBody as { id?: unknown; status?: unknown; consultStartTime?: unknown; consultEndTime?: unknown };
  const id = text(body.id);
  const status = text(body.status);
  const validStatuses: QueueStatus[] = ["waiting", "in-consultation", "completed", "skipped"];
  if (!id || !validStatuses.includes(status as QueueStatus)) {
    return Response.json({ error: "A valid queue entry ID and status are required." }, { status: 400 });
  }

  let database: ClinicDatabase | undefined;
  try {
    database = await openClinicDatabase();
    await database.exec("PRAGMA foreign_keys = ON");
    const queueRow = await database.prepare(
      "SELECT appointment_id FROM opd_queue WHERE id = ?",
    ).get(id) as { appointment_id: string } | undefined;
    if (!queueRow) {
      return Response.json({ error: "Queue entry not found." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const consultStartTime = status === "in-consultation"
      ? text(body.consultStartTime) || now
      : null;
    const consultEndTime = status === "completed"
      ? text(body.consultEndTime) || now
      : null;

    await database.exec("BEGIN IMMEDIATE");
    try {
      await database.prepare(`
        UPDATE opd_queue
        SET status = ?, consult_start_time = COALESCE(?, consult_start_time),
            consult_end_time = COALESCE(?, consult_end_time)
        WHERE id = ?
      `).run(status, consultStartTime, consultEndTime, id);

      const appointmentStatus = status === "skipped" ? "no-show" : status;
      await database.prepare("UPDATE appointments SET status = ? WHERE id = ?")
        .run(appointmentStatus, queueRow.appointment_id);

      await database.exec("COMMIT");
    } catch (error) {
      await database.exec("ROLLBACK");
      throw error;
    }

    const result = await database.prepare(`
      SELECT queue.*, appointment.chief_complaint
      FROM opd_queue AS queue
      JOIN appointments AS appointment ON appointment.id = queue.appointment_id
      WHERE queue.id = ?
    `).get(id) as Record<string, unknown> | undefined;
    if (!result) {
      return Response.json({ error: "Queue entry was updated but could not be reloaded." }, { status: 500 });
    }
    return Response.json(toQueuePatient(result));
  } catch (error) {
    console.error("Failed to update OPD queue entry:", error);
    return Response.json({ error: "Unable to update the OPD queue. Please try again." }, { status: 500 });
  } finally {
    database?.close();
  }
}
