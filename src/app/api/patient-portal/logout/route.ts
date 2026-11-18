import { hashSessionToken } from "@/lib/auth";
import {
  expiredPatientPortalSessionCookie,
  getPatientPortalSessionToken,
  openPatientPortalDatabase,
} from "@/lib/patient-portal";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let database;
  try {
    database = await openPatientPortalDatabase();
    const token = getPatientPortalSessionToken(request);
    if (token) {
      await database.prepare("DELETE FROM patient_portal_sessions WHERE token_hash = ?")
        .run(hashSessionToken(token));
    }
    return Response.json(
      { signedOut: true },
      { headers: { "Set-Cookie": expiredPatientPortalSessionCookie(new URL(request.url).protocol === "https:") } },
    );
  } catch (error) {
    console.error("Could not sign out of the patient portal:", error);
    return Response.json({ error: "Unable to sign out right now." }, { status: 500 });
  } finally {
    database?.close();
  }
}
