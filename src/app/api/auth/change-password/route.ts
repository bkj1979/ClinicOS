import {
  getAuthenticatedUser,
  getSessionToken,
  hashPassword,
  hashSessionToken,
  openAuthDatabase,
  unauthorizedResponse,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Enter your current and new passwords." }, { status: 400 });
  }
  const input = body as { currentPassword?: unknown; newPassword?: unknown };
  const currentPassword = typeof input.currentPassword === "string" ? input.currentPassword : "";
  const newPassword = typeof input.newPassword === "string" ? input.newPassword : "";
  if (newPassword.length < 12) {
    return Response.json({ error: "The new password must contain at least 12 characters." }, { status: 400 });
  }

  let database: ReturnType<typeof openAuthDatabase> | undefined;
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return unauthorizedResponse();
    database = openAuthDatabase();
    const account = database.prepare(
      "SELECT password_hash AS passwordHash FROM auth_users WHERE id = ?",
    ).get(user.id) as { passwordHash: string | null } | undefined;
    if (!account?.passwordHash || !(await verifyPassword(currentPassword, account.passwordHash))) {
      return Response.json({ error: "Your current password is incorrect." }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    database.prepare(`
      UPDATE auth_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(passwordHash, user.id);
    const token = getSessionToken(request);
    if (token) {
      database.prepare("DELETE FROM auth_sessions WHERE auth_user_id = ? AND token_hash <> ?")
        .run(user.id, hashSessionToken(token));
    }
    return Response.json({ updated: true });
  } catch (error) {
    console.error("Could not change the ClinicOS account password:", error);
    return Response.json({ error: "Unable to change your password." }, { status: 500 });
  } finally {
    database?.close();
  }
}
