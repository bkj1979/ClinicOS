"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, Stethoscope } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    const url = new URL(window.location.href);
    const oauthErrors: Record<string, string> = {
      google_unconfigured: "Google sign-in hasn’t been configured yet. Use your clinic ID and password or ask your administrator.",
      google_cancelled: "Google sign-in was cancelled.",
      google_invalid_state: "The Google sign-in session expired or could not be verified. Please try again.",
      google_failed: "Google sign-in could not be completed. Please try again.",
      google_unverified: "Google could not verify the email address for that account.",
      google_account_not_found: "That verified Google email is not linked to an active ClinicOS account. Ask your administrator to add the matching login ID.",
    };
    const oauthError = url.searchParams.get("error");
    if (oauthError) {
      Promise.resolve().then(() => {
        if (active) setError(oauthErrors[oauthError] || "Sign-in could not be completed.");
      });
      window.history.replaceState({}, "", "/login");
    }

    Promise.all([
      fetch("/api/auth/setup", { cache: "no-store" }).then(async (response) => {
        const result = await response.json() as { required?: boolean; error?: string };
        if (!response.ok) throw new Error(result.error || "Unable to check account setup.");
        if (active && result.required) router.replace("/setup");
      }),
      fetch("/api/auth/google/status", { cache: "no-store" }).then(async (response) => {
        const result = await response.json() as { enabled?: boolean };
        if (active && response.ok) setGoogleEnabled(Boolean(result.enabled));
      }),
    ]).catch((cause: unknown) => {
      if (active) setError((current) => current || (cause instanceof Error ? cause.message : "Unable to connect to ClinicOS."));
    });
    return () => { active = false; };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to sign in.");
      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute -left-40 top-16 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-36 right-0 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl" />
        <Link href="/" className="relative flex w-fit items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500"><Stethoscope className="h-6 w-6" /></span>
          <span><span className="block text-xl font-bold">ClinicOS</span><span className="block text-[10px] uppercase tracking-[0.2em] text-slate-400">Practice, connected</span></span>
        </Link>
        <div className="relative max-w-xl pb-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-emerald-200"><ShieldCheck className="h-4 w-4" /> Private workspace for your care team</div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight xl:text-6xl">Everything in place. <span className="text-emerald-300">Care in focus.</span></h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">A connected workspace for your clinic&apos;s appointments, patient records, consultations, and team.</p>
          <div className="mt-10 flex items-center gap-4 border-t border-white/10 pt-6">
            <div className="flex -space-x-2">
              {["PS", "RP", "AR"].map((initials, index) => <span key={initials} className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-950 text-[10px] font-bold ${index === 0 ? "bg-emerald-300 text-emerald-950" : index === 1 ? "bg-sky-300 text-sky-950" : "bg-violet-300 text-violet-950"}`}>{initials}</span>)}
            </div>
            <p className="text-sm text-slate-300"><span className="font-semibold text-white">One thoughtful workspace</span><br />for your whole clinical day</p>
          </div>
        </div>
        <p className="relative text-xs text-slate-500">Authorized clinic team members only</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-700">
            <ArrowLeft className="h-4 w-4" /> Back to ClinicOS
          </Link>
          <div className="mb-8 lg:hidden">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white"><Stethoscope className="h-6 w-6" /></span>
            <p className="mt-3 text-xl font-bold">ClinicOS</p>
          </div>
          <p className="text-sm font-semibold text-emerald-700">WELCOME BACK</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Sign in to your clinic</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Sign in with your clinic credentials or your linked Google account.</p>

          {googleEnabled && (
            <>
              <a href="/api/auth/google/start" className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow">
                <span aria-hidden="true" className="font-bold text-base text-[#4285F4]">G</span>
                Continue with Google
              </a>
              <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" /> or use your clinic login <span className="h-px flex-1 bg-slate-200" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="loginId" className="mb-2 block text-sm font-medium text-slate-700">Login ID</label>
              <input id="loginId" type="email" autoComplete="username" required value={loginId} onChange={(event) => setLoginId(event.target.value)} placeholder="you@clinicos.in" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                <span className="text-xs text-slate-400">Keep your password private</span>
              </div>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-700">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
              {loading ? "Signing in..." : "Sign in securely"} {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <p className="text-xs leading-5 text-slate-500">Your account is private to your clinic. Ask an administrator to set or reset your password if you need help signing in.</p>
          </div>
          <p className="mt-8 text-center text-xs text-slate-400">ClinicOS · Secure access for your care team</p>
        </div>
      </section>
    </main>
  );
}
