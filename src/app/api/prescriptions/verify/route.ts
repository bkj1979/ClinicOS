import {
  getPrescriptionFingerprint,
  readPrescriptionVerificationToken,
  type PrescriptionVerificationRecord,
} from "@/lib/prescription-verification";
import { openClinicDatabase } from "@/lib/database";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ valid: false }, { headers: { "Cache-Control": "no-store" } });
  }
  const token = body && typeof body === "object" && !Array.isArray(body) && "token" in body && typeof body.token === "string"
    ? body.token
    : null;
  if (!token || token.length > 2048) {
    return Response.json({ valid: false }, { headers: { "Cache-Control": "no-store" } });
  }

  let claims: ReturnType<typeof readPrescriptionVerificationToken>;
  try {
    claims = readPrescriptionVerificationToken(token);
  } catch (error) {
    console.error("Prescription verification signing key is not configured:", error);
    return Response.json(
      { error: "Prescription verification is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!claims) {
    return Response.json({ valid: false }, { headers: { "Cache-Control": "no-store" } });
  }

  let database: Awaited<ReturnType<typeof openClinicDatabase>> | undefined;
  try {
    database = await openClinicDatabase();
    const record = await database.prepare(`
      SELECT id, prescription_no, patient_id, patient_name, doctor_id, doctor_name,
             encounter_id, date, items_json, diagnoses_json, advice, follow_up_date, status
      FROM prescriptions
      WHERE id = ?
    `).get(claims.id) as (PrescriptionVerificationRecord & { status: string }) | undefined;

    if (
      !record ||
      record.status === "cancelled" ||
      getPrescriptionFingerprint(record) !== claims.fingerprint
    ) {
      return Response.json({ valid: false }, { headers: { "Cache-Control": "no-store" } });
    }

    const patientInitials = record.patient_name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0].toLocaleUpperCase())
      .slice(0, 3)
      .join("");

    return Response.json(
      {
        valid: true,
        prescriptionNo: record.prescription_no,
        date: record.date,
        doctorName: record.doctor_name,
        patientInitials,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not verify the prescription:", error);
    return Response.json(
      { error: "Unable to verify this prescription right now." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  } finally {
    database?.close();
  }
}
