import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import {
  createPrescriptionVerificationToken,
  getPrescriptionFingerprint,
  type PrescriptionVerificationRecord,
} from "@/lib/prescription-verification";
import { openClinicDatabase } from "@/lib/database";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!await getAuthenticatedUser(request)) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body) || !("prescriptionId" in body) || typeof body.prescriptionId !== "string" || !body.prescriptionId.trim()) {
    return Response.json({ error: "A prescription ID is required." }, { status: 400 });
  }

  let database: Awaited<ReturnType<typeof openClinicDatabase>> | undefined;
  try {
    database = await openClinicDatabase();
    const record = await database.prepare(`
      SELECT id, prescription_no, patient_id, patient_name, doctor_id, doctor_name,
             encounter_id, date, items_json, diagnoses_json, advice, follow_up_date
      FROM prescriptions
      WHERE id = ?
    `).get(body.prescriptionId.trim()) as PrescriptionVerificationRecord | undefined;

    if (!record) {
      return Response.json({ error: "Prescription not found in the medical record." }, { status: 404 });
    }

    const fingerprint = getPrescriptionFingerprint(record);
    const token = createPrescriptionVerificationToken(record.id, fingerprint);
    return Response.json({ token });
  } catch (error) {
    console.error("Could not create a prescription verification code:", error);
    const message = error instanceof Error ? error.message : "Unable to create the verification code.";
    const status = message.includes("CLINICOS_PRESCRIPTION_SIGNING_KEY") ? 503 : 500;
    return Response.json({ error: message }, { status });
  } finally {
    database?.close();
  }
}
