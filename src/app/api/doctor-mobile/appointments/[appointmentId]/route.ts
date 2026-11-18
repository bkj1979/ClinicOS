import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { openClinicDatabase } from "@/lib/database";
import type { AppointmentStatus } from "@/lib/types";

export const runtime = "nodejs";

const allowedTransitions: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  requested: ["scheduled", "cancelled"],
  scheduled: ["in-consultation", "waiting", "cancelled", "no-show"],
  waiting: ["in-consultation", "cancelled", "no-show"],
  "in-consultation": ["completed"],
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ appointmentId: string }> },
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role !== "doctor") {
    return Response.json({ error: "The doctor mobile workspace is available to doctor accounts only." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const status = body && typeof body === "object" && !Array.isArray(body)
    ? (body as { status?: unknown }).status
    : undefined;
  const { appointmentId } = await context.params;
  if (typeof status !== "string" || !Object.hasOwn(allowedTransitions, status)) {
    return Response.json({ error: "Choose a valid next appointment status." }, { status: 400 });
  }

  let database;
  try {
    database = await openClinicDatabase();
    await database.exec("BEGIN IMMEDIATE");
    const current = await database.prepare(`
      SELECT status FROM appointments WHERE id = ? AND doctor_id = ?
    `).get(appointmentId, user.userId) as { status: AppointmentStatus } | undefined;
    if (!current) {
      await database.exec("ROLLBACK");
      return Response.json({ error: "Appointment not found in your schedule." }, { status: 404 });
    }

    const allowed = allowedTransitions[current.status] ?? [];
    if (!allowed.includes(status as AppointmentStatus)) {
      await database.exec("ROLLBACK");
      return Response.json({ error: `An appointment cannot move from ${current.status} to ${status}.` }, { status: 409 });
    }
    if (current.status === "requested" && status === "scheduled") {
      const appointment = await database.prepare(`
        SELECT doctor_id, date, time_slot FROM appointments WHERE id = ?
      `).get(appointmentId) as { doctor_id: string; date: string; time_slot: string } | undefined;
      if (!appointment) {
        await database.exec("ROLLBACK");
        return Response.json({ error: "Appointment not found in your schedule." }, { status: 404 });
      }
      const collision = await database.prepare(`
        SELECT 1 FROM appointments
        WHERE doctor_id = ? AND date = ? AND time_slot = ? AND id <> ? AND status <> 'cancelled'
      `).get(appointment.doctor_id, appointment.date, appointment.time_slot, appointmentId);
      if (collision) {
        await database.exec("ROLLBACK");
        return Response.json({ error: "This slot is no longer available. Contact the patient to arrange another time." }, { status: 409 });
      }
    }
    const result = await database.prepare(`
      UPDATE appointments SET status = ? WHERE id = ? AND doctor_id = ? AND status = ?
    `).run(status, appointmentId, user.userId, current.status);
    if (result.changes !== 1) {
      await database.exec("ROLLBACK");
      return Response.json({ error: "The appointment changed. Refresh and try again." }, { status: 409 });
    }
    await database.exec("COMMIT");
    return Response.json({ id: appointmentId, status });
  } catch (error) {
    await database?.exec("ROLLBACK");
    if (error instanceof Error && /appointments_doctor_slot_unique_idx|UNIQUE constraint failed/i.test(error.message)) {
      return Response.json({ error: "This slot is no longer available. Contact the patient to arrange another time." }, { status: 409 });
    }
    console.error("Could not update a doctor's mobile appointment:", error);
    return Response.json({ error: "Unable to update this appointment." }, { status: 500 });
  } finally {
    database?.close();
  }
}
