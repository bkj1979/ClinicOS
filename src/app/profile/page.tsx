"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, ShieldCheck, UserRound } from "lucide-react";
import AppLayout from "@/components/layout/app-layout";
import type { AuthUser } from "@/lib/auth-types";

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { user?: AuthUser; error?: string };
        if (!response.ok || !result.user) throw new Error(result.error || "Unable to load your profile.");
        if (active) setUser(result.user);
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load your profile."); });
    return () => { active = false; };
  }, []);

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmPassword) {
      setError("The new password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to change your password.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Your password has been updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to change your password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Your clinic login and account security.</p>
        </div>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><UserRound className="h-5 w-5" /></span>
            <div><h2 className="font-semibold text-slate-900">Account details</h2><p className="text-xs text-slate-500">Your profile is managed by the clinic administrator.</p></div>
          </div>
          {user ? (
            <dl className="grid gap-5 pt-5 sm:grid-cols-2">
              <div><dt className="text-xs font-medium text-slate-500">Name</dt><dd className="mt-1 text-sm font-medium text-slate-900">{user.name}</dd></div>
              <div><dt className="text-xs font-medium text-slate-500">Login ID</dt><dd className="mt-1 text-sm font-medium text-slate-900">{user.loginId}</dd></div>
              <div><dt className="text-xs font-medium text-slate-500">Specialization</dt><dd className="mt-1 text-sm font-medium text-slate-900">{user.specialization || "Doctor"}</dd></div>
              <div><dt className="text-xs font-medium text-slate-500">Role</dt><dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium capitalize text-emerald-800"><ShieldCheck className="h-4 w-4" />{user.role}</dd></div>
            </dl>
          ) : !error ? <p className="pt-5 text-sm text-slate-500">Loading profile...</p> : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><KeyRound className="h-5 w-5" /></span>
            <div><h2 className="font-semibold text-slate-900">Change password</h2><p className="text-xs text-slate-500">Use at least 12 characters. Your password is stored as a secure hash.</p></div>
          </div>
          <form onSubmit={(event) => void handleChangePassword(event)} className="mt-5 max-w-lg space-y-4">
            <div><label htmlFor="currentPassword" className="mb-1.5 block text-xs font-medium text-slate-600">Current password</label><input id="currentPassword" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10" /></div>
            <div><label htmlFor="newPassword" className="mb-1.5 block text-xs font-medium text-slate-600">New password</label><input id="newPassword" type="password" autoComplete="new-password" minLength={12} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10" /></div>
            <div><label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium text-slate-600">Confirm new password</label><input id="confirmPassword" type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10" /></div>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {message && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
            <button type="submit" disabled={saving} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">{saving ? "Updating..." : "Update password"}</button>
          </form>
        </section>
      </div>
    </AppLayout>
  );
}
