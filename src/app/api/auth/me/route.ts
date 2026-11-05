import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) return unauthorizedResponse();
    return Response.json({ user }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load the signed-in ClinicOS user:", error);
    return Response.json({ error: "Unable to load your account." }, { status: 500 });
  }
}
