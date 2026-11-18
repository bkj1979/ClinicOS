import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { openClinicDatabase } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role !== "doctor") {
    return Response.json({ error: "The doctor mobile workspace is available to doctor accounts only." }, { status: 403 });
  }

  let database;
  try {
    database = await openClinicDatabase();
    const today = new Date().toISOString().slice(0, 10);
    const throughDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const appointments = await database.prepare(`
      SELECT id, patient_id AS patientId, patient_name AS patientName,
        patient_age AS patientAge, patient_gender AS patientGender,
        date, time_slot AS timeSlot, type, status, token_number AS tokenNumber,
        chief_complaint AS chiefComplaint
      FROM appointments
      WHERE doctor_id = ? AND date >= ? AND date <= ?
      ORDER BY date ASC, time_slot ASC
    `).all(user.userId, today, throughDate);

    return Response.json({
      doctor: { name: user.name, specialization: user.specialization },
      today,
      appointments,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load the doctor mobile dashboard:", error);
    return Response.json({ error: "Unable to load your appointments." }, { status: 500 });
  } finally {
    database?.close();
  }
}
