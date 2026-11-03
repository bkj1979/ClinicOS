"use client";

import React, { useState } from "react";
import {
  Shield, ShieldCheck, ShieldAlert, Link2, CheckCircle2, XCircle, Clock,
  AlertTriangle, ChevronDown, ChevronRight, RefreshCw, ExternalLink,
  FileText, Activity, Check, X, Search, Eye, Unlink, Upload,
  Clipboard, ArrowUpRight, Lock, Server, HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { patients } from "@/lib/mock-data";
import AppLayout from "@/components/layout/app-layout";

// =======================
// ABDM Mock Data
// =======================

const abhaLinkingData = [
  { patientName: "Arun Kumar Verma", uhid: "COS100001", abhaNumber: "91-1234-5678-9012", abhaAddress: "arun.verma@abdm", status: "linked" as const, lastSynced: "2026-10-31 09:15 AM" },
  { patientName: "Sneha Gupta", uhid: "COS100002", abhaNumber: "91-2345-6789-0123", abhaAddress: "sneha.g@abdm", status: "linked" as const, lastSynced: "2026-10-30 02:40 PM" },
  { patientName: "Ravi Shankar Iyer", uhid: "COS100003", abhaNumber: "—", abhaAddress: "—", status: "not-linked" as const, lastSynced: "—" },
  { patientName: "Fatima Begum", uhid: "COS100004", abhaNumber: "91-3456-7890-1234", abhaAddress: "fatima.b@abdm", status: "linked" as const, lastSynced: "2026-10-29 11:20 AM" },
  { patientName: "Deepak Hegde", uhid: "COS100005", abhaNumber: "—", abhaAddress: "—", status: "not-linked" as const, lastSynced: "—" },
  { patientName: "Anjali Menon", uhid: "COS100006", abhaNumber: "—", abhaAddress: "—", status: "not-linked" as const, lastSynced: "—" },
  { patientName: "Sunil Deshmukh", uhid: "COS100007", abhaNumber: "—", abhaAddress: "—", status: "not-linked" as const, lastSynced: "—" },
  { patientName: "Priya Ramachandran", uhid: "COS100008", abhaNumber: "—", abhaAddress: "—", status: "not-linked" as const, lastSynced: "—" },
  { patientName: "Karthik Narayanan", uhid: "COS100009", abhaNumber: "—", abhaAddress: "—", status: "not-linked" as const, lastSynced: "—" },
  { patientName: "Lakshmi Venkatesh", uhid: "COS100010", abhaNumber: "—", abhaAddress: "—", status: "not-linked" as const, lastSynced: "—" },
  { patientName: "Vikram Singh", uhid: "COS100011", abhaNumber: "—", abhaAddress: "—", status: "not-linked" as const, lastSynced: "—" },
  { patientName: "Nandini Kulkarni", uhid: "COS100012", abhaNumber: "91-4567-8901-2345", abhaAddress: "nandini.k@abdm", status: "linked" as const, lastSynced: "2026-10-31 10:05 AM" },
];

const abdmServices = [
  { name: "Health Information Provider (HIP)", status: "Active", icon: Server, desc: "Shares patient records on consent" },
  { name: "Health Information User (HIU)", status: "Active", icon: Eye, desc: "Fetches records from other facilities" },
  { name: "Health Locker", status: "Configured", icon: HardDrive, desc: "Patient-controlled storage" },
  { name: "Consent Manager", status: "Active", icon: Lock, desc: "Manages consent artefacts" },
];

const consentRequests = [
  { id: "CON-001", patient: "Arun Kumar Verma", purpose: "Continuity of Care", hiTypes: "OPD Records, Lab Reports", requester: "Apollo Hospital, Bangalore", status: "granted" as const, requestedOn: "2026-10-25", validTill: "2027-04-25" },
  { id: "CON-002", patient: "Sneha Gupta", purpose: "Health Insurance Claim", hiTypes: "Discharge Summary", requester: "Star Health Insurance", status: "requested" as const, requestedOn: "2026-10-30", validTill: "—" },
  { id: "CON-003", patient: "Fatima Begum", purpose: "Second Opinion", hiTypes: "Prescription, Diagnosis", requester: "Manipal Hospital", status: "granted" as const, requestedOn: "2026-10-18", validTill: "2027-01-18" },
  { id: "CON-004", patient: "Nandini Kulkarni", purpose: "Continuity of Care", hiTypes: "OPD Records", requester: "Fortis Hospital", status: "denied" as const, requestedOn: "2026-10-20", validTill: "—" },
  { id: "CON-005", patient: "Arun Kumar Verma", purpose: "Health Insurance Claim", hiTypes: "Lab Reports, Prescription", requester: "ICICI Lombard", status: "expired" as const, requestedOn: "2026-06-15", validTill: "2026-09-15" },
];

const healthRecordPushLogs = [
  { id: "HR-001", patient: "Arun Kumar Verma", recordType: "OPD Consultation", date: "2026-10-31 09:20 AM", status: "success" as const },
  { id: "HR-002", patient: "Arun Kumar Verma", recordType: "Lab Report - HbA1c", date: "2026-10-31 09:22 AM", status: "success" as const },
  { id: "HR-003", patient: "Sneha Gupta", recordType: "Prescription", date: "2026-10-30 02:45 PM", status: "success" as const },
  { id: "HR-004", patient: "Fatima Begum", recordType: "OPD Consultation", date: "2026-10-29 11:25 AM", status: "success" as const },
  { id: "HR-005", patient: "Nandini Kulkarni", recordType: "OPD Consultation", date: "2026-10-31 10:10 AM", status: "failed" as const },
  { id: "HR-006", patient: "Nandini Kulkarni", recordType: "OPD Consultation", date: "2026-10-31 10:12 AM", status: "success" as const },
];

// =======================
// NABH Mock Data
// =======================

interface ChecklistItem {
  id: string;
  description: string;
  met: boolean;
  evidence?: string;
}

interface NABHChapter {
  code: string;
  name: string;
  items: ChecklistItem[];
}

const nabhChapters: NABHChapter[] = [
  {
    code: "AAC", name: "Access, Assessment and Continuity of Care",
    items: [
      { id: "AAC-1", description: "Registration process is standardized and documented", met: true, evidence: "SOP-REG-001" },
      { id: "AAC-2", description: "Emergency patients are assessed within 5 minutes of arrival", met: true, evidence: "Audit report Q3" },
      { id: "AAC-3", description: "Initial assessment is documented for every patient", met: true },
      { id: "AAC-4", description: "Referral process is well-defined and documented", met: true },
      { id: "AAC-5", description: "Discharge process includes follow-up instructions", met: true },
      { id: "AAC-6", description: "Transfer protocols are documented and followed", met: true },
      { id: "AAC-7", description: "Patient identification uses minimum 2 identifiers", met: true },
      { id: "AAC-8", description: "Continuity of care is maintained during shift changes", met: false, evidence: "Gap in night shift handover documentation" },
    ],
  },
  {
    code: "COP", name: "Care of Patients",
    items: [
      { id: "COP-1", description: "Care plan is documented for each patient", met: true },
      { id: "COP-2", description: "Informed consent obtained before procedures", met: true },
      { id: "COP-3", description: "Pain assessment is performed and documented", met: true },
      { id: "COP-4", description: "Nutritional assessment for all admitted patients", met: true },
      { id: "COP-5", description: "Restraint use policy is documented and followed", met: true },
      { id: "COP-6", description: "Blood transfusion protocol is followed", met: true },
      { id: "COP-7", description: "Surgical safety checklist is used for all surgeries", met: false, evidence: "Missing in 2 minor procedures" },
      { id: "COP-8", description: "End-of-life care protocols are established", met: true },
      { id: "COP-9", description: "Anaesthesia care is monitored and documented", met: true },
      { id: "COP-10", description: "High-risk patients are identified and monitored", met: false, evidence: "No dedicated protocol for geriatric fall risk" },
    ],
  },
  {
    code: "MOM", name: "Management of Medication",
    items: [
      { id: "MOM-1", description: "Formulary is established and reviewed periodically", met: true },
      { id: "MOM-2", description: "Look-alike sound-alike (LASA) drugs are identified", met: true },
      { id: "MOM-3", description: "High-alert medications are stored separately", met: true },
      { id: "MOM-4", description: "Adverse drug reactions are documented and reported", met: true },
      { id: "MOM-5", description: "Medication errors are tracked and analysed", met: true },
      { id: "MOM-6", description: "Medication reconciliation at transitions of care", met: false, evidence: "Not consistently done at discharge" },
    ],
  },
  {
    code: "PRE", name: "Patient Rights and Education",
    items: [
      { id: "PRE-1", description: "Patient rights are displayed and communicated", met: true },
      { id: "PRE-2", description: "Informed consent process is documented", met: true },
      { id: "PRE-3", description: "Patient grievance redressal mechanism is in place", met: true },
      { id: "PRE-4", description: "Patient and family education is documented", met: true },
      { id: "PRE-5", description: "Privacy and confidentiality are maintained", met: false, evidence: "Open discussion area needs privacy screens" },
    ],
  },
  {
    code: "HIC", name: "Hospital Infection Control",
    items: [
      { id: "HIC-1", description: "Infection control committee is functional", met: true },
      { id: "HIC-2", description: "Hand hygiene compliance is monitored", met: true },
      { id: "HIC-3", description: "Biomedical waste management follows BMWM rules", met: true },
      { id: "HIC-4", description: "Sterilization protocols are followed and documented", met: true },
      { id: "HIC-5", description: "Surveillance of healthcare-associated infections", met: true },
      { id: "HIC-6", description: "Antibiotic stewardship program is implemented", met: false, evidence: "Program drafted but not fully implemented" },
      { id: "HIC-7", description: "Staff vaccination and health monitoring program", met: false, evidence: "Hepatitis B vaccination pending for 3 staff" },
    ],
  },
  {
    code: "CQI", name: "Continuous Quality Improvement",
    items: [
      { id: "CQI-1", description: "Quality indicators are defined and monitored", met: true },
      { id: "CQI-2", description: "Incident reporting system is in place", met: true },
      { id: "CQI-3", description: "Root cause analysis for sentinel events", met: true },
      { id: "CQI-4", description: "Patient satisfaction surveys are conducted", met: false, evidence: "Last survey was 4 months ago" },
    ],
  },
  {
    code: "ROM", name: "Responsibilities of Management",
    items: [
      { id: "ROM-1", description: "Organisation structure is defined and documented", met: true },
      { id: "ROM-2", description: "Budget for quality improvement is allocated", met: true },
      { id: "ROM-3", description: "Ethical management practices are established", met: true },
    ],
  },
  {
    code: "FMS", name: "Facility Management and Safety",
    items: [
      { id: "FMS-1", description: "Fire safety plan is documented and drills conducted", met: true },
      { id: "FMS-2", description: "Medical equipment maintenance schedule followed", met: true },
      { id: "FMS-3", description: "Disaster management plan is in place", met: true },
      { id: "FMS-4", description: "Hazardous materials are managed safely", met: true },
      { id: "FMS-5", description: "Facility inspections conducted regularly", met: false, evidence: "Q3 inspection report pending submission" },
    ],
  },
  {
    code: "HRM", name: "Human Resource Management",
    items: [
      { id: "HRM-1", description: "Credential verification for all clinical staff", met: true },
      { id: "HRM-2", description: "Staff training and development program exists", met: true },
      { id: "HRM-3", description: "Performance appraisal system is documented", met: true },
      { id: "HRM-4", description: "Staffing plan based on patient acuity and volume", met: false, evidence: "Staffing ratio not reviewed for 6 months" },
    ],
  },
  {
    code: "IMS", name: "Information Management System",
    items: [
      { id: "IMS-1", description: "Medical records are complete, accurate and timely", met: true },
      { id: "IMS-2", description: "Data security and privacy measures implemented", met: true },
      { id: "IMS-3", description: "Electronic health records system is operational", met: true },
      { id: "IMS-4", description: "Clinical data is used for quality improvement", met: true },
      { id: "IMS-5", description: "Disaster recovery plan for IT systems", met: true },
      { id: "IMS-6", description: "Integration with national health systems (ABDM)", met: false, evidence: "Partial integration — 33% ABHA linking" },
    ],
  },
];

const auditTrail = [
  { id: "AUD-001", action: "NABH checklist updated", user: "Admin User", module: "Compliance", timestamp: "2026-10-31 10:30 AM", details: "Updated COP-7 status to non-compliant" },
  { id: "AUD-002", action: "ABHA linked", user: "Meera Joshi", module: "ABDM", timestamp: "2026-10-31 09:15 AM", details: "Linked ABHA for patient COS100001" },
  { id: "AUD-003", action: "Consent granted", user: "System", module: "ABDM", timestamp: "2026-10-30 03:00 PM", details: "CON-001 consent artefact generated" },
  { id: "AUD-004", action: "Health record pushed", user: "System", module: "ABDM", timestamp: "2026-10-30 02:45 PM", details: "Prescription pushed for COS100002" },
  { id: "AUD-005", action: "Fire drill conducted", user: "Admin User", module: "NABH - FMS", timestamp: "2026-10-28 03:00 PM", details: "Quarterly fire drill completed" },
  { id: "AUD-006", action: "Infection audit", user: "Lakshmi Devi", module: "NABH - HIC", timestamp: "2026-10-27 11:00 AM", details: "Hand hygiene audit score: 89%" },
  { id: "AUD-007", action: "Staff credentialing", user: "Admin User", module: "NABH - HRM", timestamp: "2026-10-25 02:30 PM", details: "Verified credentials for Dr. Kavitha Nair" },
];

const nonComplianceAlerts = [
  { id: "NCA-1", chapter: "COP", item: "COP-7", description: "Surgical safety checklist missed in 2 minor procedures this month", severity: "high" as const, raisedOn: "2026-10-28", dueBy: "2026-11-07" },
  { id: "NCA-2", chapter: "HIC", item: "HIC-7", description: "Hepatitis B vaccination pending for 3 staff members", severity: "medium" as const, raisedOn: "2026-10-25", dueBy: "2026-11-15" },
  { id: "NCA-3", chapter: "CQI", item: "CQI-4", description: "Patient satisfaction survey overdue by 1 month", severity: "medium" as const, raisedOn: "2026-10-20", dueBy: "2026-11-05" },
  { id: "NCA-4", chapter: "IMS", item: "IMS-6", description: "ABDM integration at 33% — target is 80% ABHA linking", severity: "high" as const, raisedOn: "2026-10-15", dueBy: "2026-12-31" },
  { id: "NCA-5", chapter: "MOM", item: "MOM-6", description: "Medication reconciliation gaps at discharge", severity: "medium" as const, raisedOn: "2026-10-22", dueBy: "2026-11-10" },
];

// =======================
// Helper components
// =======================

function ProgressCircle({ value, size = 120, strokeWidth = 10 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-800">{value}%</span>
        <span className="text-[10px] text-slate-500">Score</span>
      </div>
    </div>
  );
}

function ConsentStatusBadge({ status }: { status: "granted" | "requested" | "denied" | "expired" }) {
  const map = {
    granted: { bg: "bg-emerald-50 text-emerald-700", icon: <CheckCircle2 size={13} /> },
    requested: { bg: "bg-blue-50 text-blue-700", icon: <Clock size={13} /> },
    denied: { bg: "bg-red-50 text-red-700", icon: <XCircle size={13} /> },
    expired: { bg: "bg-slate-100 text-slate-500", icon: <Clock size={13} /> },
  };
  const s = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize", s.bg)}>
      {s.icon} {status}
    </span>
  );
}

// =======================
// Main Page
// =======================

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState<"abdm" | "nabh">("abdm");
  const [expandedChapters, setExpandedChapters] = useState<string[]>(["AAC"]);
  const [abhaSearch, setAbhaSearch] = useState("");

  const totalItems = nabhChapters.reduce((s, ch) => s + ch.items.length, 0);
  const metItems = nabhChapters.reduce((s, ch) => s + ch.items.filter((i) => i.met).length, 0);
  const overallScore = Math.round((metItems / totalItems) * 100);

  const linkedCount = abhaLinkingData.filter((p) => p.status === "linked").length;
  const linkRate = Math.round((linkedCount / abhaLinkingData.length) * 100);

  const toggleChapter = (code: string) => {
    setExpandedChapters((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);
  };

  const filteredAbha = abhaLinkingData.filter(
    (p) => p.patientName.toLowerCase().includes(abhaSearch.toLowerCase()) || p.uhid.toLowerCase().includes(abhaSearch.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Shield className="text-emerald-600" size={26} />
              ABDM & NABH Compliance
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Regulatory compliance dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
              <ShieldCheck size={18} className="text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Overall Compliance: {overallScore}%</span>
            </div>
          </div>
        </div>

      <div>
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-6">
          {(["abdm", "nabh"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-semibold transition",
                activeTab === tab ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ====== ABDM TAB ====== */}
        {activeTab === "abdm" && (
          <div className="space-y-6">
            {/* ABHA Integration Status + Services */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* ABHA Integration card */}
              <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 flex flex-col items-center justify-center text-center">
                <ProgressCircle value={linkRate} size={100} strokeWidth={8} />
                <h3 className="text-sm font-semibold text-slate-700 mt-3">ABHA Integration</h3>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="font-bold text-emerald-600">{linkedCount}</span> / {abhaLinkingData.length} patients linked
                </p>
              </div>

              {/* ABDM Services */}
              {abdmServices.map((svc) => {
                const Icon = svc.icon;
                const isActive = svc.status === "Active";
                return (
                  <div key={svc.name} className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn("p-2 rounded-lg", isActive ? "bg-emerald-50" : "bg-blue-50")}>
                        <Icon size={18} className={isActive ? "text-emerald-600" : "text-blue-600"} />
                      </div>
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        isActive ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                      )}>
                        {svc.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">{svc.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{svc.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Patient ABHA linking table */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Link2 size={16} className="text-emerald-600" /> Patient ABHA Linking
                </h3>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or UHID…"
                    value={abhaSearch}
                    onChange={(e) => setAbhaSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Patient Name</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">UHID</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">ABHA Number</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">ABHA Address</th>
                      <th className="text-center py-2.5 px-3 text-slate-500 font-medium">Status</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Last Synced</th>
                      <th className="text-center py-2.5 px-3 text-slate-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAbha.map((p, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-medium text-slate-800">{p.patientName}</td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-xs">{p.uhid}</td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-xs">{p.abhaNumber}</td>
                        <td className="py-3 px-3 text-slate-600 text-xs">{p.abhaAddress}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            p.status === "linked" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          )}>
                            {p.status === "linked" ? <CheckCircle2 size={12} /> : <Unlink size={12} />}
                            {p.status === "linked" ? "Linked" : "Not Linked"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-xs">{p.lastSynced}</td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {p.status === "linked" ? (
                              <>
                                <button className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition">Verify</button>
                                <button className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 transition flex items-center gap-1">
                                  <RefreshCw size={11} /> Sync
                                </button>
                              </>
                            ) : (
                              <button className="px-2.5 py-1 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition flex items-center gap-1">
                                <Link2 size={11} /> Link ABHA
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Consent Management */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Clipboard size={16} className="text-indigo-600" /> Consent Management
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">ID</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Patient</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Purpose</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">HI Types</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Requester</th>
                      <th className="text-center py-2.5 px-3 text-slate-500 font-medium">Status</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Requested On</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Valid Till</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consentRequests.map((c) => (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="py-3 px-3 text-slate-600 font-mono text-xs">{c.id}</td>
                        <td className="py-3 px-3 font-medium text-slate-800">{c.patient}</td>
                        <td className="py-3 px-3 text-slate-600">{c.purpose}</td>
                        <td className="py-3 px-3 text-slate-500 text-xs">{c.hiTypes}</td>
                        <td className="py-3 px-3 text-slate-600 text-xs">{c.requester}</td>
                        <td className="py-3 px-3 text-center"><ConsentStatusBadge status={c.status} /></td>
                        <td className="py-3 px-3 text-slate-500 text-xs">{c.requestedOn}</td>
                        <td className="py-3 px-3 text-slate-500 text-xs">{c.validTill}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Health Record Push Logs */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Upload size={16} className="text-teal-600" /> Health Record Push Logs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">ID</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Patient</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Record Type</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Date & Time</th>
                      <th className="text-center py-2.5 px-3 text-slate-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {healthRecordPushLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="py-3 px-3 text-slate-600 font-mono text-xs">{log.id}</td>
                        <td className="py-3 px-3 font-medium text-slate-800">{log.patient}</td>
                        <td className="py-3 px-3 text-slate-600">{log.recordType}</td>
                        <td className="py-3 px-3 text-slate-500 text-xs">{log.date}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            log.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          )}>
                            {log.status === "success" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {log.status === "success" ? "Success" : "Failed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ====== NABH TAB ====== */}
        {activeTab === "nabh" && (
          <div className="space-y-6">
            {/* Top row: Score + Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Circular score */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center">
                <ProgressCircle value={overallScore} size={140} strokeWidth={12} />
                <h3 className="text-sm font-semibold text-slate-700 mt-3">NABH Readiness Score</h3>
                <p className="text-xs text-slate-500 mt-1">{metItems} of {totalItems} standards met</p>
              </div>

              {/* Chapter summary cards */}
              <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {nabhChapters.map((ch) => {
                  const met = ch.items.filter((i) => i.met).length;
                  const total = ch.items.length;
                  const pct = Math.round((met / total) * 100);
                  return (
                    <button
                      key={ch.code}
                      onClick={() => toggleChapter(ch.code)}
                      className={cn(
                        "bg-white rounded-xl border p-3 text-left hover:shadow-md transition",
                        expandedChapters.includes(ch.code) ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-500">{ch.code}</span>
                        <span className={cn(
                          "text-xs font-bold px-1.5 py-0.5 rounded",
                          pct === 100 ? "bg-emerald-50 text-emerald-700" : pct >= 70 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                        )}>
                          {pct}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight line-clamp-2">{ch.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{met}/{total} met</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expandable chapters */}
            <div className="space-y-3">
              {nabhChapters.map((ch) => {
                const isOpen = expandedChapters.includes(ch.code);
                const met = ch.items.filter((i) => i.met).length;
                const total = ch.items.length;
                return (
                  <div key={ch.code} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => toggleChapter(ch.code)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        {isOpen ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{ch.code}</span>
                        <span className="text-sm font-semibold text-slate-700">{ch.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{met}/{total} met</span>
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              met === total ? "bg-emerald-500" : "bg-amber-500"
                            )}
                            style={{ width: `${(met / total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-200 px-5 py-3 space-y-2">
                        {ch.items.map((item) => (
                          <div key={item.id} className={cn(
                            "flex items-start gap-3 py-2 px-3 rounded-lg",
                            item.met ? "bg-white" : "bg-red-50/50"
                          )}>
                            <div className={cn(
                              "mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
                              item.met ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"
                            )}>
                              {item.met ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-slate-400">{item.id}</span>
                                <span className={cn(
                                  "text-xs font-semibold px-1.5 py-0.5 rounded",
                                  item.met ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                )}>
                                  {item.met ? "Compliant" : "Non-Compliant"}
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 mt-0.5">{item.description}</p>
                              {item.evidence && !item.met && (
                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                  <AlertTriangle size={11} /> {item.evidence}
                                </p>
                              )}
                              {item.evidence && item.met && (
                                <p className="text-xs text-slate-400 mt-1">Evidence: {item.evidence}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Non-compliance Alerts */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <ShieldAlert size={16} className="text-red-500" /> Non-Compliance Alerts
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Chapter</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Item</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Description</th>
                      <th className="text-center py-2.5 px-3 text-slate-500 font-medium">Severity</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Raised On</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Due By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonComplianceAlerts.map((alert) => (
                      <tr key={alert.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono text-xs text-slate-600">{alert.chapter}</td>
                        <td className="py-3 px-3 font-mono text-xs text-slate-600">{alert.item}</td>
                        <td className="py-3 px-3 text-slate-700">{alert.description}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                            alert.severity === "high" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                          )}>
                            {alert.severity === "high" ? <AlertTriangle size={12} /> : <AlertTriangle size={12} />}
                            {alert.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-xs">{alert.raisedOn}</td>
                        <td className="py-3 px-3 text-slate-500 text-xs">{alert.dueBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Trail */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <FileText size={16} className="text-slate-600" /> Audit Trail
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Timestamp</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Action</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">User</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Module</th>
                      <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditTrail.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="py-3 px-3 text-slate-500 text-xs whitespace-nowrap">{log.timestamp}</td>
                        <td className="py-3 px-3 font-medium text-slate-800">{log.action}</td>
                        <td className="py-3 px-3 text-slate-600">{log.user}</td>
                        <td className="py-3 px-3">
                          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{log.module}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-xs">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </AppLayout>
  );
}
