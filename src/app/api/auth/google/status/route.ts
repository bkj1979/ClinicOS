import { googleOAuthConfiguration } from "@/lib/google-oauth";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(
    { enabled: googleOAuthConfiguration() !== null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
