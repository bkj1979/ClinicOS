"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  LogOut,
  Pill,
  Smartphone,
  UserRound,
} from "lucide-react";
import { APPOINTMENT_TIME_SLOTS } from "@/lib/appointment-scheduling";
import type { PrescriptionItem } from "@/lib/types";

const todayDate = new Date().toISOString().slice(0, 10);
const lastBookableDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

interface PatientPortalData {
  patient: { id: string; uhid: string; name: string };
  appointments: Array<{
    id: string;
    doctorName: string;
    department: string;
    date: string;
    timeSlot: string;
    status: string;
    type: string;
  }>;
  prescriptions: Array<{
    id: string;
    prescriptionNo: string;
    doctorName: string;
    date: string;
    medicines: PrescriptionItem[];
    advice: string;
    followUpDate: string | null;
    status: string;
  }>;
  doctors: Array<{ id: string; name: string; specialization: string | null }>;
  occupiedSlots: Array<{ doctorId: string; date: string; timeSlot: string }>;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

async function responseError(response: Response, fallback: string): Promise<string> {
  const result = await response.json() as { error?: string };
  return response.ok ? "" : result.error || fallback;
}

function displayDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PatientPortalPage() {
  const [portal, setPortal] = useState<PatientPortalData | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [uhid, setUhid] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(todayDate);
  const [timeSlot, setTimeSlot] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingBusy, setBookingBusy] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const loadPortal = useCallback(async () => {
    const response = await fetch("/api/patient-portal/overview", { cache: "no-store" });
    if (response.status === 401) return null;
    const error = await responseError(response, "Unable to load your patient app.");
    if (error) throw new Error(error);
    return await response.json() as PatientPortalData;
  }, []);

  useEffect(() => {
    let active = true;
    loadPortal()
      .then((data) => {
        if (active) setPortal(data);
      })
      .catch((error: unknown) => {
        if (active) setLoginError(error instanceof Error ? error.message : "Unable to load your patient app.");
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleInstall);
    return () => {
      active = false;
      window.removeEventListener("beforeinstallprompt", handleInstall);
    };
  }, [loadPortal]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");
    setLoginBusy(true);
    try {
      const response = await fetch("/api/patient-portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uhid, password }),
      });
      const error = await responseError(response, "Unable to sign in.");
      if (error) throw new Error(error);
      setPassword("");
      setPortal(await loadPortal());
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setLoginBusy(false);
    }
  };

  const handleBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBookingError("");
    setBookingMessage("");
    setBookingBusy(true);
    try {
      const response = await fetch("/api/patient-portal/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: selectedDoctorId, date: appointmentDate, timeSlot }),
      });
      const error = await responseError(response, "Unable to request an appointment.");
      if (error) throw new Error(error);
      setBookingMessage("Request sent. The clinic will confirm your appointment.");
      setTimeSlot("");
      setPortal(await loadPortal());
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Unable to request an appointment.");
    } finally {
      setBookingBusy(false);
    }
  };

  const handleLogout = async () => {
    const response = await fetch("/api/patient-portal/logout", { method: "POST" });
    const error = await responseError(response, "Unable to sign out.");
    if (error) {
      setLoginError(error);
      return;
    }
    setPortal(null);
    setLoginError("");
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to start installation.");
    }
  };

  const selectedDoctorId = doctorId || portal?.doctors[0]?.id || "";
  const unavailableSlots = new Set(
    portal?.occupiedSlots
      .filter((slot) => slot.doctorId === selectedDoctorId && slot.date === appointmentDate)
      .map((slot) => slot.timeSlot) ?? [],
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="/patient" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-xl font-bold text-white">+</span>
            <span>
              <span className="block font-bold">ClinicOS</span>
              <span className="block text-xs text-slate-500">Patient app</span>
            </span>
          </a>
          <div className="flex items-center gap-2">
            {installPrompt && (
              <button onClick={handleInstall} className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50">
                <Download className="h-4 w-4" /> Install
              </button>
            )}
            {portal && (
              <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {checkingSession ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading your patient app…</div>
        ) : !portal ? (
          <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <UserRound className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Your patient app</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sign in with the patient ID and password you set up using the invitation from your clinic.
            </p>
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <label className="block text-sm font-medium">
                Patient ID (UHID)
                <input required autoComplete="username" value={uhid} onChange={(event) => setUhid(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="block text-sm font-medium">
                Password
                <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
              </label>
              {loginError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loginError}</p>}
              <button disabled={loginBusy} className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
                {loginBusy ? "Signing in…" : "Sign in"}
              </button>
            </form>
            <p className="mt-5 text-xs leading-5 text-slate-500">
              Don’t have an invitation yet? Contact your clinic. For privacy, only your own appointments and prescriptions are shown here.
            </p>
          </section>
        ) : (
          <>
            <section className="flex flex-col justify-between gap-4 rounded-2xl bg-emerald-800 p-6 text-white sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-emerald-100">Welcome</p>
                <h1 className="mt-1 text-2xl font-bold">{portal.patient.name}</h1>
                <p className="mt-1 text-sm text-emerald-100">Patient ID: {portal.patient.uhid}</p>
              </div>
              <div className="flex items-center gap-2 self-start rounded-lg bg-white/10 px-3 py-2 text-sm sm:self-auto">
                <Smartphone className="h-4 w-4" />
                <span>Private patient account</span>
              </div>
            </section>

            {loginError && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{loginError}</p>}

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-lg font-semibold">Appointments</h2>
                </div>
                {portal.appointments.length ? (
                  <ul className="divide-y divide-slate-100">
                    {portal.appointments.map((appointment) => (
                      <li key={appointment.id} className="flex items-start justify-between gap-3 py-3">
                        <div>
                          <p className="font-medium">{displayDate(appointment.date)} · {appointment.timeSlot}</p>
                          <p className="mt-1 text-sm text-slate-500">{appointment.doctorName} · {appointment.department}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${appointment.status === "requested" ? "bg-violet-50 text-violet-700" : appointment.status === "cancelled" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {appointment.status === "requested" ? "Awaiting confirmation" : appointment.status.replaceAll("-", " ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="py-4 text-sm text-slate-500">No appointments yet.</p>}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Pill className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-lg font-semibold">Prescriptions</h2>
                </div>
                {portal.prescriptions.length ? (
                  <ul className="space-y-4">
                    {portal.prescriptions.map((prescription) => (
                      <li key={prescription.id} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-medium">{prescription.prescriptionNo}</p>
                            <p className="text-xs text-slate-500">{displayDate(prescription.date)} · {prescription.doctorName}</p>
                          </div>
                          <span className="text-xs capitalize text-slate-500">{prescription.status.replaceAll("-", " ")}</span>
                        </div>
                        <ul className="mt-3 space-y-2">
                          {prescription.medicines.map((medicine) => (
                            <li key={medicine.id} className="text-sm">
                              <span className="font-medium">{medicine.drugName}</span>
                              <span className="text-slate-600"> · {medicine.dosage}, {medicine.frequency}, {medicine.duration}</span>
                              {medicine.instructions && <p className="text-xs text-slate-500">{medicine.instructions}</p>}
                            </li>
                          ))}
                        </ul>
                        {prescription.advice && <p className="mt-3 text-sm text-slate-600">{prescription.advice}</p>}
                        {prescription.followUpDate && <p className="mt-2 text-xs text-slate-500">Follow-up: {displayDate(prescription.followUpDate)}</p>}
                      </li>
                    ))}
                  </ul>
                ) : <p className="py-4 text-sm text-slate-500">No prescriptions available.</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-emerald-700" />
                <h2 className="text-lg font-semibold">Request an appointment</h2>
              </div>
              <p className="mb-4 text-sm text-slate-600">Choose a time to request. The clinic will confirm your appointment.</p>
              <form onSubmit={handleBooking} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm font-medium">
                  Doctor
                  <select required value={selectedDoctorId} onChange={(event) => setDoctorId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">
                    {portal.doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}{doctor.specialization ? ` · ${doctor.specialization}` : ""}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Date
                  <input required type="date" min={todayDate} max={lastBookableDate} value={appointmentDate} onChange={(event) => { setAppointmentDate(event.target.value); setTimeSlot(""); }} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
                </label>
                <label className="text-sm font-medium">
                  Time
                  <select required value={timeSlot} onChange={(event) => setTimeSlot(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">
                    <option value="">Select a time</option>
                    {APPOINTMENT_TIME_SLOTS.map((slot) => <option key={slot} value={slot} disabled={unavailableSlots.has(slot)}>{slot}{unavailableSlots.has(slot) ? " · booked" : ""}</option>)}
                  </select>
                </label>
                <div className="flex items-end">
                  <button disabled={bookingBusy || !portal.doctors.length} className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
                    {bookingBusy ? "Sending…" : "Request booking"}
                  </button>
                </div>
              </form>
              {bookingError && <p role="alert" className="mt-3 text-sm text-red-700">{bookingError}</p>}
              {bookingMessage && <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />{bookingMessage}</p>}
            </section>
          </>
        )}

        {!installPrompt && (
          <p className="mx-auto max-w-md text-center text-xs text-slate-500">
            On iPhone or iPad, open this page in Safari, tap Share, then choose “Add to Home Screen”.
          </p>
        )}
      </div>
    </main>
  );
}
