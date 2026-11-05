"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, Stethoscope } from "lucide-react";

interface AdminAccount {
  name: string;
  loginId: string;
}

export default function SetupPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/setup", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { required?: boolean; admins?: AdminAccount[]; error?: string };
        if (!response.ok) throw new Error(result.error || "Unable to load account setup.");
        if (!result.required) {
          router.replace("/login");
          return;
        }
        if (active) setAdmins(result.admins || []);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load account setup.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentials: admins.map((admin, index) => ({ loginId: admin.loginId, password: passwords[index] })) }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to save administrator passwords.");
      router.replace("/login?setup=complete");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save administrator passwords.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-700"><ArrowLeft className="h-4 w-4" /> ClinicOS home</Link>
        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white"><Stethoscope className="h-6 w-6" /></div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-emerald-700">One-time setup</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Secure your clinic accounts</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Create a password for each administrator account. Passwords are stored as secure hashes and cannot be viewed later.</p>

        {loading ? <p className="mt-8 text-sm text-slate-500">Checking account setup...</p> : error ? (
          <p role="alert" className="mt-8 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {admins.map((admin, index) => (
              <div key={admin.loginId} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{admin.name}</p>
                <p className="mt-1 text-xs text-slate-500">{admin.loginId} · Admin</p>
                <label htmlFor={`admin-password-${index}`} className="mb-2 mt-4 block text-sm font-medium text-slate-700">Password (at least 12 characters)</label>
                <div className="relative">
                  <input id={`admin-password-${index}`} type={showPasswords ? "text" : "password"} minLength={12} autoComplete="new-password" required value={passwords[index] || ""} onChange={(event) => setPasswords((current) => {
                    const updated = [...current];
                    updated[index] = event.target.value;
                    return updated;
                  })} className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" />
                  <button type="button" onClick={() => setShowPasswords(!showPasswords)} aria-label={showPasswords ? "Hide passwords" : "Show passwords"} className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">{showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
            ))}
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-xs leading-5 text-emerald-900"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p>Use a unique password for each account. After setup, an administrator can create passwords for the other staff accounts from Settings.</p></div>
            <button type="submit" disabled={saving || admins.length === 0} className="w-full rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">{saving ? "Securing accounts..." : "Save passwords and continue"}</button>
          </form>
        )}
      </div>
    </main>
  );
}
