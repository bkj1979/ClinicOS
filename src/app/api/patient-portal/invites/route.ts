import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { createPatientPortalInvite, openPatientPortalDatabase } from "@/lib/patient-portal";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const staffUser = await getAuthenticatedUser(request);
  if (!staffUser) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const patientId = body && typeof body === "object" && !Array.isArray(body)
    ? (body as { patientId?: unknown }).patientId
    : undefined;
  if (typeof patientId !== "string" || !patientId.trim()) {
    return Response.json({ error: "A patient ID is required." }, { status: 400 });
  }

  let database;
  try {
    database = await openPatientPortalDatabase();
    const patient = await database.prepare("SELECT id FROM patients WHERE id = ?")
      .get(patientId.trim()) as { id: string } | undefined;
    if (!patient) return Response.json({ error: "Patient not found." }, { status: 404 });

    const token = await createPatientPortalInvite(database, patient.id, staffUser.userId);
    const inviteUrl = new URL(`/patient/activate?token=${encodeURIComponent(token)}`, request.url).toString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    return Response.json({ inviteUrl, expiresAt });
  } catch (error) {
    console.error("Could not create a patient portal invitation:", error);
    return Response.json({ error: "Unable to create the patient app invitation." }, { status: 500 });
  } finally {
    database?.close();
  }
}
