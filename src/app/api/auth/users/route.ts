import { randomUUID } from "node:crypto";
import {
  forbiddenResponse,
  getAuthenticatedUser,
  getSessionToken,
  hashPassword,
  hashSessionToken,
  openAuthDatabase,
  unauthorizedResponse,
} from "@/lib/auth";

export const runtime = "nodejs";
const accountRoles = ["admin", "doctor", "receptionist", "pharmacist", "nurse", "lab_tech"] as const;

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin") return forbiddenResponse();
    const database = openAuthDatabase();
    try {
      const users = database.prepare(`
        SELECT au.user_id AS userId, u.name, au.login_id AS loginId, au.role,
          u.phone, u.specialization, au.is_active AS isActive,
          au.password_hash IS NOT NULL AS passwordConfigured
        FROM auth_users au JOIN users u ON u.id = au.user_id
        ORDER BY u.name COLLATE NOCASE
      `).all();
      return Response.json({ users }, { headers: { "Cache-Control": "no-store" } });
    } finally {
      database.close();
    }
  } catch (error) {
    console.error("Could not load ClinicOS login accounts:", error);
    return Response.json({ error: "Unable to load login accounts." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Account ID and new password are required." }, { status: 400 });
  }
  const input = body as {
    action?: unknown;
    userId?: unknown;
    password?: unknown;
    name?: unknown;
    loginId?: unknown;
    role?: unknown;
    phone?: unknown;
    specialization?: unknown;
    registrationNo?: unknown;
  };
  let database: ReturnType<typeof openAuthDatabase> | undefined;

  try {
    const user = getAuthenticatedUser(request);
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin") return forbiddenResponse();

    if (input.action === "create") {
      const name = typeof input.name === "string" ? input.name.trim() : "";
      const loginId = typeof input.loginId === "string" ? input.loginId.trim().toLowerCase() : "";
      const role = typeof input.role === "string" ? input.role : "";
      const phone = typeof input.phone === "string" ? input.phone.trim() : "";
      const specialization = typeof input.specialization === "string" ? input.specialization.trim() : "";
      const registrationNo = typeof input.registrationNo === "string" ? input.registrationNo.trim() : "";
      if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginId)) {
        return Response.json({ error: "Enter a valid name and login ID." }, { status: 400 });
      }
      if (!accountRoles.includes(role as (typeof accountRoles)[number])) {
        return Response.json({ error: "Select a valid staff role." }, { status: 400 });
      }
      if (phone.length > 32 || specialization.length > 120 || registrationNo.length > 80) {
        return Response.json({ error: "One or more account details exceed the allowed length." }, { status: 400 });
      }

      database = openAuthDatabase();
      database.exec("BEGIN IMMEDIATE");
      try {
        const existing = database.prepare(
          "SELECT 1 FROM users WHERE lower(email) = ?",
        ).get(loginId);
        if (existing) {
          database.exec("ROLLBACK");
          return Response.json({ error: "That login ID is already in use." }, { status: 409 });
        }
        const userId = randomUUID();
        const authUserId = `auth_${userId}`;
        database.prepare(`
          INSERT INTO users
            (id, name, email, role, phone, specialization, registration_no, is_active, centres_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
        `).run(
          userId,
          name,
          loginId,
          role,
          phone,
          specialization || null,
          registrationNo || null,
          JSON.stringify(["c1"]),
        );
        database.prepare(`
          INSERT INTO auth_users (id, user_id, login_id, role, is_active)
          VALUES (?, ?, ?, ?, 1)
        `).run(authUserId, userId, loginId, role);
        database.exec("COMMIT");
        return Response.json({
          user: {
            userId,
            name,
            loginId,
            role,
            phone,
            specialization: specialization || null,
            isActive: 1,
            passwordConfigured: 0,
          },
        }, { status: 201 });
      } catch (error) {
        if (database.isTransaction) database.exec("ROLLBACK");
        throw error;
      }
    }

  const userId = typeof input.userId === "string" ? input.userId.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!userId || password.length < 12) {
    return Response.json({ error: "The new password must contain at least 12 characters." }, { status: 400 });
  }

    const passwordHash = await hashPassword(password);
    database = openAuthDatabase();
    const target = database.prepare(
      "SELECT id FROM auth_users WHERE user_id = ? AND is_active = 1",
    ).get(userId) as { id: string } | undefined;
    if (!target) {
      return Response.json({ error: "Active user account not found." }, { status: 404 });
    }
    const result = database.prepare(`
      UPDATE auth_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_active = 1
    `).run(passwordHash, userId);
    if (result.changes !== 1) throw new Error("The doctor account could not be updated.");
    const currentToken = getSessionToken(request);
    if (target.id === user.id && currentToken) {
      database.prepare("DELETE FROM auth_sessions WHERE auth_user_id = ? AND token_hash <> ?")
        .run(target.id, hashSessionToken(currentToken));
    } else {
      database.prepare("DELETE FROM auth_sessions WHERE auth_user_id = ?").run(target.id);
    }
    return Response.json({ updated: true });
  } catch (error) {
    console.error("Could not update a ClinicOS login password:", error);
    return Response.json({ error: "Unable to update the login password." }, { status: 500 });
  } finally {
    database?.close();
  }
}
