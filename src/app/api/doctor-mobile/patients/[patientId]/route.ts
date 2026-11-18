import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { openClinicDatabase } from "@/lib/database";

export const runtime = "nodejs";

interface PatientRow {
  id: string;
  uhid: string;
  name: string;
  phone: string;
  age: number;
  gender: string;
  blood_group: string | null;
  allergies_json: string;
  chronic_conditions_json: string;
  last_visit: string | null;
  total_visits: number;
}

interface EncounterRow {
  id: string;
  date: string;
  department: string;
  chief_complaint: string;
  vitals_json: string | null;
  notes_json: string;
  diagnoses_json: string;
  follow_up_date: string | null;
}

interface PrescriptionRow {
  id: string;
  prescription_no: string;
  doctor_name: string;
  date: string;
  items_json: string;
  advice: string;
  follow_up_date: string | null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ patientId: string }> },
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role !== "doctor") {
    return Response.json({ error: "The doctor mobile workspace is available to doctor accounts only." }, { status: 403 });
  }
  const { patientId } = await context.params;

  let database;
  try {
    database = await openClinicDatabase();
    const hasRelationship = await database.prepare(`
      SELECT 1
      WHERE EXISTS (SELECT 1 FROM appointments WHERE patient_id = ? AND doctor_id = ?)
         OR EXISTS (SELECT 1 FROM encounters WHERE patient_id = ? AND doctor_id = ?)
         OR EXISTS (SELECT 1 FROM prescriptions WHERE patient_id = ? AND doctor_id = ?)
    `).get(patientId, user.userId, patientId, user.userId, patientId, user.userId);
    if (!hasRelationship) {
      return Response.json({ error: "This patient is not in your assigned care records." }, { status: 404 });
    }

    const patient = await database.prepare(`
      SELECT id, uhid, name, phone, age, gender, blood_group,
        allergies_json, chronic_conditions_json, last_visit, total_visits
      FROM patients WHERE id = ?
    `).get(patientId) as PatientRow | undefined;
    if (!patient) return Response.json({ error: "Patient not found." }, { status: 404 });

    const encounters = await database.prepare(`
      SELECT id, date, department, chief_complaint, notes_json,
        vitals_json, diagnoses_json, follow_up_date
      FROM encounters
      WHERE patient_id = ? AND doctor_id = ?
      ORDER BY date DESC
      LIMIT 20
    `).all(patientId, user.userId) as unknown as EncounterRow[];
    const prescriptions = await database.prepare(`
      SELECT id, prescription_no, doctor_name, date, items_json, advice, follow_up_date
      FROM prescriptions
      WHERE patient_id = ? AND doctor_id = ? AND status <> 'cancelled'
      ORDER BY date DESC
      LIMIT 20
    `).all(patientId, user.userId) as unknown as PrescriptionRow[];
    const activeAppointment = await database.prepare(`
      SELECT id, date, time_slot AS timeSlot, status
      FROM appointments
      WHERE patient_id = ? AND doctor_id = ? AND status IN ('scheduled', 'waiting', 'in-consultation')
      ORDER BY CASE status WHEN 'in-consultation' THEN 0 WHEN 'waiting' THEN 1 ELSE 2 END,
        date DESC, time_slot DESC
      LIMIT 1
    `).get(patientId, user.userId);

    return Response.json({
      patient: {
        id: patient.id,
        uhid: patient.uhid,
        name: patient.name,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
        bloodGroup: patient.blood_group,
        allergies: JSON.parse(patient.allergies_json) as string[],
        chronicConditions: JSON.parse(patient.chronic_conditions_json) as string[],
        lastVisit: patient.last_visit,
        totalVisits: patient.total_visits,
      },
      encounters: encounters.map((encounter) => ({
        id: encounter.id,
        date: encounter.date,
        department: encounter.department,
        chiefComplaint: encounter.chief_complaint,
        vitals: encounter.vitals_json ? JSON.parse(encounter.vitals_json) as Record<string, number> : null,
        notes: JSON.parse(encounter.notes_json) as Record<string, string>,
        diagnoses: JSON.parse(encounter.diagnoses_json) as unknown[],
        followUpDate: encounter.follow_up_date,
      })),
      prescriptions: prescriptions.map((prescription) => ({
        id: prescription.id,
        prescriptionNo: prescription.prescription_no,
        doctorName: prescription.doctor_name,
        date: prescription.date,
        medicines: JSON.parse(prescription.items_json) as unknown[],
        advice: prescription.advice,
        followUpDate: prescription.follow_up_date,
      })),
      activeAppointment,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load a doctor-authorized patient chart:", error);
    return Response.json({ error: "Unable to load this patient chart." }, { status: 500 });
  } finally {
    database?.close();
  }
}
