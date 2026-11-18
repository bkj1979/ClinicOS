import { randomBytes } from "node:crypto";
import {
  hashSessionToken,
  SESSION_DURATION_SECONDS,
} from "@/lib/auth";
import { openClinicDatabase, type ClinicDatabase } from "@/lib/database";

export const PATIENT_PORTAL_SESSION_COOKIE = "clinicos_patient_session";
export const PATIENT_PORTAL_INVITE_DURATION_SECONDS = 60 * 60 * 24 * 7;

let remoteSchemaPromise: Promise<void> | undefined;

async function ensurePatientPortalSchema(database: ClinicDatabase): Promise<void> {
  await database.exec(`
    CREATE TABLE IF NOT EXISTS patient_portal_accounts (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS patient_portal_invites (
      token_hash TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      issued_by TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS patient_portal_invites_expiry_idx
      ON patient_portal_invites(expires_at);
    CREATE TABLE IF NOT EXISTS patient_portal_sessions (
      token_hash TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS patient_portal_sessions_expiry_idx
      ON patient_portal_sessions(expires_at);
  `);
}

export async function openPatientPortalDatabase(): Promise<ClinicDatabase> {
  const database = await openClinicDatabase();
  try {
    if (process.env.TURSO_DATABASE_URL || process.env.TURSO_AUTH_TOKEN) {
      remoteSchemaPromise ??= ensurePatientPortalSchema(database);
      try {
        await remoteSchemaPromise;
      } catch (error) {
        remoteSchemaPromise = undefined;
        throw error;
      }
    } else {
      await ensurePatientPortalSchema(database);
    }
    return database;
  } catch (error) {
    database.close();
    throw error;
  }
}

export function getPatientPortalSessionToken(request: Request): string | undefined {
  const cookie = request.headers.get("cookie");
  const entry = cookie?.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${PATIENT_PORTAL_SESSION_COOKIE}=`));
  if (!entry) return undefined;
  try {
    return decodeURIComponent(entry.slice(PATIENT_PORTAL_SESSION_COOKIE.length + 1));
  } catch {
    return undefined;
  }
}

export async function getAuthenticatedPortalPatient(request: Request): Promise<{
  id: string;
  name: string;
  uhid: string;
} | null> {
  const token = getPatientPortalSessionToken(request);
  if (!token) return null;

  const database = await openPatientPortalDatabase();
  try {
    const patient = await database.prepare(`
      SELECT p.id, p.name, p.uhid
      FROM patient_portal_sessions s
      JOIN patients p ON p.id = s.patient_id
      JOIN patient_portal_accounts a ON a.patient_id = p.id
      WHERE s.token_hash = ? AND s.expires_at > ?
    `).get(hashSessionToken(token), new Date().toISOString()) as
      { id: string; name: string; uhid: string } | undefined;
    return patient ?? null;
  } finally {
    database.close();
  }
}

export async function createPatientPortalSession(
  database: ClinicDatabase,
  patientId: string,
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString();
  await database.prepare(`
    INSERT INTO patient_portal_sessions (token_hash, patient_id, expires_at) VALUES (?, ?, ?)
  `).run(hashSessionToken(token), patientId, expiresAt);
  await database.prepare("DELETE FROM patient_portal_sessions WHERE expires_at <= ?")
    .run(new Date().toISOString());
  return token;
}

export function patientPortalSessionCookie(token: string, secure: boolean): string {
  return `${PATIENT_PORTAL_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION_SECONDS}${secure ? "; Secure" : ""}`;
}

export function expiredPatientPortalSessionCookie(secure: boolean): string {
  return `${PATIENT_PORTAL_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

export async function createPatientPortalInvite(
  database: ClinicDatabase,
  patientId: string,
  issuedBy: string,
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + PATIENT_PORTAL_INVITE_DURATION_SECONDS * 1000).toISOString();
  await database.prepare(`
    UPDATE patient_portal_invites SET used_at = ? WHERE patient_id = ? AND used_at IS NULL
  `).run(new Date().toISOString(), patientId);
  await database.prepare(`
    INSERT INTO patient_portal_invites (token_hash, patient_id, issued_by, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(hashSessionToken(token), patientId, issuedBy, expiresAt);
  return token;
}
