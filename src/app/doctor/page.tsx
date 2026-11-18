"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, CalendarDays, Check, ChevronRight, Clock3, RefreshCw, Stethoscope, UserRound } from "lucide-react";
import { DoctorMobileHeader, DoctorMobileNavigation } from "@/components/doctor-mobile/navigation";

interface DoctorAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  date: string;
  timeSlot: string;
  type: string;
  status: string;
  tokenNumber: string | null;
  chiefComplaint: string | null;
}

interface DashboardData {
  doctor: { name: string; specialization: string | null };
  today: string;
  appointments: DoctorAppointment[];
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function statusStyle(status: string) {
  if (status === "requested") return "bg-violet-50 text-violet-700";
  if (status === "in-consultation") return "bg-teal-50 text-teal-700";
  if (status === "completed") return "bg-slate-100 text-slate-600";
  if (status === "cancelled" || status === "no-show") return "bg-red-50 text-red-700";
  return "bg-emerald-50 text-emerald-700";
}

export default function DoctorMobileHomePage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyAppointment, setBusyAppointment] = useState("");

  const loadDashboard = useCallback(async () => {
    const response = await fetch("/api/doctor-mobile/dashboard", { cache: "no-store" });
    const result = await response.json() as DashboardData | { error?: string };
    if (!response.ok || !("appointments" in result)) {
      throw new Error("error" in result ? result.error || "Unable to load your schedule." : "Unable to load your schedule.");
    }
    return result;
  }, []);

  useEffect(() => {
    let active = true;
    loadDashboard()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load your schedule.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadDashboard]);

  const refresh = async () => {
    setError("");
    try {
      setData(await loadDashboard());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your schedule.");
    }
  };

  const updateAppointment = async (appointment: DoctorAppointment, status: string, openChart: boolean) => {
    setBusyAppointment(appointment.id);
    setError("");
    try {
      const response = await fetch(`/api/doctor-mobile/appointments/${encodeURIComponent(appointment.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to update this appointment.");
      if (openChart) {
        router.push(`/doctor/patients/${encodeURIComponent(appointment.patientId)}`);
      } else {
        await refresh();
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update this appointment.");
    } finally {
      setBusyAppointment("");
    }
  };

  const todayAppointments = data?.appointments.filter((item) => item.date === data.today) ?? [];
  const laterAppointments = data?.appointments.filter((item) => item.date > (data?.today ?? "")) ?? [];
  const requestedCount = data?.appointments.filter((item) => item.status === "requested").length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <DoctorMobileHeader />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5">
        {loading ? (
          <p role="status" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading your secure schedule…</p>
        ) : error && !data ? (
          <div className="rounded-xl border border-red-200 bg-white p-5">
            <p role="alert" className="text-sm text-red-700">{error}</p>
            <Link href={`/login?next=${encodeURIComponent("/doctor")}`} className="mt-3 inline-block text-sm font-medium text-emerald-700">Sign in to ClinicOS</Link>
            <button onClick={() => void refresh()} className="ml-4 text-sm font-medium text-slate-700">Retry</button>
          </div>
        ) : data ? (
          <>
            <section className="rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-700 p-5 text-white shadow-sm">
              <p className="text-sm text-emerald-100">Doctor workspace</p>
              <h1 className="mt-1 text-2xl font-bold">{data.doctor.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-emerald-50">
                <span className="inline-flex items-center gap-1.5"><Stethoscope className="h-4 w-4" />{data.doctor.specialization || "Clinic doctor"}</span>
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatDate(data.today)}</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/10 p-3"><p className="text-2xl font-bold">{todayAppointments.length}</p><p className="text-xs text-emerald-100">Today</p></div>
                <div className="rounded-xl bg-white/10 p-3"><p className="text-2xl font-bold">{todayAppointments.filter((item) => item.status === "completed").length}</p><p className="text-xs text-emerald-100">Completed</p></div>
                <div className="rounded-xl bg-white/10 p-3"><p className="text-2xl font-bold">{requestedCount}</p><p className="text-xs text-emerald-100">Requests</p></div>
              </div>
            </section>

            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Today&apos;s appointments</h2>
                <button aria-label="Refresh appointments" onClick={() => void refresh()} className="rounded-lg p-2 text-slate-500 hover:bg-white"><RefreshCw className="h-4 w-4" /></button>
              </div>
              {todayAppointments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
                  <CalendarClock className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-700">No appointments scheduled for today</p>
                </div>
              ) : todayAppointments.map((appointment) => (
                <article key={appointment.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><UserRound className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link href={`/doctor/patients/${encodeURIComponent(appointment.patientId)}`} className="truncate font-semibold text-slate-900 hover:text-emerald-700">{appointment.patientName}</Link>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${statusStyle(appointment.status)}`}>{appointment.status.replaceAll("-", " ")}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{appointment.patientAge}y · {appointment.patientGender}{appointment.tokenNumber ? ` · ${appointment.tokenNumber}` : ""}</p>
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-700"><Clock3 className="h-4 w-4 text-emerald-700" />{appointment.timeSlot}</p>
                      {appointment.chiefComplaint && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{appointment.chiefComplaint}</p>}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {appointment.status === "requested" && (
                      <>
                        <button disabled={busyAppointment === appointment.id} onClick={() => void updateAppointment(appointment, "scheduled", false)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white disabled:opacity-50"><Check className="h-4 w-4" />Confirm</button>
                        <button disabled={busyAppointment === appointment.id} onClick={() => void updateAppointment(appointment, "cancelled", false)} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 disabled:opacity-50">Decline</button>
                      </>
                    )}
                    {(appointment.status === "scheduled" || appointment.status === "waiting") && (
                      <button disabled={busyAppointment === appointment.id} onClick={() => void updateAppointment(appointment, "in-consultation", true)} className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white disabled:opacity-50"><Stethoscope className="h-4 w-4" />Start visit<ChevronRight className="h-4 w-4" /></button>
                    )}
                    {appointment.status === "in-consultation" && (
                      <Link href={`/doctor/patients/${encodeURIComponent(appointment.patientId)}`} className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white"><Stethoscope className="h-4 w-4" />Continue visit<ChevronRight className="h-4 w-4" /></Link>
                    )}
                    {appointment.status === "completed" && (
                      <Link href={`/doctor/patients/${encodeURIComponent(appointment.patientId)}`} className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700">Open patient chart<ChevronRight className="h-4 w-4" /></Link>
                    )}
                  </div>
                </article>
              ))}
            </section>

            {laterAppointments.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900">Upcoming · next 14 days</h2>
                {laterAppointments.map((appointment) => (
                  <Link key={appointment.id} href={`/doctor/patients/${encodeURIComponent(appointment.patientId)}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="min-w-16 text-center"><p className="text-xs font-medium text-emerald-700">{formatDate(appointment.date)}</p><p className="mt-1 text-xs text-slate-500">{appointment.timeSlot}</p></div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{appointment.patientName}</p><p className="mt-1 truncate text-xs text-slate-500">{appointment.chiefComplaint || appointment.type}</p></div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </Link>
                ))}
              </section>
            )}

            <Link href="/doctor/patients" className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              <UserRound className="h-4 w-4" /> Search my patient charts
            </Link>
          </>
        ) : null}
      </main>
      <DoctorMobileNavigation />
    </div>
  );
}
