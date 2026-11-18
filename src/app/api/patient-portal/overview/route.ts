import { getAuthenticatedPortalPatient, openPatientPortalDatabase } from "@/lib/patient-portal";
import type { PrescriptionItem } from "@/lib/types";

export const runtime = "nodejs";
const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const patient = await getAuthenticatedPortalPatient(request);
  if (!patient) {
    return Response.json({ error: "Sign in to view your patient app." }, { status: 401, headers: noStoreHeaders });
  }

  let database;
  try {
    database = await openPatientPortalDatabase();
    const profile = await database.prepare(`
      SELECT id, uhid, name FROM patients WHERE id = ?
    `).get(patient.id);
    const appointments = await database.prepare(`
      SELECT id, doctor_name AS doctorName, department, date, time_slot AS timeSlot,
        status, type
      FROM appointments
      WHERE patient_id = ?
      ORDER BY date DESC, time_slot ASC
      LIMIT 30
    `).all(patient.id);
    const prescriptions = await database.prepare(`
      SELECT id, prescription_no AS prescriptionNo, doctor_name AS doctorName,
        date, items_json AS itemsJson, advice, follow_up_date AS followUpDate, status
      FROM prescriptions
      WHERE patient_id = ? AND status <> 'cancelled'
      ORDER BY date DESC
      LIMIT 20
    `).all(patient.id) as Array<{
      id: string;
      prescriptionNo: string;
      doctorName: string;
      date: string;
      itemsJson: string;
      advice: string;
      followUpDate: string | null;
      status: string;
    }>;
    const doctors = await database.prepare(`
      SELECT id, name, specialization FROM users WHERE role = 'doctor' AND is_active = 1 ORDER BY name
    `).all();
    const occupiedSlots = await database.prepare(`
      SELECT doctor_id AS doctorId, date, time_slot AS timeSlot
      FROM appointments
      WHERE status <> 'cancelled' AND date >= ? AND date <= ?
    `).all(new Date().toISOString().slice(0, 10), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

    return Response.json({
      patient: profile,
      appointments,
      prescriptions: prescriptions.map(({ itemsJson, ...prescription }) => ({
        ...prescription,
        medicines: JSON.parse(itemsJson) as PrescriptionItem[],
      })),
      doctors,
      occupiedSlots,
    }, { headers: noStoreHeaders });
  } catch (error) {
    console.error("Could not load patient portal data:", error);
    return Response.json({ error: "Unable to load your patient app data." }, { status: 500, headers: noStoreHeaders });
  } finally {
    database?.close();
  }
}
