"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Save,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  Globe,
  Languages,
  Brain,
  FileText,
  Stethoscope,
  ClipboardList,
  Activity,
  User,
  AlertCircle,
  Sparkles,
  Settings,
  Volume2,
  ChevronRight,
  BadgeCheck,
  XCircle,
  Clock,
  Zap,
  Heart,
} from "lucide-react";
import { patients, encounters } from "@/lib/mock-data";
import { cn, getInitials, formatDate } from "@/lib/utils";
import AppLayout from "@/components/layout/app-layout";

// ============================================================
// AI Voice Scribe Page
// ============================================================

type RecordingState = "ready" | "recording" | "paused" | "processing" | "complete";
type SOAPTab = "subjective" | "objective" | "assessment" | "plan";

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
];

// Realistic mock transcript for the diabetes consultation
const MOCK_TRANSCRIPT = `[00:00:02] Dr. Priya Sharma: Good morning, Mr. Verma. How have you been since our last visit?

[00:00:08] Arun Kumar Verma: Good morning, Doctor. I've been okay, but I've been feeling quite tired for the past two weeks. And my vision gets a little blurry sometimes, especially in the evenings.

[00:00:22] Dr. Priya Sharma: I see. Let me note that down. Have you been taking your Metformin 500mg regularly?

[00:00:28] Arun Kumar Verma: Yes, Doctor. I take it twice a day as you prescribed — morning and night with food. I haven't missed any doses.

[00:00:38] Dr. Priya Sharma: Good, good. And how has your diet been? Are you following the dietary restrictions we discussed?

[00:00:45] Arun Kumar Verma: Honestly, Doctor, I haven't been very strict. There were a few family functions and I had sweets. My wife keeps telling me to control, but it's hard sometimes.

[00:01:00] Dr. Priya Sharma: I understand. Family functions can be challenging. But diet control is really crucial for managing your diabetes. Are you experiencing any increased urination or excessive thirst?

[00:01:14] Arun Kumar Verma: No, nothing like that. Just the tiredness and the blurry vision I mentioned. My sleep is fine though — I get about 7 hours.

[00:01:25] Dr. Priya Sharma: Alright. Let me check your vitals now. Your blood pressure is 138 over 88, which is slightly elevated. Your weight is 82 kg. And your fasting blood sugar today is 186 mg/dL, which is higher than what we'd like.

[00:01:48] Arun Kumar Verma: 186? That's not good, is it?

[00:01:52] Dr. Priya Sharma: It's above the target range, yes. And your HbA1c report has come back at 7.8%, which means your average sugar over the last three months has been on the higher side. Our target is below 7%. The fatigue and blurry vision you're experiencing are most likely related to these elevated sugar levels.

[00:02:18] Arun Kumar Verma: What do we do now, Doctor?

[00:02:22] Dr. Priya Sharma: I'm going to make some changes to your treatment plan. First, I'll increase your Metformin dose from 500mg to 1000mg, twice daily. Second, I'm adding a new medication called Glimepiride 1mg — take it once daily, about 15 to 30 minutes before breakfast. And since your blood pressure is also slightly elevated, I'm starting you on Amlodipine 5mg at bedtime.

[00:02:55] Arun Kumar Verma: Three medications now... is that okay?

[00:02:58] Dr. Priya Sharma: It's very common for diabetic patients to be on multiple medications. The key is to get your numbers under control to prevent complications. I also want you to start monitoring your blood pressure at home twice daily, and I'm going to refer you to our nutritionist for proper dietary counseling.

[00:03:20] Arun Kumar Verma: Okay, Doctor. I'll follow your advice this time. What about my eyes?

[00:03:26] Dr. Priya Sharma: I did a quick fundoscopy today and I don't see any diabetic retinopathy changes, which is good. But I'm referring you to ophthalmology for a thorough annual diabetic eye screening. We need to be proactive about this. Let me also check your feet... sensation is intact, pedal pulses are present bilaterally, that's reassuring.

[00:03:52] Arun Kumar Verma: Thank you, Doctor.

[00:03:55] Dr. Priya Sharma: I want to see you back in 4 weeks. We'll repeat the HbA1c in 3 months. If you notice any dizziness, excessive sweating, or sudden vision changes, please come in immediately. Walk 30 minutes daily, avoid sweets and refined carbs. Any questions?

[00:04:15] Arun Kumar Verma: No, Doctor. I'll be more careful this time. Thank you.

[00:04:20] Dr. Priya Sharma: Take care, Mr. Verma. See you in 4 weeks.`;

const SUGGESTED_ICD_CODES = [
  { code: "E11.65", description: "Type 2 diabetes mellitus with hyperglycemia", confidence: 96, accepted: true },
  { code: "R53.83", description: "Other fatigue", confidence: 89, accepted: true },
  { code: "H53.8", description: "Other visual disturbances", confidence: 82, accepted: false },
  { code: "E66.01", description: "Morbid obesity due to excess calories", confidence: 78, accepted: false },
  { code: "R03.0", description: "Elevated blood-pressure reading, without diagnosis of hypertension", confidence: 74, accepted: false },
  { code: "Z79.84", description: "Long term (current) use of oral hypoglycemic drugs", confidence: 71, accepted: false },
];

const AI_SUMMARY = `Mr. Arun Kumar Verma, a 41-year-old male with a history of Type 2 Diabetes and Hypertension, presented for a follow-up visit reporting persistent fatigue for 2 weeks and occasional blurred vision in the evenings. He has been compliant with Metformin 500mg BD but admits to poor dietary control. Vitals revealed slightly elevated BP (138/88 mmHg), elevated FBS (186 mg/dL), and HbA1c of 7.8%, indicating suboptimal glycemic control. BMI is 27.7 (overweight). No diabetic retinopathy on fundoscopy, intact peripheral sensation. Treatment plan includes escalation of Metformin to 1000mg BD, addition of Glimepiride 1mg OD, initiation of Amlodipine 5mg for BP, referral to nutritionist and ophthalmology, with follow-up in 4 weeks.`;

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
                  animationDuration: `${0.6 + Math.random() * 0.4}s`,
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
  const [recordingState, setRecordingState] = useState<RecordingState>("complete");
  const [elapsed, setElapsed] = useState(260); // simulate ~4:20 elapsed for the mock transcript
  const [selectedPatient, setSelectedPatient] = useState("p1");
  const [chiefComplaint, setChiefComplaint] = useState("Follow-up for diabetes management");
  const [visitType, setVisitType] = useState<"opd" | "follow-up" | "emergency" | "teleconsult">("follow-up");
  const [soapTab, setSoapTab] = useState<SOAPTab>("subjective");
  const [language, setLanguage] = useState("en");
  const [autoDetect, setAutoDetect] = useState(true);
  const [icdCodes, setIcdCodes] = useState(SUGGESTED_ICD_CODES);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const patient = patients.find((p) => p.id === selectedPatient);
  const encounter = encounters[0]; // Arun Kumar Verma encounter

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

  const handleToggleRecording = () => {
    if (recordingState === "ready" || recordingState === "complete") {
      setRecordingState("recording");
      if (recordingState === "ready") setElapsed(0);
    } else if (recordingState === "recording") {
      setRecordingState("processing");
      setTimeout(() => setRecordingState("complete"), 2000);
    }
  };

  const handlePause = () => {
    if (recordingState === "recording") setRecordingState("paused");
    else if (recordingState === "paused") setRecordingState("recording");
  };

  const handleDiscard = () => {
    setRecordingState("ready");
    setElapsed(0);
  };

  const toggleIcd = (code: string) => {
    setIcdCodes((prev) => prev.map((c) => (c.code === code ? { ...c, accepted: !c.accepted } : c)));
  };

  const handleCopy = (section: string) => {
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const statusConfig: Record<RecordingState, { label: string; color: string; dotColor: string }> = {
    ready: { label: "Ready", color: "text-slate-500", dotColor: "bg-slate-400" },
    recording: { label: "Recording...", color: "text-red-600", dotColor: "bg-red-500" },
    paused: { label: "Paused", color: "text-amber-600", dotColor: "bg-amber-500" },
    processing: { label: "Processing...", color: "text-blue-600", dotColor: "bg-blue-500" },
    complete: { label: "Complete", color: "text-emerald-600", dotColor: "bg-emerald-500" },
  };

  const soapNotes = encounter.notes;
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
              <p className="text-sm text-slate-500 mt-0.5">Real-time AI-powered medical documentation</p>
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
                  <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                    {patients.slice(0, 6).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>)}
                  </select>
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
                  <textarea value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                </div>

                {/* Visit Type */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Visit Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["opd", "follow-up", "emergency", "teleconsult"] as const).map((t) => (
                      <button key={t} onClick={() => setVisitType(t)} className={cn("px-3 py-2 text-xs font-medium rounded-lg border transition-all", visitType === t ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500 hover:border-slate-300")}>
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
                  <button onClick={handleToggleRecording} className={cn("relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-300", recordingState === "recording" ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/30" : recordingState === "processing" ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30 animate-pulse cursor-wait" : "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/30")}>
                    {recordingState === "recording" ? (
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
                </div>

                {/* Status text */}
                <p className={cn("text-sm font-medium", statusConfig[recordingState].color)}>
                  {recordingState === "ready" && "Tap the microphone to start recording"}
                  {recordingState === "recording" && "Listening... Speak naturally"}
                  {recordingState === "paused" && "Recording paused — Tap play to resume"}
                  {recordingState === "processing" && "AI is analyzing the conversation..."}
                  {recordingState === "complete" && "Transcription complete — Review the output"}
                </p>

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
                <button onClick={() => handleCopy("transcript")} className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1">
                  {copiedSection === "transcript" ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <div className="p-5 max-h-[420px] overflow-y-auto">
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-mono space-y-3">
                  {MOCK_TRANSCRIPT.split("\n\n").map((block, i) => {
                    const isDoctor = block.includes("Dr. Priya Sharma:");
                    return (
                      <div key={i} className={cn("rounded-lg p-3 text-xs", isDoctor ? "bg-blue-50 border-l-2 border-blue-400" : "bg-slate-50 border-l-2 border-slate-300")}>
                        {block}
                      </div>
                    );
                  })}
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
                  <span className="text-xs text-amber-600 font-medium">AI Generated</span>
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
                  <button onClick={() => handleCopy(soapTab)} className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1">
                    {copiedSection === soapTab ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                </div>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl p-4 border border-slate-100 min-h-[100px]">
                  {soapContent[soapTab]}
                </div>
              </div>
            </div>

            {/* AI Suggested ICD Codes */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-slate-50 to-white">
                <h3 className="font-bold text-slate-900 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-purple-600" /> AI Suggested ICD Codes</h3>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">{icdCodes.filter((c) => c.accepted).length} accepted</span>
              </div>
              <div className="p-4 space-y-2 max-h-[260px] overflow-y-auto">
                {icdCodes.map((icd) => (
                  <div key={icd.code} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all", icd.accepted ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white hover:bg-slate-50")}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{icd.code}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", icd.confidence >= 90 ? "bg-emerald-100 text-emerald-700" : icd.confidence >= 75 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700")}>{icd.confidence}%</span>
                      </div>
                      <p className="text-sm text-slate-700 mt-0.5 truncate">{icd.description}</p>
                    </div>
                    <button onClick={() => toggleIcd(icd.code)} className={cn("p-2 rounded-lg transition-all flex-shrink-0", icd.accepted ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : "bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-500")}>
                      {icd.accepted ? <BadgeCheck className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Clinical Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b bg-gradient-to-r from-slate-50 to-white">
                <h3 className="font-bold text-slate-900 flex items-center gap-2"><Activity className="w-4 h-4 text-teal-600" /> AI Clinical Summary</h3>
                <button onClick={() => handleCopy("summary")} className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1">
                  {copiedSection === "summary" ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <div className="p-5">
                <p className="text-sm text-slate-700 leading-relaxed">{AI_SUMMARY}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== BOTTOM CONTROLS ===================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: Actions */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all">
                <Zap className="w-4 h-4" /> Copy to EMR
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 border border-blue-200 text-blue-700 bg-blue-50 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-all">
                <Save className="w-4 h-4" /> Save Recording
              </button>
              <button onClick={handleDiscard} className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-600 bg-red-50 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all">
                <Trash2 className="w-4 h-4" /> Discard
              </button>
            </div>

            {/* Right: Settings */}
            <div className="flex items-center gap-4">
              {/* Language */}
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-slate-400" />
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label} ({l.native})</option>)}
                </select>
              </div>

              {/* Auto-detect */}
              <div className="flex items-center gap-2">
                <button onClick={() => setAutoDetect(!autoDetect)} className={cn("relative w-10 h-5 rounded-full transition-colors duration-300", autoDetect ? "bg-emerald-500" : "bg-slate-300")}>
                  <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300", autoDetect ? "translate-x-5" : "translate-x-0.5")} />
                </button>
                <span className="text-xs text-slate-500 font-medium">Auto-detect language</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
