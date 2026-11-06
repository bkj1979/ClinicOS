"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

interface VerificationResult {
  valid?: boolean;
  prescriptionNo?: string;
  date?: string;
  doctorName?: string;
  patientInitials?: string;
  error?: string;
}

export default function VerifyPrescriptionPage() {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    window.history.replaceState(null, "", window.location.pathname);
    let active = true;
    fetch("/api/prescriptions/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    })
      .then(async (response) => {
        const verification = await response.json() as VerificationResult;
        if (!response.ok) throw new Error(verification.error || "Verification is temporarily unavailable.");
        if (active) setResult(verification);
      })
      .catch((verificationError: unknown) => {
        if (active) {
          setError(verificationError instanceof Error ? verificationError.message : "Verification is temporarily unavailable.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">ClinicOS</p>
            <h1 className="text-xl font-bold text-slate-900">Prescription verification</h1>
          </div>
        </div>

        {error ? (
          <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {error}
          </div>
        ) : !result ? (
          <p role="status" className="text-sm text-slate-600">Checking the prescription against the clinic record…</p>
        ) : result.valid ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p className="font-semibold">Verified against the clinic record</p>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-slate-500">Prescription</dt><dd className="font-mono font-medium text-slate-900">{result.prescriptionNo}</dd></div>
              <div><dt className="text-slate-500">Issue date</dt><dd className="font-medium text-slate-900">{result.date}</dd></div>
              <div><dt className="text-slate-500">Prescriber</dt><dd className="font-medium text-slate-900">{result.doctorName}</dd></div>
              <div><dt className="text-slate-500">Patient initials</dt><dd className="font-medium text-slate-900">{result.patientInitials}</dd></div>
            </dl>
            <p className="text-xs leading-relaxed text-slate-500">This confirms the prescription details match the clinic record. It does not replace clinical review or independently establish that the prescription is appropriate for use.</p>
          </div>
        ) : (
          <div role="status" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <XCircle className="h-5 w-5 shrink-0" />
            <p className="font-semibold">This prescription could not be verified. Contact the clinic before relying on it.</p>
          </div>
        )}
      </section>
    </main>
  );
}
