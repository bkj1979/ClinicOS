"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  Pause,
  Play,
  Square,
  Save,
  Trash2,
  Copy,
  Check,
  Languages,
  Brain,
  FileText,
  Stethoscope,
  Activity,
  User,
  AlertCircle,
  Sparkles,
  Volume2,
  Heart,
} from "lucide-react";
import { cn, getInitials, formatDate } from "@/lib/utils";
import type { Patient } from "@/lib/types";
import AppLayout from "@/components/layout/app-layout";

// ============================================================
// AI Voice Scribe Page
// ============================================================

type RecordingState = "ready" | "recording" | "paused" | "processing" | "complete";
type SOAPTab = "subjective" | "objective" | "assessment" | "plan";
type VisitType = "opd" | "follow-up" | "emergency" | "teleconsult";

interface SoapDraft {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  summary: string;
}

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
];

// ---- Waveform Bar component ----
function WaveformBars({ isActive, barCount = 18 }: { isActive: boolean; barCount?: number }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-16">
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-[3px] rounded-full transition-all duration-300",
            isActive
              ? "bg-gradient-to-t from-emerald-500 to-teal-400 animate-waveform"
              : "bg-slate-300 h-2"
          )}
          style={
            isActive
              ? {
                  animationDelay: `${(i * 0.08).toFixed(2)}s`,
                  animationDuration: `${0.6 + (i % 5) * 0.1}s`,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function VoiceScribePage() {
  const [recordingState, setRecordingState] = useState<RecordingState>("ready");
  const [elapsed, setElapsed] = useState(0);
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [visitType, setVisitType] = useState<VisitType>("opd");
  const [soapTab, setSoapTab] = useState<SOAPTab>("subjective");
  const [language, setLanguage] = useState("en");
  const [autoDetect, setAutoDetect] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [soapNotes, setSoapNotes] = useState<Pick<SoapDraft, "subjective" | "objective" | "assessment" | "plan">>({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [summary, setSummary] = useState("");
  const [scribeError, setScribeError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedEncounterId, setSavedEncounterId] = useState("");
  const [speechServiceReady, setSpeechServiceReady] = useState(false);
  const [languageModelReady, setLanguageModelReady] = useState(false);
  const [modelName, setModelName] = useState("qwen2.5:1.5b");
  const [hasPendingRecording, setHasPendingRecording] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pendingRecordingRef = useRef<Blob | null>(null);
  const discardRecordingRef = useRef(false);

  const patient = patientList.find((item) => item.id === selectedPatient);

  const refreshLocalServices = useCallback(async () => {
    try {
      const response = await fetch("/api/voice-scribe/health", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to check local AI services.");
      const result = await response.json() as {
        speech?: { ready?: boolean };
        languageModel?: { ready?: boolean; model?: string };
      };
      setSpeechServiceReady(Boolean(result.speech?.ready));
      setLanguageModelReady(Boolean(result.languageModel?.ready));
      if (result.languageModel?.model) setModelName(result.languageModel.model);
    } catch {
      setSpeechServiceReady(false);
      setLanguageModelReady(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/patients")
      .then(async (response) => {
        const result = await response.json() as Patient[] | { error?: string };
        if (!response.ok) throw new Error("error" in result ? result.error : "Unable to load patients.");
        return result as Patient[];
      })
      .then((result) => {
        if (!active) return;
        setPatientList(result);
        const searchParams = new URLSearchParams(window.location.search);
        const requestedPatientId = searchParams.get("patientId");
        const requestedPatient = requestedPatientId
          ? result.find((item) => item.id === requestedPatientId)
          : undefined;
        const requestedVisitType = searchParams.get("visitType");
        const requestedComplaint = searchParams.get("chiefComplaint");

        if (result.length > 0) setSelectedPatient(requestedPatient?.id || result[0].id);
        if (requestedPatientId && !requestedPatient) {
          setPatientsError("The patient from the consultation was not found. Please select a patient.");
        }
        if (requestedVisitType && ["opd", "follow-up", "emergency", "teleconsult"].includes(requestedVisitType)) {
          setVisitType(requestedVisitType as VisitType);
        }
        if (requestedComplaint) setChiefComplaint(requestedComplaint);
      })
      .catch((error: unknown) => {
        if (active) setPatientsError(error instanceof Error ? error.message : "Unable to load patients.");
      })
      .finally(() => {
        if (active) setPatientsLoading(false);
      });

    const initialHealthCheck = window.setTimeout(() => {
      if (active) void refreshLocalServices();
    }, 0);
    const healthCheck = window.setInterval(() => {
      if (active) void refreshLocalServices();
    }, 5000);

    return () => {
      active = false;
      window.clearTimeout(initialHealthCheck);
      window.clearInterval(healthCheck);
    };
  }, [refreshLocalServices]);

  useEffect(() => () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  // Recording timer
  useEffect(() => {
    if (recordingState === "recording") {
      timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recordingState]);

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const createDraft = async (sourceTranscript: string) => {
    if (!patient) throw new Error("Select a registered patient before generating notes.");
    const response = await fetch("/api/voice-scribe/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: sourceTranscript,
        patient: { id: patient.id, name: patient.name, age: patient.age, gender: patient.gender },
        chiefComplaint,
        visitType,
      }),
    });
    const result = await response.json() as SoapDraft | { error?: string };
    if (!response.ok || !("subjective" in result)) {
      throw new Error("error" in result ? result.error : "Unable to draft SOAP notes.");
    }
    setSoapNotes({
      subjective: result.subjective,
      objective: result.objective,
      assessment: result.assessment,
      plan: result.plan,
    });
    setSummary(result.summary);
    setSaveMessage("");
  };

  const transcribeRecording = async (recording: Blob) => {
    setScribeError("");
    setTranscript("");
    setSoapNotes({ subjective: "", objective: "", assessment: "", plan: "" });
    setSummary("");
    setSavedEncounterId("");
    try {
      const upload = new FormData();
      const mimeType = recording.type.split(";")[0] || "audio/webm";
      const extension = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : mimeType.includes("wav") ? "wav" : "webm";
      upload.set("audio", new File([recording], `consultation.${extension}`, { type: mimeType }));
      upload.set("language", autoDetect ? "auto" : language);
      const response = await fetch("/api/voice-scribe/transcribe", { method: "POST", body: upload });
      const result = await response.json() as { text?: string; error?: string };
      if (!response.ok || !result.text) throw new Error(result.error || "Unable to transcribe this recording.");
      pendingRecordingRef.current = null;
      setHasPendingRecording(false);
      setTranscript(result.text);
      await createDraft(result.text);
    } catch (error) {
      if (pendingRecordingRef.current === recording) {
        setScribeError(
          `${error instanceof Error ? error.message : "Unable to process this recording."} The recording is still available in this page; start the local speech service and retry transcription.`,
        );
      } else {
        setScribeError(error instanceof Error ? error.message : "Unable to process this recording.");
      }
    } finally {
      setRecordingState("complete");
    }
  };

  const handleToggleRecording = async () => {
    if (recordingState === "recording" || recordingState === "paused") {
      if (!mediaRecorderRef.current) {
        setScribeError("The recorder is no longer available. Start a new recording.");
        setRecordingState("ready");
        return;
      }
      setRecordingState("processing");
      mediaRecorderRef.current.stop();
      return;
    }
    if (recordingState === "processing") return;
    if (!patient) {
      setScribeError("Select a registered patient before recording.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setScribeError("This browser does not support local audio recording. Try an up-to-date Chrome or Edge browser.");
      return;
    }

    setScribeError("");
    setSaveMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const supportedTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mimeType = supportedTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];
      discardRecordingRef.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setScribeError("The browser could not record microphone audio.");
        setRecordingState("ready");
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        audioChunksRef.current = [];
        pendingRecordingRef.current = null;
        setHasPendingRecording(false);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        if (discardRecordingRef.current) {
          discardRecordingRef.current = false;
          return;
        }
        const recording = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        audioChunksRef.current = [];
        if (recording.size === 0) {
          setScribeError("No audio was captured. Check the microphone and try again.");
          setRecordingState("ready");
          return;
        }
        pendingRecordingRef.current = recording;
        setHasPendingRecording(true);
        void transcribeRecording(recording);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      pendingRecordingRef.current = null;
      setHasPendingRecording(false);
      setElapsed(0);
      setTranscript("");
      setSoapNotes({ subjective: "", objective: "", assessment: "", plan: "" });
      setSummary("");
      setSavedEncounterId("");
      setRecordingState("recording");
    } catch (error) {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      setScribeError(error instanceof Error ? error.message : "Microphone access was denied or unavailable.");
      setRecordingState("ready");
    }
  };

  const handleRetryTranscription = async () => {
    const pendingRecording = pendingRecordingRef.current;
    if (!pendingRecording || recordingState === "processing") return;
    setRecordingState("processing");
    await transcribeRecording(pendingRecording);
  };

  const handlePause = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") {
      recorder.pause();
      setRecordingState("paused");
    } else if (recorder.state === "paused") {
      recorder.resume();
      setRecordingState("recording");
    }
  };

  const handleGenerateNotes = async () => {
    if (!transcript.trim()) return;
    setScribeError("");
    setRecordingState("processing");
    try {
      await createDraft(transcript);
    } catch (error) {
      setScribeError(error instanceof Error ? error.message : "Unable to generate draft notes.");
    } finally {
      setRecordingState("complete");
    }
  };

  const handleSave = async () => {
    if (!patient) return;
    setSaving(true);
    setScribeError("");
    setSaveMessage("");
    try {
      const response = await fetch("/api/voice-scribe/save", {
        method: savedEncounterId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: savedEncounterId || undefined,
          patientId: patient.id,
          chiefComplaint,
          visitType,
          transcript,
          notes: soapNotes,
          summary,
        }),
      });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error || "Unable to save the encounter draft.");
      setSavedEncounterId(result.id);
      setSaveMessage("Draft saved to the local EMR. Review and sign it in the encounter workflow.");
    } catch (error) {
      setScribeError(error instanceof Error ? error.message : "Unable to save the encounter draft.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (savedEncounterId) {
      try {
        const response = await fetch("/api/voice-scribe/save", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: savedEncounterId }),
        });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error || "Unable to discard the saved draft.");
      } catch (error) {
        setScribeError(error instanceof Error ? error.message : "Unable to discard the saved draft.");
        return;
      }
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      discardRecordingRef.current = true;
      recorder.stop();
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    pendingRecordingRef.current = null;
    setHasPendingRecording(false);
    setRecordingState("ready");
    setElapsed(0);
    setTranscript("");
    setSoapNotes({ subjective: "", objective: "", assessment: "", plan: "" });
    setSummary("");
    setScribeError("");
    setSaveMessage("");
    setSavedEncounterId("");
  };

  const handleCopy = async (section: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedSection(section);
      window.setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      setScribeError("Unable to copy to the clipboard. Check browser clipboard permissions.");
    }
  };

  const statusConfig: Record<RecordingState, { label: string; color: string; dotColor: string }> = {
    ready: { label: "Ready", color: "text-slate-500", dotColor: "bg-slate-400" },
    recording: { label: "Recording...", color: "text-red-600", dotColor: "bg-red-500" },
    paused: { label: "Paused", color: "text-amber-600", dotColor: "bg-amber-500" },
    processing: { label: "Processing...", color: "text-blue-600", dotColor: "bg-blue-500" },
    complete: { label: "Complete", color: "text-emerald-600", dotColor: "bg-emerald-500" },
  };

  const soapContent: Record<SOAPTab, string> = {
    subjective: soapNotes.subjective,
    objective: soapNotes.objective,
    assessment: soapNotes.assessment,
    plan: soapNotes.plan,
  };

  return (
    <AppLayout>
      {/* CSS for waveform animation */}
      <style jsx global>{`
        @keyframes waveform {
          0%, 100% { height: 6px; }
          50% { height: 48px; }
        }
        .animate-waveform {
          animation-name: waveform;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .pulse-ring {
          animation: pulse-ring 1.5s ease-out infinite;
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AI Voice Scribe</h1>
              <p className="text-sm text-slate-500 mt-0.5">Audio and clinical data stay on this computer</p>
              <p className="text-xs text-slate-400 mt-1">
                Speech model {speechServiceReady ? "ready" : "offline"} · {modelName} {languageModelReady ? "ready" : "offline"}
                <button
                  type="button"
                  onClick={() => void refreshLocalServices()}
                  className="ml-2 text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
                >
                  Check again
                </button>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className={cn("flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium", recordingState === "recording" ? "border-red-200 bg-red-50" : recordingState === "processing" ? "border-blue-200 bg-blue-50" : recordingState === "complete" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
              <div className={cn("w-2.5 h-2.5 rounded-full", statusConfig[recordingState].dotColor, recordingState === "recording" && "animate-pulse")} />
              <span className={statusConfig[recordingState].color}>{statusConfig[recordingState].label}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600 font-mono">{formatTimer(elapsed)}</span>
            </div>
          </div>
        </div>

        {/* Main 3-column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ===================== LEFT PANEL: Patient Context ===================== */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b">
                <h3 className="font-bold text-slate-900 flex items-center gap-2"><User className="w-4 h-4 text-emerald-600" /> Patient Context</h3>
              </div>
              <div className="p-5 space-y-4">
                {/* Patient Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Patient</label>
                  <select
                    value={selectedPatient}
                    disabled={patientsLoading || patientList.length === 0 || Boolean(transcript) || recordingState === "recording" || recordingState === "paused" || recordingState === "processing"}
                    onChange={(e) => { setSelectedPatient(e.target.value); setSavedEncounterId(""); setSaveMessage(""); }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                  >
                    {patientsLoading && <option value="">Loading patients...</option>}
                    {!patientsLoading && patientList.length === 0 && <option value="">No registered patients</option>}
                    {patientList.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>)}
                  </select>
                  {patientsError && <p role="alert" className="mt-1 text-xs text-red-600">{patientsError}</p>}
                </div>

                {/* Patient Card */}
                {patient && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">{getInitials(patient.name)}</div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{patient.name}</p>
                        <p className="text-xs text-slate-500">{patient.uhid} • {patient.gender}, {patient.age}y</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/70 rounded-lg px-2.5 py-1.5">
                        <span className="text-slate-400 block">Blood Group</span>
                        <span className="font-bold text-red-600">{patient.bloodGroup || "N/A"}</span>
                      </div>
                      <div className="bg-white/70 rounded-lg px-2.5 py-1.5">
                        <span className="text-slate-400 block">Phone</span>
                        <span className="font-medium text-slate-700">{patient.phone.slice(-4)}</span>
                      </div>
                    </div>
                    {patient.allergies.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-red-600 font-semibold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Allergies</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {patient.allergies.map((a) => <span key={a} className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{a}</span>)}
                        </div>
                      </div>
                    )}
                    {patient.chronicConditions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-amber-600 font-semibold flex items-center gap-1"><Heart className="w-3 h-3" /> Chronic Conditions</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {patient.chronicConditions.map((c) => <span key={c} className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{c}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Chief Complaint */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Chief Complaint</label>
                  <textarea value={chiefComplaint} onChange={(e) => { setChiefComplaint(e.target.value); setSaveMessage(""); }} disabled={recordingState === "recording" || recordingState === "paused" || recordingState === "processing"} rows={2} maxLength={1000} placeholder="Enter the patient's chief complaint" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none disabled:bg-slate-100" />
                </div>

                {/* Visit Type */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Visit Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["opd", "follow-up", "emergency", "teleconsult"] as const).map((t) => (
                      <button key={t} type="button" disabled={recordingState === "recording" || recordingState === "paused" || recordingState === "processing"} onClick={() => { setVisitType(t); setSaveMessage(""); }} className={cn("px-3 py-2 text-xs font-medium rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-50", visitType === t ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500 hover:border-slate-300")}>
                        {t === "opd" ? "OPD" : t === "follow-up" ? "Follow-Up" : t === "emergency" ? "Emergency" : "Teleconsult"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Last Visit */}
                {patient?.lastVisit && (
                  <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Last Visit:</span> {formatDate(patient.lastVisit)} • Total: {patient.totalVisits} visits
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===================== CENTER: Recording Area ===================== */}
          <div className="lg:col-span-4 space-y-4">
            {/* Recording Controls */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 flex flex-col items-center">
                {/* Timer */}
                <p className="font-mono text-4xl font-bold text-slate-900 mb-6 tracking-wider tabular-nums">{formatTimer(elapsed)}</p>

                {/* Mic Button */}
                <div className="relative mb-6">
                  {recordingState === "recording" && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-red-500/20 pulse-ring" style={{ margin: "-12px" }} />
                      <div className="absolute inset-0 rounded-full bg-red-500/10 pulse-ring" style={{ margin: "-24px", animationDelay: "0.5s" }} />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleToggleRecording}
                    disabled={recordingState === "processing" || !patient}
                    aria-label={recordingState === "recording" || recordingState === "paused" ? "Stop recording" : "Start recording"}
                    className={cn("relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed", recordingState === "recording" || recordingState === "paused" ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/30" : recordingState === "processing" ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30 animate-pulse cursor-wait" : "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/30")}
                  >
                    {recordingState === "recording" || recordingState === "paused" ? (
                      <Square className="w-9 h-9 text-white fill-white" />
                    ) : recordingState === "processing" ? (
                      <Sparkles className="w-9 h-9 text-white animate-spin" />
                    ) : (
                      <Mic className="w-9 h-9 text-white" />
                    )}
                  </button>
                </div>

                {/* Secondary controls */}
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={handlePause} disabled={recordingState !== "recording" && recordingState !== "paused"} className={cn("p-3 rounded-xl border transition-all", (recordingState === "recording" || recordingState === "paused") ? "border-slate-300 hover:bg-slate-100 text-slate-700" : "border-slate-100 text-slate-300 cursor-not-allowed")}>
                    {recordingState === "paused" ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  </button>
                  {transcript && (
                    <button type="button" onClick={handleDiscard} className="p-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50" aria-label="Discard recording">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Status text */}
                <p className={cn("text-sm font-medium", statusConfig[recordingState].color)}>
                  {recordingState === "ready" && "Allow microphone access, then tap to record"}
                  {recordingState === "recording" && "Listening... Speak naturally"}
                  {recordingState === "paused" && "Recording paused — Tap play to resume"}
                  {recordingState === "processing" && "Local models are transcribing and drafting notes..."}
                  {recordingState === "complete" && (transcript ? "Review and edit the transcript and draft notes" : "No recording yet")}
                </p>
                {!speechServiceReady && (
                  <p role="status" className="mt-2 text-center text-xs text-amber-700">
                    Microphone recording is available. Transcription needs the local speech service:
                    {" "}<code>npm run voice-scribe:local</code>. Select “Check again” after it starts.
                  </p>
                )}
                {scribeError && <p role="alert" className="mt-3 text-center text-xs text-red-600">{scribeError}</p>}
                {hasPendingRecording && recordingState === "complete" && (
                  <button
                    type="button"
                    onClick={() => void handleRetryTranscription()}
                    disabled={!speechServiceReady}
                    className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Retry transcription
                  </button>
                )}

                {/* Waveform */}
                <div className="w-full mt-6">
                  <WaveformBars isActive={recordingState === "recording"} barCount={20} />
                </div>
              </div>
            </div>

            {/* Live Transcript */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-slate-50 to-white">
                <h3 className="font-bold text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /> Live Transcript</h3>
                <button type="button" disabled={!transcript} onClick={() => void handleCopy("transcript", transcript)} className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 disabled:opacity-40">
                  {copiedSection === "transcript" ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <div className="p-5 max-h-[420px] overflow-y-auto">
                <textarea
                  aria-label="Transcription"
                  value={transcript}
                  onChange={(event) => { setTranscript(event.target.value); setSaveMessage(""); }}
                  placeholder="Your local transcription will appear here after recording. You can edit it before generating notes."
                  rows={12}
                  maxLength={100000}
                  className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-400">Audio stays in this page until transcription succeeds or you discard it.</p>
                  <button
                    type="button"
                    disabled={!patient || !transcript.trim() || recordingState === "processing" || !languageModelReady}
                    onClick={() => void handleGenerateNotes()}
                    className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {recordingState === "processing" ? "Generating..." : "Generate Notes"}
                  </button>
                  {!languageModelReady && transcript.trim() && (
                    <p role="status" className="basis-full text-right text-xs text-amber-700">
                      Start Ollama and its local model, then select “Check again”.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ===================== RIGHT PANEL: AI Output ===================== */}
          <div className="lg:col-span-5 space-y-4">
            {/* SOAP Notes */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-slate-50 to-white">
                <h3 className="font-bold text-slate-900 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-emerald-600" /> AI-Generated SOAP Notes</h3>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs text-amber-600 font-medium">Local AI Draft · Review Before Saving</span>
                </div>
              </div>
              {/* SOAP Tabs */}
              <div className="flex border-b">
                {(["subjective", "objective", "assessment", "plan"] as SOAPTab[]).map((tab) => (
                  <button key={tab} onClick={() => setSoapTab(tab)} className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-px", soapTab === tab ? "border-emerald-600 text-emerald-700 bg-emerald-50/40" : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50")}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <div className="p-5">
                <div className="flex justify-end mb-2">
                  <button type="button" disabled={!soapContent[soapTab]} onClick={() => void handleCopy(soapTab, soapContent[soapTab])} className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 disabled:opacity-40">
                    {copiedSection === soapTab ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                </div>
                <textarea
                  aria-label={`${soapTab} SOAP note`}
                  value={soapContent[soapTab]}
                  onChange={(event) => {
                    setSoapNotes((notes) => ({ ...notes, [soapTab]: event.target.value }));
                    setSaveMessage("");
                  }}
                  placeholder="SOAP notes generated from the actual consultation will appear here. Review and edit before saving."
                  rows={6}
                  maxLength={10000}
                  className="w-full resize-y rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* AI Clinical Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-slate-50 to-white">
                <h3 className="font-bold text-slate-900 flex items-center gap-2"><Activity className="w-4 h-4 text-teal-600" /> AI Clinical Summary</h3>
                <button type="button" disabled={!summary} onClick={() => void handleCopy("summary", summary)} className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 disabled:opacity-40">
                  {copiedSection === "summary" ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <div className="p-5">
                <textarea
                  aria-label="AI clinical summary"
                  value={summary}
                  onChange={(event) => { setSummary(event.target.value); setSaveMessage(""); }}
                  placeholder="A concise summary based on the transcript will appear here."
                  rows={5}
                  maxLength={10000}
                  className="w-full resize-y rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===================== BOTTOM CONTROLS ===================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!patient || !transcript.trim() || saving || recordingState === "recording" || recordingState === "paused" || recordingState === "processing"}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? "Saving Draft..." : savedEncounterId ? "Update Saved Draft" : "Save Draft to EMR"}
              </button>
              <button type="button" onClick={handleDiscard} className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-600 bg-red-50 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all">
                <Trash2 className="w-4 h-4" /> Discard
              </button>
            </div>

            {/* Right: Settings */}
            <div className="flex items-center gap-4">
              {/* Language */}
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-slate-400" />
                <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={autoDetect || recordingState === "recording" || recordingState === "paused" || recordingState === "processing"} className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-slate-100">
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label} ({l.native})</option>)}
                </select>
              </div>

              {/* Auto-detect */}
              <div className="flex items-center gap-2">
                <button type="button" role="switch" aria-checked={autoDetect} aria-label="Auto-detect language" disabled={recordingState === "recording" || recordingState === "paused" || recordingState === "processing"} onClick={() => setAutoDetect(!autoDetect)} className={cn("relative w-10 h-5 rounded-full transition-colors duration-300 disabled:opacity-50", autoDetect ? "bg-emerald-500" : "bg-slate-300")}>
                  <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300", autoDetect ? "translate-x-5" : "translate-x-0.5")} />
                </button>
                <span className="text-xs text-slate-500 font-medium">Auto-detect language</span>
              </div>
            </div>
            {(saveMessage || savedEncounterId) && (
              <p role="status" className="mt-4 text-sm text-emerald-700">
                {saveMessage} {savedEncounterId && <span className="text-xs text-slate-500">Draft ID: {savedEncounterId}</span>}
              </p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
