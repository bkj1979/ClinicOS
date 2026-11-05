import {
  expiredSessionCookie,
  getSessionToken,
  hashSessionToken,
  openAuthDatabase,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = getSessionToken(request);
  const database = openAuthDatabase();
  try {
    if (token) {
      database.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").run(hashSessionToken(token));
    }
    return Response.json(
      { signedOut: true },
      { headers: { "Set-Cookie": expiredSessionCookie(new URL(request.url).protocol === "https:") } },
    );
  } catch (error) {
    console.error("Could not sign out of ClinicOS:", error);
    return Response.json({ error: "Unable to sign out right now." }, { status: 500 });
  } finally {
    database.close();
  }
}
