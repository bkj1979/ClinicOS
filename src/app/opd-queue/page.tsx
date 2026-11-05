"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Clock,
  CheckCircle2,
  UserPlus,
  Phone,
  Timer,
  Play,
  SkipForward,
  UserX,
  Stethoscope,
  Activity,
  ArrowRight,
  RefreshCw,
  Volume2,
  MonitorPlay,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/layout/app-layout";

interface QueuePatient {
  id: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorId: string;
  doctorName: string;
  department: string;
  type: string;
  status: "waiting" | "in-consultation" | "completed" | "skipped";
  priority: "normal" | "urgent" | "emergency";
  checkInTime: string;
  consultStartTime?: string;
  consultEndTime?: string;
  estimatedWaitMinutes: number;
  vitalsRecorded: boolean;
  chiefComplaint?: string;
}

const initialQueue: QueuePatient[] = [
  { id: "q0", tokenNumber: "T001", patientId: "p1", patientName: "Arun Kumar Verma", patientAge: 41, patientGender: "Male", doctorId: "u1", doctorName: "Dr. Priya Sharma", department: "General Medicine", type: "scheduled", status: "completed", priority: "normal", checkInTime: "2026-11-01T08:50:00", consultStartTime: "2026-11-01T09:00:00", consultEndTime: "2026-11-01T09:18:00", estimatedWaitMinutes: 0, vitalsRecorded: true, chiefComplaint: "Follow-up for diabetes management" },
  { id: "q0b", tokenNumber: "T002", patientId: "p2", patientName: "Sneha Gupta", patientAge: 34, patientGender: "Female", doctorId: "u1", doctorName: "Dr. Priya Sharma", department: "General Medicine", type: "scheduled", status: "completed", priority: "normal", checkInTime: "2026-11-01T09:00:00", consultStartTime: "2026-11-01T09:20:00", consultEndTime: "2026-11-01T09:35:00", estimatedWaitMinutes: 0, vitalsRecorded: true, chiefComplaint: "Persistent cough and cold" },
  { id: "q0c", tokenNumber: "T003", patientId: "p3", patientName: "Ravi Shankar Iyer", patientAge: 48, patientGender: "Male", doctorId: "u2", doctorName: "Dr. Rajesh Patel", department: "Cardiology", type: "scheduled", status: "completed", priority: "normal", checkInTime: "2026-11-01T09:15:00", consultStartTime: "2026-11-01T09:30:00", consultEndTime: "2026-11-01T10:05:00", estimatedWaitMinutes: 0, vitalsRecorded: true, chiefComplaint: "Chest pain on exertion" },
  { id: "q1", tokenNumber: "T004", patientId: "p4", patientName: "Fatima Begum", patientAge: 61, patientGender: "Female", doctorId: "u4", doctorName: "Dr. Mohammed Irfan", department: "Orthopedics", type: "follow-up", status: "in-consultation", priority: "normal", checkInTime: "2026-11-01T09:45:00", consultStartTime: "2026-11-01T10:02:00", estimatedWaitMinutes: 0, vitalsRecorded: true, chiefComplaint: "Knee pain - follow-up after physiotherapy" },
  { id: "q2", tokenNumber: "T005", patientId: "p5", patientName: "Deepak Hegde", patientAge: 36, patientGender: "Male", doctorId: "u3", doctorName: "Dr. Ananya Reddy", department: "Dermatology", type: "scheduled", status: "in-consultation", priority: "normal", checkInTime: "2026-11-01T10:00:00", consultStartTime: "2026-11-01T10:15:00", estimatedWaitMinutes: 0, vitalsRecorded: true, chiefComplaint: "Recurring skin rash on arms" },
  { id: "q3", tokenNumber: "T006", patientId: "p6", patientName: "Anjali Menon", patientAge: 38, patientGender: "Female", doctorId: "u1", doctorName: "Dr. Priya Sharma", department: "General Medicine", type: "walk-in", status: "waiting", priority: "normal", checkInTime: "2026-11-01T10:20:00", estimatedWaitMinutes: 12, vitalsRecorded: true, chiefComplaint: "Thyroid check-up and fatigue" },
  { id: "q4", tokenNumber: "T007", patientId: "p7", patientName: "Sunil Deshmukh", patientAge: 53, patientGender: "Male", doctorId: "u2", doctorName: "Dr. Rajesh Patel", department: "Cardiology", type: "scheduled", status: "waiting", priority: "urgent", checkInTime: "2026-11-01T10:30:00", estimatedWaitMinutes: 8, vitalsRecorded: false, chiefComplaint: "Blood pressure monitoring - elevated readings" },
  { id: "q5", tokenNumber: "T008", patientId: "p8", patientName: "Priya Ramachandran", patientAge: 31, patientGender: "Female", doctorId: "u3", doctorName: "Dr. Ananya Reddy", department: "Dermatology", type: "scheduled", status: "waiting", priority: "normal", checkInTime: "2026-11-01T10:35:00", estimatedWaitMinutes: 15, vitalsRecorded: true, chiefComplaint: "Acne treatment follow-up" },
  { id: "q6", tokenNumber: "T009", patientId: "p9", patientName: "Karthik Narayanan", patientAge: 44, patientGender: "Male", doctorId: "u1", doctorName: "Dr. Priya Sharma", department: "General Medicine", type: "follow-up", status: "waiting", priority: "normal", checkInTime: "2026-11-01T10:40:00", estimatedWaitMinutes: 22, vitalsRecorded: false, chiefComplaint: "Diabetes medication review" },
  { id: "q7", tokenNumber: "T010", patientId: "p10", patientName: "Lakshmi Venkatesh", patientAge: 68, patientGender: "Female", doctorId: "u2", doctorName: "Dr. Rajesh Patel", department: "Cardiology", type: "scheduled", status: "waiting", priority: "urgent", checkInTime: "2026-11-01T10:45:00", estimatedWaitMinutes: 18, vitalsRecorded: true, chiefComplaint: "Atrial fibrillation - routine check" },
];

const doctors = [
  { id: "all", name: "All Doctors" },
  { id: "u1", name: "Dr. Priya Sharma", department: "General Medicine" },
  { id: "u2", name: "Dr. Rajesh Patel", department: "Cardiology" },
  { id: "u3", name: "Dr. Ananya Reddy", department: "Dermatology" },
  { id: "u4", name: "Dr. Mohammed Irfan", department: "Orthopedics" },
  { id: "u5", name: "Dr. Kavitha Nair", department: "Pediatrics" },
];

export default function OPDQueuePage() {
  const [queue, setQueue] = useState<QueuePatient[]>(initialQueue);
  const [selectedDoctor, setSelectedDoctor] = useState("all");
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date("2026-11-02T10:30:00"));
  const [timeStr, setTimeStr] = useState("10:30:00 AM");
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "Male",
    priority: "normal",
    doctorId: "u1",
    chiefComplaint: "",
  });
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInError, setWalkInError] = useState("");
  const [queueError, setQueueError] = useState("");
  const [queueNotice, setQueueNotice] = useState("");
  const persistentQueueIds = useRef(new Set<string>());

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now);
      setTimeStr(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    fetch("/api/opd-queue")
      .then(async (response) => {
        if (!response.ok) {
          const result = await response.json() as { error?: string };
          throw new Error(result.error || "Unable to load the OPD queue.");
        }
        return response.json() as Promise<QueuePatient[]>;
      })
      .then((persistedQueue) => {
        if (!active) return;
        for (const patient of persistedQueue) persistentQueueIds.current.add(patient.id);
        setQueue((current) => {
          const existingIds = new Set(current.map((patient) => patient.id));
          return [...current, ...persistedQueue.filter((patient) => !existingIds.has(patient.id))];
        });
      })
      .catch((error: unknown) => {
        if (active) setQueueError(error instanceof Error ? error.message : "Unable to load the OPD queue.");
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredQueue = selectedDoctor === "all" ? queue : queue.filter((q) => q.doctorId === selectedDoctor);
  const waiting = filteredQueue.filter((q) => q.status === "waiting");
  const inConsultation = filteredQueue.filter((q) => q.status === "in-consultation");
  const completed = filteredQueue.filter((q) => q.status === "completed");
  const skipped = filteredQueue.filter((q) => q.status === "skipped");

  const avgWaitTime = waiting.length > 0 ? Math.round(waiting.reduce((s, q) => s + q.estimatedWaitMinutes, 0) / waiting.length) : 0;

  const updateQueueStatus = async (id: string, status: QueuePatient["status"]) => {
    const now = new Date().toISOString();
    if (persistentQueueIds.current.has(id)) {
      try {
        const response = await fetch("/api/opd-queue", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            status,
            consultStartTime: status === "in-consultation" ? now : undefined,
            consultEndTime: status === "completed" ? now : undefined,
          }),
        });
        const result = await response.json() as QueuePatient | { error?: string };
        if (!response.ok) {
          throw new Error("error" in result ? result.error : "Unable to update the OPD queue.");
        }
        setQueue((current) => current.map((patient) => patient.id === id ? result as QueuePatient : patient));
        setQueueError("");
      } catch (error) {
        setQueueError(error instanceof Error ? error.message : "Unable to update the OPD queue.");
      }
      return;
    }

    setQueue((current) => current.map((patient) => patient.id === id ? {
      ...patient,
      status,
      ...(status === "in-consultation" ? { consultStartTime: now, estimatedWaitMinutes: 0 } : {}),
      ...(status === "completed" ? { consultEndTime: now } : {}),
    } : patient));
  };

  const handleCallNext = (doctorId: string) => {
    const nextWaiting = queue.find((patient) => patient.doctorId === doctorId && patient.status === "waiting");
    if (nextWaiting) void updateQueueStatus(nextWaiting.id, "in-consultation");
  };

  const handleComplete = (id: string) => {
    void updateQueueStatus(id, "completed");
  };

  const handleSkip = (id: string) => {
    void updateQueueStatus(id, "skipped");
  };

  const handleRecall = (id: string) => {
    void updateQueueStatus(id, "waiting");
  };

  const handleWalkInSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWalkInSubmitting(true);
    setWalkInError("");

    try {
      const response = await fetch("/api/opd-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...walkInForm, age: Number(walkInForm.age) }),
      });
      const result = await response.json() as QueuePatient & {
        error?: string;
        patientCreated?: boolean;
        uhid?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "Unable to register this walk-in.");
      }

      persistentQueueIds.current.add(result.id);
      setQueue((current) => [...current, result]);
      setQueueNotice(
        result.patientCreated
          ? `${result.patientName} registered as a patient and added to the queue (${result.tokenNumber}).`
          : `${result.patientName} added to the queue (${result.tokenNumber}).`,
      );
      setWalkInForm({
        name: "",
        phone: "",
        age: "",
        gender: "Male",
        priority: "normal",
        doctorId: "u1",
        chiefComplaint: "",
      });
      setShowWalkinModal(false);
    } catch (error) {
      setWalkInError(error instanceof Error ? error.message : "Unable to register this walk-in.");
    } finally {
      setWalkInSubmitting(false);
    }
  };

  const getElapsedTime = (startTime?: string) => {
    if (!startTime) return "0:00";
    const start = new Date(startTime);
    const diff = Math.floor((currentTime.getTime() - start.getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getWaitingSince = (checkInTime: string) => {
    const checkIn = new Date(checkInTime);
    const diff = Math.floor((currentTime.getTime() - checkIn.getTime()) / 60000);
    if (diff < 1) return "Just now";
    return `${diff} min`;
  };

  // Group in-consultation by doctor for the "Now Serving" display
  const nowServing = inConsultation.reduce((acc, q) => {
    acc[q.doctorName] = q;
    return acc;
  }, {} as Record<string, QueuePatient>);

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">Live OPD Queue</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 font-mono">
              {timeStr}
            </span>
            <button
              onClick={() => setShowWalkinModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Walk-in Registration
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-sm">
              <MonitorPlay className="w-4 h-4" />
              TV Display
            </button>
          </div>
        </div>

        {(queueError || queueNotice) && (
          <div className={cn(
            "flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
            queueError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800",
          )}>
            <p role={queueError ? "alert" : "status"}>{queueError || queueNotice}</p>
            <button
              type="button"
              onClick={() => { setQueueError(""); setQueueNotice(""); }}
              className="shrink-0 font-medium"
              aria-label="Dismiss message"
            >
              &times;
            </button>
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Waiting", value: waiting.length, icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-200" },
            { label: "In Consultation", value: inConsultation.length, icon: Stethoscope, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
            { label: "Completed", value: completed.length, icon: CheckCircle2, color: "text-blue-600 bg-blue-50 border-blue-200" },
            { label: "Skipped", value: skipped.length, icon: SkipForward, color: "text-slate-600 bg-slate-50 border-slate-200" },
            { label: "Avg Wait", value: `${avgWaitTime} min`, icon: Timer, color: "text-violet-600 bg-violet-50 border-violet-200" },
            { label: "Total Today", value: queue.length, icon: Users, color: "text-teal-600 bg-teal-50 border-teal-200" },
          ].map((stat) => (
            <div key={stat.label} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", stat.color)}>
              <stat.icon className="w-5 h-5 shrink-0" />
              <div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-[11px] opacity-70">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Doctor Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {doctors.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoctor(doc.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                selectedDoctor === doc.id
                  ? "bg-emerald-500 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-300"
              )}
            >
              {doc.name}
              {doc.id !== "all" && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  selectedDoctor === doc.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  {queue.filter((q) => q.doctorId === doc.id && q.status === "waiting").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Now Serving Banner */}
        {Object.keys(nowServing).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(nowServing).map(([doctorName, patient]) => (
              <div key={doctorName} className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium opacity-80">NOW SERVING</span>
                  <span className="flex items-center gap-1 text-xs bg-white/20 rounded-full px-2 py-0.5">
                    <Activity className="w-3 h-3" />
                    {getElapsedTime(patient.consultStartTime)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                    {patient.tokenNumber}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{patient.patientName}</h3>
                    <p className="text-sm opacity-80">{patient.patientAge}y / {patient.patientGender} • {patient.department}</p>
                    <p className="text-xs opacity-60">{doctorName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleComplete(patient.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                  </button>
                  <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Queue Board - Kanban Style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Waiting Column */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-sm text-amber-800">Waiting</h3>
                <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">{waiting.length}</span>
              </div>
              <button className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-2.5 max-h-[600px] overflow-y-auto">
              {waiting.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No patients waiting</p>
                </div>
              ) : (
                waiting.map((patient) => (
                  <div
                    key={patient.id}
                    className={cn(
                      "rounded-lg border p-3 transition-all hover:shadow-md",
                      patient.priority === "urgent"
                        ? "border-red-300 bg-red-50"
                        : patient.priority === "emergency"
                        ? "border-red-500 bg-red-100 animate-pulse"
                        : "border-slate-200 bg-white"
                    )}
                  >
                    {/* Priority strip */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold",
                          patient.priority === "urgent" ? "bg-red-500 text-white" : "bg-amber-100 text-amber-700"
                        )}>
                          {patient.tokenNumber}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-800">{patient.patientName}</h4>
                          <p className="text-[11px] text-slate-500">{patient.patientAge}y / {patient.patientGender[0]} • {patient.patientId}</p>
                        </div>
                      </div>
                      {patient.priority === "urgent" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white">URGENT</span>
                      )}
                    </div>

                    <div className="space-y-1.5 mb-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Stethoscope className="w-3 h-3" />
                        <span>{patient.doctorName}</span>
                        <span className="text-slate-300">•</span>
                        <span>{patient.department}</span>
                      </div>
                      {patient.chiefComplaint && (
                        <p className="text-xs text-slate-400 italic truncate">&quot;{patient.chiefComplaint}&quot;</p>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Clock className="w-3 h-3" /> Waiting {getWaitingSince(patient.checkInTime)}
                        </span>
                        <span className={cn(
                          "flex items-center gap-1 text-[11px] font-medium",
                          patient.vitalsRecorded ? "text-emerald-600" : "text-amber-600"
                        )}>
                          <Activity className="w-3 h-3" />
                          {patient.vitalsRecorded ? "Vitals ✓" : "Vitals pending"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium",
                          patient.type === "walk-in" ? "bg-orange-100 text-orange-700" :
                          patient.type === "follow-up" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                        )}>
                          {patient.type}
                        </span>
                        <span className="text-slate-400">~{patient.estimatedWaitMinutes} min</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleCallNext(patient.doctorId)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-500 text-white rounded-md text-xs font-medium hover:bg-emerald-600 transition-colors"
                      >
                        <Play className="w-3 h-3" /> Call In
                      </button>
                      <button
                        onClick={() => handleSkip(patient.id)}
                        className="flex items-center justify-center gap-1 px-2 py-1.5 border border-slate-200 text-slate-500 rounded-md text-xs hover:bg-slate-50 transition-colors"
                      >
                        <SkipForward className="w-3 h-3" /> Skip
                      </button>
                      <button
                        onClick={() => handleSkip(patient.id)}
                        className="flex items-center justify-center gap-1 px-2 py-1.5 border border-red-200 text-red-500 rounded-md text-xs hover:bg-red-50 transition-colors"
                      >
                        <UserX className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* In Consultation Column */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-sm text-emerald-800">In Consultation</h3>
                <span className="bg-emerald-200 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">{inConsultation.length}</span>
              </div>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div className="p-3 space-y-2.5 max-h-[600px] overflow-y-auto">
              {inConsultation.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Stethoscope className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active consultations</p>
                </div>
              ) : (
                inConsultation.map((patient) => (
                  <div key={patient.id} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-lg font-bold">
                          {patient.tokenNumber}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-800">{patient.patientName}</h4>
                          <p className="text-[11px] text-slate-500">{patient.patientAge}y / {patient.patientGender[0]}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-200 rounded-full text-emerald-700 text-xs font-mono font-bold">
                        <Timer className="w-3 h-3" />
                        {getElapsedTime(patient.consultStartTime)}
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Stethoscope className="w-3 h-3" /> {patient.doctorName}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Activity className="w-3 h-3" /> {patient.department}
                      </div>
                      {patient.chiefComplaint && (
                        <p className="text-xs text-slate-500 italic bg-white rounded p-2 border border-emerald-100">
                          C/C: {patient.chiefComplaint}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-emerald-200">
                      <button
                        onClick={() => handleComplete(patient.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Complete Consultation
                      </button>
                      <button className="flex items-center justify-center gap-1 px-2 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-md text-xs hover:bg-emerald-100 transition-colors">
                        <Eye className="w-3 h-3" /> EMR
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Up Next Preview */}
              {waiting.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Up Next</h4>
                  {waiting.slice(0, 3).map((patient) => (
                    <div key={patient.id} className="flex items-center gap-2 py-1.5 text-sm text-slate-500">
                      <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        {patient.tokenNumber}
                      </span>
                      <span className="truncate">{patient.patientName}</span>
                      <ArrowRight className="w-3 h-3 ml-auto shrink-0" />
                      <span className="text-[11px] shrink-0">{patient.doctorName.replace("Dr. ", "")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                <h3 className="font-semibold text-sm text-slate-600">Completed</h3>
                <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{completed.length}</span>
              </div>
            </div>
            <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
              {completed.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No completed consultations yet</p>
                </div>
              ) : (
                completed.map((patient) => {
                  const duration = patient.consultStartTime && patient.consultEndTime
                    ? Math.round((new Date(patient.consultEndTime).getTime() - new Date(patient.consultStartTime).getTime()) / 60000)
                    : 0;
                  return (
                    <div key={patient.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {patient.tokenNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-slate-600 truncate">{patient.patientName}</h4>
                          <p className="text-[11px] text-slate-400">{patient.doctorName} • {patient.department}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                          {duration > 0 && (
                            <p className="text-[10px] text-slate-400">{duration} min consult</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Skipped patients */}
              {skipped.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Skipped / No Show</h4>
                  {skipped.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-red-50 border border-red-100 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-red-400">{patient.tokenNumber}</span>
                        <span className="text-sm text-red-600">{patient.patientName}</span>
                      </div>
                      <button
                        onClick={() => handleRecall(patient.id)}
                        className="text-[11px] text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Recall
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Token Display Bar */}
        <div className="bg-slate-900 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">TOKEN DISPLAY — Now Serving</h3>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <MonitorPlay className="w-3.5 h-3.5" />
              For waiting area TV display
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {doctors.filter(d => d.id !== "all").map((doc) => {
              const serving = queue.find((q) => q.doctorId === doc.id && q.status === "in-consultation");
              const nextUp = queue.find((q) => q.doctorId === doc.id && q.status === "waiting");
              return (
                <div key={doc.id} className="bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-[11px] text-slate-400 truncate">{doc.name}</p>
                  <p className="text-[10px] text-slate-500 mb-2">{'department' in doc ? doc.department : ''}</p>
                  {serving ? (
                    <>
                      <div className="text-3xl font-bold text-emerald-400 font-mono">{serving.tokenNumber}</div>
                      <p className="text-xs text-slate-300 truncate mt-1">{serving.patientName}</p>
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-slate-600 font-mono">---</div>
                  )}
                  {nextUp && (
                    <p className="text-[10px] text-slate-500 mt-2">Next: {nextUp.tokenNumber}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Walk-in Registration Modal */}
        {showWalkinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Walk-in Registration</h2>
                <button
                  type="button"
                  disabled={walkInSubmitting}
                  onClick={() => { setShowWalkinModal(false); setWalkInError(""); }}
                  className="text-slate-400 hover:text-slate-600 text-xl disabled:opacity-50"
                  aria-label="Close walk-in registration"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleWalkInSubmit}>
                <div className="p-6 space-y-4">
                  {walkInError && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {walkInError}
                    </p>
                  )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Patient Name *</label>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={walkInForm.name}
                      onChange={(event) => setWalkInForm((form) => ({ ...form, name: event.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={walkInForm.phone}
                      onChange={(event) => setWalkInForm((form) => ({ ...form, phone: event.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Age *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={120}
                      step={1}
                      value={walkInForm.age}
                      onChange={(event) => setWalkInForm((form) => ({ ...form, age: event.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Age"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Gender *</label>
                    <select
                      value={walkInForm.gender}
                      onChange={(event) => setWalkInForm((form) => ({ ...form, gender: event.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
                    <select
                      value={walkInForm.priority}
                      onChange={(event) => setWalkInForm((form) => ({ ...form, priority: event.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Doctor *</label>
                  <select
                    value={walkInForm.doctorId}
                    onChange={(event) => setWalkInForm((form) => ({ ...form, doctorId: event.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {doctors.filter(d => d.id !== "all").map(d => (
                      <option key={d.id} value={d.id}>{d.name} — {'department' in d ? d.department : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Chief Complaint</label>
                  <textarea
                    maxLength={1000}
                    value={walkInForm.chiefComplaint}
                    onChange={(event) => setWalkInForm((form) => ({ ...form, chiefComplaint: event.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    rows={2}
                    placeholder="Brief complaint description"
                  />
                </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={walkInSubmitting}
                    onClick={() => { setShowWalkinModal(false); setWalkInError(""); }}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={walkInSubmitting}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-60"
                  >
                    {walkInSubmitting ? "Registering..." : "Register & Add to Queue"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
