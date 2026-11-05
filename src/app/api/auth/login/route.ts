import {
  createSession,
  openAuthDatabase,
  sessionCookie,
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
    return Response.json({ error: "Enter your login ID and password." }, { status: 400 });
  }

  const input = body as { loginId?: unknown; password?: unknown };
  const loginId = typeof input.loginId === "string" ? input.loginId.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!loginId || !password) {
    return Response.json({ error: "Enter your login ID and password." }, { status: 400 });
  }

  const database = openAuthDatabase();
  try {
    const account = database.prepare(`
      SELECT au.id, au.password_hash AS passwordHash
      FROM auth_users au JOIN users u ON u.id = au.user_id
      WHERE au.login_id = ? AND au.is_active = 1 AND u.is_active = 1
    `).get(loginId) as { id: string; passwordHash: string | null } | undefined;
    if (!account?.passwordHash || !(await verifyPassword(password, account.passwordHash))) {
      return Response.json({ error: "The login ID or password is incorrect." }, { status: 401 });
    }

    const session = createSession(database, account.id);
    return Response.json(
      { signedIn: true },
      { headers: { "Set-Cookie": sessionCookie(session.token, new URL(request.url).protocol === "https:") } },
    );
  } catch (error) {
    console.error("Could not sign in to ClinicOS:", error);
    return Response.json({ error: "Unable to sign in right now." }, { status: 500 });
  } finally {
    database.close();
  }
}
