import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSession, openAuthDatabase, sessionCookie } from "@/lib/auth";
import {
  clearOAuthCookie,
  googleOAuthConfiguration,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  readRequestCookie,
} from "@/lib/google-oauth";

export const runtime = "nodejs";

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  email?: string;
  email_verified?: boolean;
}

function sameState(expected: string | undefined, actual: string | null): boolean {
  if (!expected || !actual) return false;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

function callbackRedirect(
  request: Request,
  configuration: NonNullable<ReturnType<typeof googleOAuthConfiguration>>,
  query: string,
  sessionToken?: string,
): NextResponse {
  const secure = new URL(configuration.redirectUri).protocol === "https:";
  const response = NextResponse.redirect(new URL(query, request.url));
  response.headers.append("Set-Cookie", clearOAuthCookie(GOOGLE_STATE_COOKIE, secure));
  response.headers.append("Set-Cookie", clearOAuthCookie(GOOGLE_VERIFIER_COOKIE, secure));
  if (sessionToken) response.headers.append("Set-Cookie", sessionCookie(sessionToken, secure));
  return response;
}

export async function GET(request: Request) {
  const configuration = googleOAuthConfiguration();
  if (!configuration) return NextResponse.redirect(new URL("/login?error=google_unconfigured", request.url));

  const url = new URL(request.url);
  if (url.searchParams.has("error")) {
    return callbackRedirect(request, configuration, "/login?error=google_cancelled");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = readRequestCookie(request, GOOGLE_STATE_COOKIE);
  const verifier = readRequestCookie(request, GOOGLE_VERIFIER_COOKIE);
  if (!code || !sameState(expectedState, state) || !verifier) {
    return callbackRedirect(request, configuration, "/login?error=google_invalid_state");
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: configuration.clientId,
        client_secret: configuration.clientSecret,
        redirect_uri: configuration.redirectUri,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const tokenResult = await tokenResponse.json() as GoogleTokenResponse;
    if (!tokenResponse.ok || !tokenResult.access_token) {
      console.error("Google OAuth code exchange failed:", tokenResult.error || tokenResponse.status);
      return callbackRedirect(request, configuration, "/login?error=google_failed");
    }

    const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenResult.access_token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const googleUser = await userResponse.json() as GoogleUserInfo;
    if (!userResponse.ok || googleUser.email_verified !== true || !googleUser.email) {
      return callbackRedirect(request, configuration, "/login?error=google_unverified");
    }

    const database = await openAuthDatabase();
    try {
      const account = await database.prepare(`
        SELECT au.id
        FROM auth_users au
        JOIN users u ON u.id = au.user_id
        WHERE au.login_id = ? AND au.is_active = 1 AND u.is_active = 1
      `).get(googleUser.email.trim().toLowerCase()) as { id: string } | undefined;
      if (!account) {
        return callbackRedirect(request, configuration, "/login?error=google_account_not_found");
      }
      const session = await createSession(database, account.id);
      return callbackRedirect(request, configuration, "/dashboard", session.token);
    } finally {
      database.close();
    }
  } catch (error) {
    console.error("Google OAuth sign-in failed:", error);
    return callbackRedirect(request, configuration, "/login?error=google_failed");
  }
}
