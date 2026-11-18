import { hashPassword, verifyPassword } from "@/lib/auth";
import {
  createPatientPortalSession,
  openPatientPortalDatabase,
  patientPortalSessionCookie,
} from "@/lib/patient-portal";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const uhid = body && typeof body === "object" && !Array.isArray(body)
    ? (body as { uhid?: unknown }).uhid
    : undefined;
  const password = body && typeof body === "object" && !Array.isArray(body)
    ? (body as { password?: unknown }).password
    : undefined;
  if (typeof uhid !== "string" || !uhid.trim() || typeof password !== "string" || !password) {
    return Response.json({ error: "Enter your patient ID and password." }, { status: 400 });
  }
  if (uhid.length > 100 || password.length > 128) {
    return Response.json({ error: "Invalid patient ID or password." }, { status: 400 });
  }

  let database;
  try {
    database = await openPatientPortalDatabase();
    const account = await database.prepare(`
      SELECT a.patient_id AS patientId, a.password_hash AS passwordHash
      FROM patient_portal_accounts a
      JOIN patients p ON p.id = a.patient_id
      WHERE UPPER(p.uhid) = UPPER(?)
    `).get(uhid.trim()) as { patientId: string; passwordHash: string } | undefined;
    const matches = account
      ? await verifyPassword(password, account.passwordHash)
      : await hashPassword(password).then(() => false);
    if (!account || !matches) {
      return Response.json({ error: "Patient ID or password is incorrect." }, { status: 401 });
    }

    const token = await createPatientPortalSession(database, account.patientId);
    return Response.json(
      { signedIn: true },
      { headers: { "Set-Cookie": patientPortalSessionCookie(token, new URL(request.url).protocol === "https:") } },
    );
  } catch (error) {
    console.error("Could not sign in to the patient portal:", error);
    return Response.json({ error: "Unable to sign in right now." }, { status: 500 });
  } finally {
    database?.close();
  }
}
