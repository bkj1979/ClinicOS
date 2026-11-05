import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { AuthUser } from "./auth-types";
import { isRemoteDatabaseConfigured, openClinicDatabase, type ClinicDatabase } from "./database";

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = "clinicos_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
let remoteAuthSchemaPromise: Promise<void> | undefined;

export async function openAuthDatabase(): Promise<ClinicDatabase> {
  const database = await openClinicDatabase();
  try {
    if (isRemoteDatabaseConfigured()) {
      remoteAuthSchemaPromise ??= ensureAuthSchema(database);
      try {
        await remoteAuthSchemaPromise;
      } catch (error) {
        remoteAuthSchemaPromise = undefined;
        throw error;
      }
    } else {
      await ensureAuthSchema(database);
    }
    return database;
  } catch (error) {
    database.close();
    throw error;
  }
}

export async function ensureAuthSchema(database: ClinicDatabase): Promise<void> {
  await database.exec(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
      login_id TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT,
      role TEXT NOT NULL CHECK (role IN ('doctor', 'receptionist', 'pharmacist', 'nurse', 'admin')),
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY,
      auth_user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx ON auth_sessions(expires_at);
    UPDATE users SET email = CASE id
      WHEN 'u4' THEN 'mohammed.irfan@clinicos.in'
      WHEN 'u5' THEN 'kavitha.nair@clinicos.in'
      WHEN 'u6' THEN 'meera.joshi@clinicos.in'
      WHEN 'u7' THEN 'suresh.kumar@clinicos.in'
      WHEN 'u8' THEN 'lakshmi.devi@clinicos.in'
      ELSE email
    END
    WHERE id IN ('u4', 'u5', 'u6', 'u7', 'u8')
      AND email <> CASE id
        WHEN 'u4' THEN 'mohammed.irfan@clinicos.in'
        WHEN 'u5' THEN 'kavitha.nair@clinicos.in'
        WHEN 'u6' THEN 'meera.joshi@clinicos.in'
        WHEN 'u7' THEN 'suresh.kumar@clinicos.in'
        WHEN 'u8' THEN 'lakshmi.devi@clinicos.in'
      END;
  `);

  const authTable = await database.prepare(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'auth_users'",
  ).get() as { sql: string } | undefined;
  if (!isRemoteDatabaseConfigured() && authTable?.sql.includes("admin_doctor")) {
    await database.exec("PRAGMA foreign_keys = OFF");
    try {
      await database.exec(`
        BEGIN IMMEDIATE;
        CREATE TABLE auth_users_replacement (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
          login_id TEXT NOT NULL UNIQUE COLLATE NOCASE,
          password_hash TEXT,
          role TEXT NOT NULL CHECK (role IN ('doctor', 'receptionist', 'pharmacist', 'nurse', 'admin')),
          is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO auth_users_replacement (id, user_id, login_id, password_hash, role, is_active, created_at, updated_at)
        SELECT au.id, au.user_id, lower(u.email), au.password_hash,
          CASE u.role
            WHEN 'doctor' THEN 'doctor'
            WHEN 'receptionist' THEN 'receptionist'
            WHEN 'pharmacist' THEN 'pharmacist'
            WHEN 'nurse' THEN 'nurse'
            WHEN 'admin' THEN 'admin'
            ELSE 'doctor'
          END,
          au.is_active, au.created_at, au.updated_at
        FROM auth_users au JOIN users u ON u.id = au.user_id;
        DELETE FROM auth_sessions;
        DROP TABLE auth_users;
        ALTER TABLE auth_users_replacement RENAME TO auth_users;
        COMMIT;
      `);
    } catch (error) {
      await database.exec("ROLLBACK");
      throw error;
    } finally {
      await database.exec("PRAGMA foreign_keys = ON");
    }
  }

  await database.prepare(`
    INSERT INTO auth_users (id, user_id, login_id, role, is_active)
    SELECT 'auth_' || u.id, u.id, lower(u.email), u.role, u.is_active
    FROM users u
    WHERE u.role IN ('doctor', 'receptionist', 'pharmacist', 'nurse', 'admin')
    ON CONFLICT(user_id) DO UPDATE SET
      login_id = excluded.login_id,
      role = excluded.role,
      is_active = excluded.is_active,
      updated_at = CURRENT_TIMESTAMP
  `).run();
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex, ...extra] = storedHash.split(":");
  if (!saltHex || !hashHex || extra.length > 0 || !/^[\da-f]{32}$/i.test(saltHex) || !/^[\da-f]{128}$/i.test(hashHex)) {
    return false;
  }
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length) as Buffer;
  return timingSafeEqual(actual, expected);
}

function requestCookie(request: Request, name: string): string | undefined {
  const cookie = request.headers.get("cookie");
  if (!cookie) return undefined;
  const entry = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!entry) return undefined;
  try {
    return decodeURIComponent(entry.slice(name.length + 1));
  } catch {
    return undefined;
  }
}

export function getSessionToken(request: Request): string | undefined {
  return requestCookie(request, SESSION_COOKIE);
}

export async function createSession(database: ClinicDatabase, authUserId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  await database.prepare(
    "INSERT INTO auth_sessions (token_hash, auth_user_id, expires_at) VALUES (?, ?, ?)",
  ).run(hashSessionToken(token), authUserId, expiresAt.toISOString());
  await database.prepare("DELETE FROM auth_sessions WHERE expires_at <= ?").run(new Date().toISOString());
  return { token, expiresAt };
}

export function sessionCookie(token: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DURATION_SECONDS}${secure ? "; Secure" : ""}`;
}

export function expiredSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

export async function getAuthenticatedUser(request: Request): Promise<AuthUser | null> {
  const token = getSessionToken(request);
  if (!token) return null;

  const database = await openAuthDatabase();
  try {
    const user = await database.prepare(`
      SELECT au.id, au.user_id AS userId, u.name, au.login_id AS loginId, au.role,
        u.phone, u.specialization
      FROM auth_sessions s
      JOIN auth_users au ON au.id = s.auth_user_id
      JOIN users u ON u.id = au.user_id
      WHERE s.token_hash = ? AND s.expires_at > ? AND au.is_active = 1 AND u.is_active = 1
    `).get(hashSessionToken(token), new Date().toISOString()) as AuthUser | undefined;
    return user ?? null;
  } finally {
    database.close();
  }
}

export function unauthorizedResponse(): Response {
  return Response.json({ error: "Please sign in to continue." }, { status: 401 });
}

export function forbiddenResponse(): Response {
  return Response.json({ error: "Administrator access is required." }, { status: 403 });
}

export async function isInitialSetupRequired(): Promise<boolean> {
  const database = await openAuthDatabase();
  try {
    const result = await database.prepare(`
      SELECT COUNT(*) AS remaining
      FROM auth_users
      WHERE role = 'admin' AND is_active = 1 AND password_hash IS NULL
    `).get() as { remaining: number };
    return result.remaining > 0;
  } finally {
    database.close();
  }
}
