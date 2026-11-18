import { randomUUID } from "node:crypto";
import { hashPassword, hashSessionToken } from "@/lib/auth";
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
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Invitation and password are required." }, { status: 400 });
  }

  const { token, password } = body as { token?: unknown; password?: unknown };
  if (typeof token !== "string" || !/^[\w-]{40,50}$/.test(token)) {
    return Response.json({ error: "This invitation is invalid or has expired. Ask the clinic for a new link." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    return Response.json({ error: "Choose a password between 12 and 128 characters." }, { status: 400 });
  }

  let database;
  try {
    database = await openPatientPortalDatabase();
    await database.exec("BEGIN IMMEDIATE");
    const invite = await database.prepare(`
      SELECT i.patient_id AS patientId
      FROM patient_portal_invites i
      LEFT JOIN patient_portal_accounts a ON a.patient_id = i.patient_id
      WHERE i.token_hash = ? AND i.used_at IS NULL AND i.expires_at > ? AND a.patient_id IS NULL
    `).get(hashSessionToken(token), new Date().toISOString()) as { patientId: string } | undefined;

    if (!invite) {
      await database.exec("ROLLBACK");
      return Response.json({ error: "This invitation is invalid or has expired. Ask the clinic for a new link." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    await database.prepare(`
      INSERT INTO patient_portal_accounts (id, patient_id, password_hash) VALUES (?, ?, ?)
    `).run(randomUUID(), invite.patientId, passwordHash);
    await database.prepare("UPDATE patient_portal_invites SET used_at = ? WHERE token_hash = ?")
      .run(new Date().toISOString(), hashSessionToken(token));
    const sessionToken = await createPatientPortalSession(database, invite.patientId);
    await database.exec("COMMIT");

    return Response.json(
      { activated: true },
      { headers: { "Set-Cookie": patientPortalSessionCookie(sessionToken, new URL(request.url).protocol === "https:") } },
    );
  } catch (error) {
    await database?.exec("ROLLBACK");
    console.error("Could not activate a patient portal account:", error);
    return Response.json({ error: "Unable to activate the patient app account." }, { status: 500 });
  } finally {
    database?.close();
  }
}
