import { NextResponse } from "next/server";
import {
  createOAuthState,
  createPkceChallenge,
  createPkceVerifier,
  googleOAuthConfiguration,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  oauthCookie,
} from "@/lib/google-oauth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const configuration = googleOAuthConfiguration();
  if (!configuration) {
    return NextResponse.redirect(new URL("/login?error=google_unconfigured", request.url));
  }

  const state = createOAuthState();
  const verifier = createPkceVerifier();
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.searchParams.set("client_id", configuration.clientId);
  authorizationUrl.searchParams.set("redirect_uri", configuration.redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", createPkceChallenge(verifier));
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("prompt", "select_account");

  const secure = new URL(configuration.redirectUri).protocol === "https:";
  const response = NextResponse.redirect(authorizationUrl);
  response.headers.append("Set-Cookie", oauthCookie(GOOGLE_STATE_COOKIE, state, secure));
  response.headers.append("Set-Cookie", oauthCookie(GOOGLE_VERIFIER_COOKIE, verifier, secure));
  return response;
}
