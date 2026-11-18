"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, UserRound, ChevronRight, RefreshCw } from "lucide-react";
import { DoctorMobileHeader, DoctorMobileNavigation } from "@/components/doctor-mobile/navigation";

interface PatientSummary {
  id: string;
  uhid: string;
  name: string;
  age: number;
  gender: string;
  doctorLastVisit: string | null;
  totalVisits: number;
}

export default function DoctorMobilePatientsPage() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signInRequired, setSignInRequired] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      fetch(`/api/doctor-mobile/patients?q=${encodeURIComponent(query)}`, { cache: "no-store" })
        .then(async (response) => {
          const result = await response.json() as PatientSummary[] | { error?: string };
          if (!response.ok || !Array.isArray(result)) {
            if (response.status === 401 && active) setSignInRequired(true);
            throw new Error("error" in result ? result.error || "Unable to search your charts." : "Unable to search your charts.");
          }
          if (active) setPatients(result);
        })
        .catch((loadError: unknown) => {
          if (active) setError(loadError instanceof Error ? loadError.message : "Unable to search your charts.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <DoctorMobileHeader title="My patients" />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patient charts</h1>
          <p className="mt-1 text-sm text-slate-500">Search patients in your assigned care records.</p>
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, phone, or patient ID"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {loading && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
        </label>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p role="alert" className="text-sm text-red-700">{error}</p>
            {signInRequired && <Link href={`/login?next=${encodeURIComponent("/doctor/patients")}`} className="mt-2 inline-block text-sm font-medium text-emerald-800">Sign in to ClinicOS</Link>}
          </div>
        )}
        {!loading && !error && patients.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <UserRound className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">No assigned patient records found</p>
            <p className="mt-1 text-xs text-slate-500">Patients appear here when an appointment or record is assigned to you.</p>
          </div>
        )}
        <ul className="space-y-2">
          {patients.map((patient) => (
            <li key={patient.id}>
              <Link href={`/doctor/patients/${encodeURIComponent(patient.id)}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-300">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><UserRound className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">{patient.name}</span>
                  <span className="mt-1 block truncate text-xs text-slate-500">{patient.uhid} · {patient.age}y · {patient.gender}</span>
                  {patient.doctorLastVisit && <span className="mt-1 block text-[11px] text-slate-400">Last seen {patient.doctorLastVisit}</span>}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <DoctorMobileNavigation />
    </div>
  );
}
