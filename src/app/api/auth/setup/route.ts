import { timingSafeEqual } from "node:crypto";
import { hashPassword, isInitialSetupRequired, openAuthDatabase } from "@/lib/auth";
import { isRemoteDatabaseConfigured } from "@/lib/database";

export const runtime = "nodejs";

function isLocalRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname.toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export async function GET(request: Request) {
  const remote = isRemoteDatabaseConfigured();
  if (!remote && !isLocalRequest(request)) {
    return Response.json({ error: "Initial account setup is only available from this computer." }, { status: 403 });
  }
  try {
    const database = await openAuthDatabase();
    try {
      const admins = await database.prepare(`
        SELECT u.name, au.login_id AS loginId
        FROM auth_users au JOIN users u ON u.id = au.user_id
        WHERE au.role = 'admin' AND au.is_active = 1 AND au.password_hash IS NULL
        ORDER BY u.name
      `).all();
      const required = await isInitialSetupRequired();
      if (remote && required && (!process.env.CLINICOS_SETUP_KEY || process.env.CLINICOS_SETUP_KEY.length < 32)) {
        return Response.json({ error: "Initial account setup is not securely configured. Set CLINICOS_SETUP_KEY in the deployment environment." }, { status: 503 });
      }
      return Response.json({ required, admins, setupKeyRequired: remote && required });
    } finally {
      database.close();
    }
  } catch (error) {
    console.error("Could not check the initial account setup:", error);
    return Response.json({ error: "Unable to check initial account setup." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const remote = isRemoteDatabaseConfigured();
  if (!remote && !isLocalRequest(request)) {
    return Response.json({ error: "Initial account setup is only available from this computer." }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Administrator account credentials are required." }, { status: 400 });
  }
  const setupBody = body as { credentials?: unknown; setupKey?: unknown };
  if (remote) {
    const expectedKey = process.env.CLINICOS_SETUP_KEY || "";
    const submittedKey = typeof setupBody.setupKey === "string" ? setupBody.setupKey : "";
    const expectedBuffer = Buffer.from(expectedKey);
    const submittedBuffer = Buffer.from(submittedKey);
    if (expectedBuffer.length < 32 || expectedBuffer.length !== submittedBuffer.length || !timingSafeEqual(expectedBuffer, submittedBuffer)) {
      return Response.json({ error: "The deployment setup key is invalid." }, { status: 403 });
    }
  }
  const credentials = setupBody.credentials;
  if (!Array.isArray(credentials) || credentials.length < 1) {
    return Response.json({ error: "Set passwords for all administrator accounts shown." }, { status: 400 });
  }

  const normalized = credentials.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const item = value as { loginId?: unknown; password?: unknown };
    return {
      loginId: typeof item.loginId === "string" ? item.loginId.trim().toLowerCase() : "",
      password: typeof item.password === "string" ? item.password : "",
    };
  });
  if (normalized.some((item) => !item?.loginId || item.password.length < 12)) {
    return Response.json({ error: "Each administrator password must contain at least 12 characters." }, { status: 400 });
  }
  const setupCredentials = normalized as Array<{ loginId: string; password: string }>;
  if (new Set(setupCredentials.map((item) => item.loginId)).size !== setupCredentials.length) {
    return Response.json({ error: "Each administrator account must have a unique login ID." }, { status: 400 });
  }

  let database: Awaited<ReturnType<typeof openAuthDatabase>> | undefined;
  try {
    const hashes = await Promise.all(setupCredentials.map((item) => hashPassword(item.password)));
    database = await openAuthDatabase();
    await database.exec("BEGIN IMMEDIATE");
    const admins = await database.prepare(`
      SELECT login_id AS loginId FROM auth_users
      WHERE role = 'admin' AND is_active = 1 AND password_hash IS NULL
      ORDER BY login_id
    `).all() as Array<{ loginId: string }>;
    if (admins.length !== setupCredentials.length || !admins.every((admin) => setupCredentials.some((item) => item.loginId === admin.loginId))) {
      await database.exec("ROLLBACK");
      return Response.json({ error: "Initial setup is no longer available. Please sign in." }, { status: 409 });
    }

    const update = database.prepare(`
      UPDATE auth_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE login_id = ? AND role = 'admin' AND password_hash IS NULL
    `);
    for (const [index, credential] of setupCredentials.entries()) {
      const result = await update.run(hashes[index], credential.loginId);
      if (result.changes !== 1) {
        await database.exec("ROLLBACK");
        return Response.json({ error: "Initial setup could not be completed. Refresh and try again." }, { status: 409 });
      }
    }
    await database.exec("COMMIT");
    return Response.json({ configured: true });
  } catch (error) {
    if (database) await database.exec("ROLLBACK");
    console.error("Could not complete the initial administrator setup:", error);
    return Response.json({ error: "Unable to complete initial administrator setup." }, { status: 500 });
  } finally {
    database?.close();
  }
}
