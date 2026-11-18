"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PatientActivationPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-sm text-slate-500">Loading invitation…</main>}>
      <PatientActivationForm />
    </Suspense>
  );
}

function PatientActivationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token] = useState(() => searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const activate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("This invitation link is missing its token. Ask your clinic for a new link.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/patient-portal/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to activate your account.");
      router.replace("/patient");
    } catch (activationError) {
      setError(activationError instanceof Error ? activationError.message : "Unable to activate your account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><KeyRound className="h-6 w-6" /></div>
        <h1 className="text-2xl font-bold">Set up your patient app</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Create a password to securely view your appointments and prescriptions. This invitation can only be used once.</p>
        <form onSubmit={activate} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Create password
            <input required minLength={12} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
            <span className="mt-1 block text-xs font-normal text-slate-500">Use at least 12 characters.</span>
          </label>
          <label className="block text-sm font-medium">
            Confirm password
            <input required minLength={12} maxLength={128} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
          </label>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button disabled={busy || !token} className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}
