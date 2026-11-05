"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  Plus,
  Search,
  Filter,
  ChevronDown,
  Eye,
  LogIn,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Users,
  Hourglass,
  CircleDot,
  UserX,
  X,
  Stethoscope,
  Building2,
  FileText,
  Calendar,
} from "lucide-react";
import { appointments, patients, users } from "@/lib/mock-data";
import type { Patient, User } from "@/lib/types";
import type { Appointment, AppointmentStatus, AppointmentType } from "@/lib/types";
import { cn, getStatusColor, getInitials } from "@/lib/utils";
import AppLayout from "@/components/layout/app-layout";

const todayDateString = new Date().toISOString().split("T")[0];

// ---- Time slots for new appointment modal ----
const TIME_SLOTS = [
  "09:00 AM", "09:15 AM", "09:30 AM", "09:45 AM",
  "10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM",
  "11:00 AM", "11:15 AM", "11:30 AM", "11:45 AM",
  "12:00 PM", "12:15 PM", "12:30 PM", "12:45 PM",
  "02:00 PM", "02:15 PM", "02:30 PM", "02:45 PM",
  "03:00 PM", "03:15 PM", "03:30 PM", "03:45 PM",
  "04:00 PM", "04:15 PM", "04:30 PM", "04:45 PM",
  "05:00 PM", "05:15 PM", "05:30 PM", "05:45 PM",
];

const DEPARTMENTS = ["All Departments", "General Medicine", "Cardiology", "Dermatology", "Orthopedics", "Pediatrics"];
const STATUSES: { label: string; value: string }[] = [
  { label: "All Status", value: "all" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Waiting", value: "waiting" },
  { label: "In Consultation", value: "in-consultation" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "No Show", value: "no-show" },
];

// ---- Helper: avatar bg colors ----
const AVATAR_COLORS = [
  "bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-rose-500",
  "bg-amber-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
  "bg-pink-500", "bg-orange-500", "bg-lime-600", "bg-fuchsia-500",
];
function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function typeBadge(type: AppointmentType) {
  const map: Record<AppointmentType, { bg: string; label: string }> = {
    "walk-in": { bg: "bg-orange-100 text-orange-700", label: "Walk-in" },
    scheduled: { bg: "bg-blue-100 text-blue-700", label: "Scheduled" },
    "follow-up": { bg: "bg-purple-100 text-purple-700", label: "Follow-up" },
    teleconsult: { bg: "bg-cyan-100 text-cyan-700", label: "Teleconsult" },
  };
  const m = map[type];
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", m.bg)}>{m.label}</span>;
}

function statusBadge(status: AppointmentStatus) {
  const labelMap: Record<AppointmentStatus, string> = {
    scheduled: "Scheduled",
    waiting: "Waiting",
    "in-consultation": "In Consultation",
    completed: "Completed",
    cancelled: "Cancelled",
    "no-show": "No Show",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", getStatusColor(status))}>
      {labelMap[status]}
    </span>
  );
}

// ============================================================
// New Appointment Modal
// ============================================================
function NewAppointmentModal({
  open,
  onClose,
  patients,
  appointments,
  doctors,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  patients: Patient[];
  appointments: Appointment[];
  doctors: User[];
  onCreated: (appointment: Appointment) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayDateString);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [appointmentType, setAppointmentType] = useState<AppointmentType>("scheduled");
  const [complaint, setComplaint] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredPatients = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.uhid.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [patients, search]);

  const patient = patients.find((p) => p.id === selectedPatient);

  // Booked slots for the selected doctor+date
  const bookedSlots = useMemo(() => {
    return appointments
      .filter((a) => a.doctorId === selectedDoctor && a.date === selectedDate && a.status !== "cancelled")
      .map((a) => a.timeSlot);
  }, [appointments, selectedDoctor, selectedDate]);

  // When doctor changes, auto-select department
  const handleDoctorChange = (doctorId: string) => {
    setSelectedDoctor(doctorId);
    const doc = doctors.find((d) => d.id === doctorId);
    if (doc?.specialization) setSelectedDept(doc.specialization);
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedSlot) {
      setError("Please select a patient, doctor, and time slot.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient,
          doctorId: selectedDoctor,
          date: selectedDate,
          timeSlot: selectedSlot,
          type: appointmentType,
          chiefComplaint: complaint,
        }),
      });
      const result = await response.json() as Appointment | { error?: string };

      if (!response.ok || !("id" in result)) {
        throw new Error("error" in result ? result.error : "Unable to create appointment.");
      }

      onCreated(result);
      onClose();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to create appointment. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            New Appointment
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {/* Patient Search */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Patient *</label>
            {!selectedPatient ? (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or UHID..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setError("");
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
                />
                {filteredPatients.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {filteredPatients.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPatient(p.id); setSearch(""); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 text-left transition-colors"
                      >
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold", avatarColor(p.id))}>
                          {getInitials(p.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.uhid} · {p.phone} · {p.age}y/{p.gender.charAt(0)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold", avatarColor(patient!.id))}>
                  {getInitials(patient!.name)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{patient!.name}</p>
                  <p className="text-xs text-slate-500">{patient!.uhid} · {patient!.phone} · {patient!.age}y/{patient!.gender.charAt(0)} · {patient!.bloodGroup || "—"}</p>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="p-1 hover:bg-emerald-100 rounded-md">
                  <X className="w-4 h-4 text-emerald-700" />
                </button>
              </div>
            )}
          </div>

          {/* Doctor + Department Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Doctor *</label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedDoctor}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  readOnly
                  value={selectedDept}
                  placeholder="Auto-filled"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Date + Type Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="walk-in">Walk-in</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="teleconsult">Teleconsult</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Time Slot Grid */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Time Slot *</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {TIME_SLOTS.map((slot) => {
                const booked = bookedSlots.includes(slot);
                const selected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    disabled={booked}
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      "py-2 px-1 text-xs font-medium rounded-lg border transition-all text-center",
                      booked && "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through",
                      selected && !booked && "bg-emerald-600 text-white border-emerald-600 shadow-md",
                      !selected && !booked && "bg-white text-slate-700 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50"
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chief Complaint</label>
            <textarea
              rows={2}
              placeholder="Describe the patient's primary complaint..."
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button type="button" onClick={onClose} disabled={isSaving} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSaving} className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60">
            <Plus className="w-4 h-4" />
            {isSaving ? "Booking..." : "Book Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function AppointmentsPage() {
  const [data, setData] = useState<Appointment[]>(appointments);
  const [patientRecords, setPatientRecords] = useState<Patient[]>(patients);
  const [doctors, setDoctors] = useState<User[]>(users.filter((user) => user.role === "doctor"));
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("All Departments");
  const [filterDoctor, setFilterDoctor] = useState("All Doctors");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState(todayDateString);
  const [showModal, setShowModal] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/appointments").then(async (response) => {
        const result = await response.json() as Appointment[] | { error?: string };
        if (!response.ok || !Array.isArray(result)) {
          throw new Error("error" in result ? result.error : "Unable to load appointments.");
        }
        return result;
      }),
      fetch("/api/patients").then(async (response) => {
        const result = await response.json() as Patient[] | { error?: string };
        if (!response.ok || !Array.isArray(result)) {
          throw new Error("error" in result ? result.error : "Unable to load patients.");
        }
        return result;
      }),
      fetch("/api/doctors").then(async (response) => {
        const result = await response.json() as User[] | { error?: string };
        if (!response.ok || !Array.isArray(result)) {
          throw new Error("error" in result ? result.error : "Unable to load doctors.");
        }
        return result;
      }),
    ])
      .then(([appointmentsFromDatabase, patientsFromDatabase, doctorsFromDatabase]) => {
        if (!active) return;
        setData(appointmentsFromDatabase);
        setPatientRecords(patientsFromDatabase);
        setDoctors(doctorsFromDatabase);
        setLoadError("");
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Unable to load scheduling data.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // ---- computed stats ----
  const stats = useMemo(() => {
    const selectedDateAppointments = data.filter((appointment) => appointment.date === filterDate);
    return {
      total: selectedDateAppointments.length,
      completed: selectedDateAppointments.filter((a) => a.status === "completed").length,
      inProgress: selectedDateAppointments.filter((a) => a.status === "in-consultation").length,
      waiting: selectedDateAppointments.filter((a) => a.status === "waiting").length,
      upcoming: selectedDateAppointments.filter((a) => a.status === "scheduled").length,
      noShow: selectedDateAppointments.filter((a) => a.status === "no-show").length,
    };
  }, [data, filterDate]);

  // ---- filtered list ----
  const filtered = useMemo(() => {
    return data.filter((a) => {
      const q = searchQuery.toLowerCase();
      const matchDate = a.date === filterDate;
      const matchSearch =
        !q ||
        a.patientName.toLowerCase().includes(q) ||
        a.tokenNumber?.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.chiefComplaint?.toLowerCase().includes(q);
      const matchDept = filterDept === "All Departments" || a.department === filterDept;
      const matchDoc = filterDoctor === "All Doctors" || a.doctorId === filterDoctor;
      const matchStatus = filterStatus === "all" || a.status === filterStatus;
      return matchDate && matchSearch && matchDept && matchDoc && matchStatus;
    });
  }, [data, filterDate, searchQuery, filterDept, filterDoctor, filterStatus]);

  // ---- actions ----
  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      const response = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json() as Appointment | { error?: string };
      if (!response.ok || !("id" in result)) {
        throw new Error("error" in result ? result.error : "Unable to update appointment.");
      }
      setData((prev) => prev.map((appointment) => appointment.id === id ? result : appointment));
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to update appointment.");
    }
  };
  const handleCheckIn = (id: string) => handleStatusChange(id, "waiting");
  const handleCancel = (id: string) => {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      void handleStatusChange(id, "cancelled");
    }
  };
  const handleView = (a: Appointment) => {
    alert(
      `📋 Appointment Details\n\nToken: ${a.tokenNumber}\nPatient: ${a.patientName} (${a.patientAge}y/${a.patientGender})\nDoctor: ${a.doctorName}\nDepartment: ${a.department}\nTime: ${a.timeSlot}\nType: ${a.type}\nStatus: ${a.status}\nComplaint: ${a.chiefComplaint || "—"}`
    );
  };

  const statCards = [
    { label: "Total", value: stats.total, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "In Progress", value: stats.inProgress, icon: CircleDot, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Waiting", value: stats.waiting, icon: Hourglass, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Upcoming", value: stats.upcoming, icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "No Show", value: stats.noShow, icon: UserX, color: "text-slate-500", bg: "bg-slate-50" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
          {loadError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </div>
          )}
          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <CalendarDays className="w-7 h-7 text-emerald-600" />
                Appointments
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {filterDate} · {stats.total} appointments
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Appointment
            </button>
          </div>

          {/* ── Stats Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {statCards.map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", s.bg)}>
                    <s.icon className={cn("w-5 h-5", s.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800 leading-none">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Filters ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              {/* Date */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Department */}
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Doctor */}
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={filterDoctor}
                  onChange={(e) => setFilterDoctor(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
                >
                  <option value="All Doctors">All Doctors</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Status */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by patient, token, doctor, complaint..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* ── Appointments Table ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Token</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Patient</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Age/Gender</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Doctor</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Department</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Time</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Type</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Chief Complaint</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No appointments match your filters.</p>
                      </td>
                    </tr>
                  )}
                  {filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Token */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-12 h-8 bg-slate-100 rounded-md text-sm font-bold text-slate-700">
                          {a.tokenNumber}
                        </span>
                      </td>

                      {/* Patient */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", avatarColor(a.patientId))}>
                            {getInitials(a.patientName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{a.patientName}</p>
                            <p className="text-xs text-slate-400">{a.patientPhone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Age / Gender */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-slate-600">{a.patientAge}y / {a.patientGender.charAt(0)}</span>
                      </td>

                      {/* Doctor */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-700 truncate">{a.doctorName}</p>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-slate-600">{a.department}</span>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {a.timeSlot}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3 hidden lg:table-cell">{typeBadge(a.type)}</td>

                      {/* Status */}
                      <td className="px-4 py-3">{statusBadge(a.status)}</td>

                      {/* Chief Complaint */}
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <p className="text-xs text-slate-500 max-w-[200px] truncate">{a.chiefComplaint || "—"}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleView(a)} title="View" className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
                            <Eye className="w-4 h-4 text-slate-500" />
                          </button>
                          {(a.status === "scheduled") && (
                            <button onClick={() => handleCheckIn(a.id)} title="Check In" className="p-1.5 hover:bg-emerald-50 rounded-md transition-colors">
                              <LogIn className="w-4 h-4 text-emerald-600" />
                            </button>
                          )}
                          {(a.status !== "completed" && a.status !== "cancelled" && a.status !== "no-show") && (
                            <button onClick={() => handleCancel(a.id)} title="Cancel" className="p-1.5 hover:bg-red-50 rounded-md transition-colors">
                              <XCircle className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
              <p className="text-xs text-slate-500">
                Showing <span className="font-medium">{filtered.length}</span> of <span className="font-medium">{data.length}</span> appointments
              </p>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">
                  {new Set(data.map((a) => a.doctorId)).size} doctors · {new Set(data.map((a) => a.department)).size} departments
                </span>
              </div>
            </div>
          </div>

          {/* Modal */}
          <NewAppointmentModal
            open={showModal}
            onClose={() => setShowModal(false)}
            patients={patientRecords}
            appointments={data}
            doctors={doctors}
            onCreated={(appointment) => {
              setData((current) => [appointment, ...current]);
              setFilterDate(appointment.date);
            }}
          />
        </div>
      </AppLayout>
    );
  }
