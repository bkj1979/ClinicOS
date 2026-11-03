"use client";

import { useState, useMemo } from "react";
import {
  Search, UserPlus, Users, CalendarDays, UserCheck, Shield,
  Phone, Mail, MapPin, Heart, AlertTriangle, ChevronRight,
  X, Check, Activity, Pill, FlaskConical, Clock, Eye,
  Droplets, FileText, Edit, MoreHorizontal, Filter
} from "lucide-react";
import { patients, encounters, appointments } from "@/lib/mock-data";
import { Patient } from "@/lib/types";
import { cn, formatDate, getInitials, formatCurrency } from "@/lib/utils";
import AppLayout from "@/components/layout/app-layout";

// ---- Additional Mock Data for Patient Detail ----
const visitHistory: Record<string, Array<{ date: string; doctor: string; department: string; complaint: string; diagnoses: string[] }>> = {
  p1: [
    { date: "2026-10-28", doctor: "Dr. Priya Sharma", department: "General Medicine", complaint: "Follow-up for diabetes management", diagnoses: ["Type 2 DM - hyperglycemia", "Fatigue"] },
    { date: "2026-09-20", doctor: "Dr. Priya Sharma", department: "General Medicine", complaint: "Routine diabetes check-up", diagnoses: ["Type 2 DM"] },
    { date: "2026-08-10", doctor: "Dr. Priya Sharma", department: "General Medicine", complaint: "Annual health check-up", diagnoses: ["Type 2 DM", "Hypertension"] },
    { date: "2026-06-15", doctor: "Dr. Rajesh Patel", department: "Cardiology", complaint: "Palpitations", diagnoses: ["Hypertension"] },
  ],
  p3: [
    { date: "2026-10-29", doctor: "Dr. Rajesh Patel", department: "Cardiology", complaint: "Chest pain on exertion", diagnoses: ["Angina Pectoris", "Hypertension"] },
    { date: "2026-09-15", doctor: "Dr. Rajesh Patel", department: "Cardiology", complaint: "BP monitoring", diagnoses: ["Hypertension", "CKD Stage 3"] },
    { date: "2026-08-01", doctor: "Dr. Priya Sharma", department: "General Medicine", complaint: "Medication review", diagnoses: ["CKD Stage 3"] },
  ],
  p10: [
    { date: "2026-10-31", doctor: "Dr. Rajesh Patel", department: "Cardiology", complaint: "AF - routine check", diagnoses: ["Atrial Fibrillation", "Hypertension"] },
    { date: "2026-10-15", doctor: "Dr. Priya Sharma", department: "General Medicine", complaint: "Diabetes follow-up", diagnoses: ["Type 2 DM"] },
    { date: "2026-09-28", doctor: "Dr. Rajesh Patel", department: "Cardiology", complaint: "INR monitoring", diagnoses: ["Atrial Fibrillation"] },
    { date: "2026-09-10", doctor: "Dr. Priya Sharma", department: "General Medicine", complaint: "General check-up", diagnoses: ["Type 2 DM", "Hypertension"] },
    { date: "2026-08-20", doctor: "Dr. Rajesh Patel", department: "Cardiology", complaint: "Echo follow-up", diagnoses: ["Atrial Fibrillation"] },
  ],
};

const recentVitals: Record<string, Array<{ date: string; bp: string; hr: number; sugar?: number; spo2: number; weight: number }>> = {
  p1: [
    { date: "2026-10-28", bp: "138/88", hr: 78, sugar: 186, spo2: 98, weight: 82 },
    { date: "2026-09-20", bp: "134/86", hr: 74, sugar: 162, spo2: 99, weight: 83 },
    { date: "2026-08-10", bp: "130/84", hr: 76, sugar: 148, spo2: 98, weight: 84 },
    { date: "2026-06-15", bp: "142/92", hr: 82, sugar: 172, spo2: 97, weight: 85 },
  ],
  p3: [
    { date: "2026-10-29", bp: "152/94", hr: 88, spo2: 97, weight: 78 },
    { date: "2026-09-15", bp: "148/90", hr: 84, spo2: 98, weight: 78 },
    { date: "2026-08-01", bp: "144/88", hr: 80, spo2: 98, weight: 79 },
  ],
  p10: [
    { date: "2026-10-31", bp: "146/88", hr: 92, sugar: 142, spo2: 96, weight: 65 },
    { date: "2026-10-15", bp: "140/84", hr: 88, sugar: 138, spo2: 97, weight: 65 },
    { date: "2026-09-28", bp: "138/82", hr: 90, sugar: 136, spo2: 96, weight: 66 },
    { date: "2026-09-10", bp: "142/86", hr: 86, sugar: 144, spo2: 97, weight: 66 },
  ],
};

const recentPrescriptions: Record<string, Array<{ date: string; doctor: string; drugs: string[] }>> = {
  p1: [
    { date: "2026-10-28", doctor: "Dr. Priya Sharma", drugs: ["Metformin 1000mg BD", "Glimepiride 1mg OD", "Amlodipine 5mg OD"] },
    { date: "2026-09-20", doctor: "Dr. Priya Sharma", drugs: ["Metformin 500mg BD", "Amlodipine 5mg OD"] },
  ],
  p3: [
    { date: "2026-10-29", doctor: "Dr. Rajesh Patel", drugs: ["Atorvastatin 20mg HS", "Telmisartan 40mg OD", "Aspirin 75mg OD", "Nitroglycerin 0.5mg SL PRN"] },
  ],
  p10: [
    { date: "2026-10-31", doctor: "Dr. Rajesh Patel", drugs: ["Warfarin 5mg OD", "Metoprolol 50mg BD", "Metformin 500mg BD"] },
    { date: "2026-10-15", doctor: "Dr. Priya Sharma", drugs: ["Metformin 500mg BD", "Glimepiride 1mg OD"] },
  ],
};

const labResults: Record<string, Array<{ test: string; result: string; range: string; date: string; status: "normal" | "warning" | "critical" }>> = {
  p1: [
    { test: "HbA1c", result: "7.8%", range: "4.0 - 5.6%", date: "2026-10-28", status: "critical" },
    { test: "FBS", result: "186 mg/dL", range: "70 - 100 mg/dL", date: "2026-10-28", status: "critical" },
    { test: "Serum Creatinine", result: "0.9 mg/dL", range: "0.7 - 1.3 mg/dL", date: "2026-09-20", status: "normal" },
    { test: "Total Cholesterol", result: "218 mg/dL", range: "<200 mg/dL", date: "2026-08-10", status: "warning" },
  ],
  p3: [
    { test: "Troponin I", result: "0.02 ng/mL", range: "<0.04 ng/mL", date: "2026-10-29", status: "normal" },
    { test: "Serum Creatinine", result: "2.1 mg/dL", range: "0.7 - 1.3 mg/dL", date: "2026-10-29", status: "critical" },
    { test: "eGFR", result: "42 mL/min", range: ">60 mL/min", date: "2026-10-29", status: "warning" },
  ],
  p10: [
    { test: "INR", result: "2.4", range: "2.0 - 3.0", date: "2026-10-31", status: "normal" },
    { test: "HbA1c", result: "6.9%", range: "4.0 - 5.6%", date: "2026-10-15", status: "warning" },
    { test: "FBS", result: "142 mg/dL", range: "70 - 100 mg/dL", date: "2026-10-31", status: "warning" },
    { test: "TSH", result: "3.2 mIU/L", range: "0.4 - 4.0 mIU/L", date: "2026-09-10", status: "normal" },
  ],
};

// ===================================================================
// Patient Registry Page
// ===================================================================
export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [detailTab, setDetailTab] = useState<"demographics" | "visits" | "allergies" | "vitals" | "prescriptions" | "labs">("demographics");

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.uhid.toLowerCase().includes(q) ||
        (p.abhaId && p.abhaId.includes(q))
    );
  }, [searchQuery]);

  const stats = useMemo(() => {
    const activeThisMonth = 8;
    const newThisMonth = 2;
    const abhaLinked = patients.filter((p) => p.abhaId).length;
    return { total: patients.length, activeThisMonth, newThisMonth, abhaLinked };
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Patient Registry</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {patients.length} patients registered · EMR & Health Records
            </p>
          </div>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Register New Patient
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Patients", value: stats.total, icon: Users, color: "bg-blue-50 text-blue-600", border: "border-blue-200" },
            { label: "Active This Month", value: stats.activeThisMonth, icon: CalendarDays, color: "bg-emerald-50 text-emerald-600", border: "border-emerald-200" },
            { label: "New This Month", value: stats.newThisMonth, icon: UserCheck, color: "bg-violet-50 text-violet-600", border: "border-violet-200" },
            { label: "ABHA Linked", value: stats.abhaLinked, icon: Shield, color: "bg-amber-50 text-amber-600", border: "border-amber-200" },
          ].map((s) => (
            <div key={s.label} className={cn("bg-white rounded-xl border p-4 flex items-center gap-4", s.border)}>
              <div className={cn("h-11 w-11 rounded-lg flex items-center justify-center", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Name, Phone, UHID, or ABHA ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-400"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Data Table + Detail Panel */}
        <div className="flex gap-6">
          {/* Patient Table */}
          <div className={cn("bg-white rounded-xl border border-slate-200 overflow-hidden transition-all", selectedPatient ? "flex-1 min-w-0" : "w-full")}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">UHID</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Patient Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Age/Gender</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Phone</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Blood Group</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Last Visit</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Visits</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Chronic Conditions</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">ABHA</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => {
                    const isSelected = selectedPatient?.id === patient.id;
                    const avatarColors = ["bg-emerald-100 text-emerald-700", "bg-blue-100 text-blue-700", "bg-violet-100 text-violet-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-teal-100 text-teal-700"];
                    const colorIdx = parseInt(patient.id.replace("p", "")) % avatarColors.length;
                    return (
                      <tr
                        key={patient.id}
                        onClick={() => { setSelectedPatient(isSelected ? null : patient); setDetailTab("demographics"); }}
                        className={cn(
                          "border-b border-slate-100 cursor-pointer transition-colors",
                          isSelected ? "bg-emerald-50" : "hover:bg-slate-50"
                        )}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{patient.uhid}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0", avatarColors[colorIdx])}>
                              {getInitials(patient.name)}
                            </div>
                            <span className="font-medium text-slate-900 whitespace-nowrap">{patient.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{patient.age}y / {patient.gender.charAt(0)}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{patient.phone}</td>
                        <td className="px-4 py-3">
                          {patient.bloodGroup ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs font-semibold">
                              <Droplets className="h-3 w-3" />
                              {patient.bloodGroup}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{patient.lastVisit ? formatDate(patient.lastVisit) : "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-slate-700">{patient.totalVisits}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {patient.chronicConditions.length > 0
                              ? patient.chronicConditions.map((c, i) => (
                                  <span key={i} className="inline-block px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-medium whitespace-nowrap">
                                    {c.length > 20 ? c.slice(0, 18) + "…" : c}
                                  </span>
                                ))
                              : <span className="text-slate-400 text-xs">None</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {patient.abhaId ? (
                            <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-slate-300 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedPatient(patient); setDetailTab("demographics"); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                        <Search className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-medium">No patients found</p>
                        <p className="text-xs mt-1">Try a different search term</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Patient Detail Panel */}
          {selectedPatient && (
            <div className="w-[480px] flex-shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-280px)]">
              {/* Detail Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-white relative">
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                    {getInitials(selectedPatient.name)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{selectedPatient.name}</h3>
                    <p className="text-emerald-100 text-sm">{selectedPatient.uhid} · {selectedPatient.age}y {selectedPatient.gender}</p>
                  </div>
                </div>
                {selectedPatient.allergies.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                    <span className="text-xs text-amber-200 font-medium">Allergies: {selectedPatient.allergies.join(", ")}</span>
                  </div>
                )}
              </div>

              {/* Detail Tabs */}
              <div className="border-b border-slate-200 px-2 flex gap-0.5 overflow-x-auto">
                {([
                  { key: "demographics", label: "Profile", icon: Users },
                  { key: "visits", label: "Visits", icon: Clock },
                  { key: "allergies", label: "Conditions", icon: Heart },
                  { key: "vitals", label: "Vitals", icon: Activity },
                  { key: "prescriptions", label: "Rx", icon: Pill },
                  { key: "labs", label: "Labs", icon: FlaskConical },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setDetailTab(tab.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors",
                      detailTab === tab.key
                        ? "border-emerald-600 text-emerald-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {detailTab === "demographics" && (
                  <DemographicsTab patient={selectedPatient} />
                )}
                {detailTab === "visits" && (
                  <VisitsTab patientId={selectedPatient.id} />
                )}
                {detailTab === "allergies" && (
                  <AllergiesConditionsTab patient={selectedPatient} />
                )}
                {detailTab === "vitals" && (
                  <VitalsTab patientId={selectedPatient.id} />
                )}
                {detailTab === "prescriptions" && (
                  <PrescriptionsTab patientId={selectedPatient.id} />
                )}
                {detailTab === "labs" && (
                  <LabsTab patientId={selectedPatient.id} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Register New Patient Modal */}
      {showRegisterModal && (
        <RegisterPatientModal onClose={() => setShowRegisterModal(false)} />
      )}
      </div>
    </AppLayout>
  );
}

// ===================================================================
// Detail Tab Components
// ===================================================================

function DemographicsTab({ patient }: { patient: Patient }) {
  const fields = [
    { label: "Full Name", value: patient.name },
    { label: "UHID", value: patient.uhid },
    { label: "Date of Birth", value: formatDate(patient.dob) },
    { label: "Age / Gender", value: `${patient.age} years / ${patient.gender}` },
    { label: "Blood Group", value: patient.bloodGroup || "Not recorded" },
    { label: "Phone", value: patient.phone },
    { label: "Email", value: patient.email || "Not provided" },
    { label: "Address", value: patient.address ? `${patient.address.line1}, ${patient.address.city} - ${patient.address.pincode}` : "Not provided" },
    { label: "ABHA ID", value: patient.abhaId || "Not linked" },
    { label: "Registered On", value: formatDate(patient.registeredAt) },
    { label: "Total Visits", value: String(patient.totalVisits) },
    { label: "Last Visit", value: patient.lastVisit ? formatDate(patient.lastVisit) : "—" },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-900">Patient Demographics</h4>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.label} className="space-y-0.5">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{f.label}</p>
            <p className="text-sm text-slate-800">{f.value}</p>
          </div>
        ))}
      </div>
      {patient.emergencyContact && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
          <h5 className="text-xs font-semibold text-red-700 mb-1">Emergency Contact</h5>
          <p className="text-sm text-red-800">{patient.emergencyContact.name} ({patient.emergencyContact.relation}) · {patient.emergencyContact.phone}</p>
        </div>
      )}
      {patient.insuranceInfo && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <h5 className="text-xs font-semibold text-blue-700 mb-1">Insurance</h5>
          <p className="text-sm text-blue-800">{patient.insuranceInfo.provider} · Policy: {patient.insuranceInfo.policyNo} · Valid till: {patient.insuranceInfo.validTill}</p>
        </div>
      )}
    </div>
  );
}

function VisitsTab({ patientId }: { patientId: string }) {
  const visits = visitHistory[patientId] || [];
  if (visits.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Clock className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">No visit history available</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-900">Visit History</h4>
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200" />
        <div className="space-y-4">
          {visits.map((v, i) => (
            <div key={i} className="relative pl-8">
              <div className={cn("absolute left-1.5 top-1 h-3 w-3 rounded-full border-2 border-white", i === 0 ? "bg-emerald-500" : "bg-slate-300")} />
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700">{formatDate(v.date)}</span>
                  <span className="text-xs text-slate-500">{v.department}</span>
                </div>
                <p className="text-sm text-slate-800 font-medium">{v.complaint}</p>
                <p className="text-xs text-slate-500 mt-0.5">{v.doctor}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {v.diagnoses.map((d, j) => (
                    <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AllergiesConditionsTab({ patient }: { patient: Patient }) {
  return (
    <div className="space-y-5">
      {/* Allergies */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Known Allergies</h4>
        {patient.allergies.length > 0 ? (
          <div className="space-y-2">
            {patient.allergies.map((a, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span className="text-sm font-medium text-red-800">{a}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No known allergies (NKDA)</p>
        )}
      </div>

      {/* Chronic Conditions */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Chronic Conditions</h4>
        {patient.chronicConditions.length > 0 ? (
          <div className="space-y-2">
            {patient.chronicConditions.map((c, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 bg-orange-50 border border-orange-100 rounded-lg">
                <Heart className="h-4 w-4 text-orange-500 flex-shrink-0" />
                <span className="text-sm font-medium text-orange-800">{c}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No chronic conditions on record</p>
        )}
      </div>
    </div>
  );
}

function VitalsTab({ patientId }: { patientId: string }) {
  const vitals = recentVitals[patientId] || [];
  if (vitals.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Activity className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">No vitals recorded</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-900">Recent Vitals Trend</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500">
              <th className="text-left py-2 pr-3 font-medium">Date</th>
              <th className="text-left py-2 pr-3 font-medium">BP</th>
              <th className="text-left py-2 pr-3 font-medium">HR</th>
              {vitals.some((v) => v.sugar) && <th className="text-left py-2 pr-3 font-medium">Sugar</th>}
              <th className="text-left py-2 pr-3 font-medium">SpO₂</th>
              <th className="text-left py-2 font-medium">Wt</th>
            </tr>
          </thead>
          <tbody>
            {vitals.map((v, i) => {
              const bpParts = v.bp.split("/").map(Number);
              const bpHigh = bpParts[0] >= 140 || bpParts[1] >= 90;
              const sugarHigh = v.sugar && v.sugar > 140;
              return (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-2 pr-3 text-slate-600">{formatDate(v.date)}</td>
                  <td className={cn("py-2 pr-3 font-semibold", bpHigh ? "text-red-600" : "text-slate-800")}>{v.bp}</td>
                  <td className={cn("py-2 pr-3 font-semibold", v.hr > 100 ? "text-red-600" : "text-slate-800")}>{v.hr} bpm</td>
                  {vitals.some((vv) => vv.sugar) && (
                    <td className={cn("py-2 pr-3 font-semibold", sugarHigh ? "text-amber-600" : "text-slate-800")}>
                      {v.sugar ? `${v.sugar} mg/dL` : "—"}
                    </td>
                  )}
                  <td className={cn("py-2 pr-3 font-semibold", v.spo2 < 95 ? "text-red-600" : "text-slate-800")}>{v.spo2}%</td>
                  <td className="py-2 font-semibold text-slate-800">{v.weight} kg</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PrescriptionsTab({ patientId }: { patientId: string }) {
  const rxs = recentPrescriptions[patientId] || [];
  if (rxs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Pill className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">No prescriptions on record</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-900">Recent Prescriptions</h4>
      {rxs.map((rx, i) => (
        <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">{formatDate(rx.date)}</span>
            <span className="text-xs text-slate-500">{rx.doctor}</span>
          </div>
          <ul className="space-y-1">
            {rx.drugs.map((d, j) => (
              <li key={j} className="flex items-center gap-2 text-sm text-slate-700">
                <Pill className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function LabsTab({ patientId }: { patientId: string }) {
  const labs = labResults[patientId] || [];
  if (labs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <FlaskConical className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">No lab results available</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-900">Lab Results Summary</h4>
      {labs.map((l, i) => (
        <div key={i} className={cn(
          "p-3 rounded-lg border",
          l.status === "critical" ? "bg-red-50 border-red-200" : l.status === "warning" ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
        )}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-slate-900">{l.test}</span>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              l.status === "critical" ? "bg-red-100 text-red-700" : l.status === "warning" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
            )}>
              {l.status === "critical" ? "HIGH" : l.status === "warning" ? "BORDERLINE" : "NORMAL"}
            </span>
          </div>
          <p className={cn(
            "text-lg font-bold",
            l.status === "critical" ? "text-red-700" : l.status === "warning" ? "text-amber-700" : "text-emerald-700"
          )}>
            {l.result}
          </p>
          <p className="text-xs text-slate-500">Normal: {l.range} · {formatDate(l.date)}</p>
        </div>
      ))}
    </div>
  );
}

// ===================================================================
// Register Patient Modal
// ===================================================================
function RegisterPatientModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", gender: "Male", dob: "",
    bloodGroup: "", addressLine1: "", city: "Bangalore", state: "Karnataka", pincode: "",
    emergencyName: "", emergencyPhone: "", emergencyRelation: "",
    allergies: "", abhaId: "",
    insuranceProvider: "", insurancePolicyNo: "", insuranceValidTill: "",
  });

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Register New Patient</h2>
            <p className="text-xs text-slate-500">Fill in patient details to create a new record</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Full Name *" value={form.name} onChange={(v) => update("name", v)} placeholder="Patient full name" />
              <InputField label="Phone Number *" value={form.phone} onChange={(v) => update("phone", v)} placeholder="10-digit mobile" />
              <InputField label="Email" value={form.email} onChange={(v) => update("email", v)} placeholder="email@example.com" />
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Gender *</label>
                <select
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <InputField label="Date of Birth *" value={form.dob} onChange={(v) => update("dob", v)} type="date" />
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Blood Group</label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => update("bloodGroup", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              Address
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <InputField label="Address Line 1" value={form.addressLine1} onChange={(v) => update("addressLine1", v)} placeholder="House/Flat, Street" />
              </div>
              <InputField label="City" value={form.city} onChange={(v) => update("city", v)} />
              <InputField label="State" value={form.state} onChange={(v) => update("state", v)} />
              <InputField label="Pincode" value={form.pincode} onChange={(v) => update("pincode", v)} placeholder="560034" />
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-emerald-600" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <InputField label="Name" value={form.emergencyName} onChange={(v) => update("emergencyName", v)} placeholder="Contact name" />
              <InputField label="Phone" value={form.emergencyPhone} onChange={(v) => update("emergencyPhone", v)} placeholder="Phone number" />
              <InputField label="Relation" value={form.emergencyRelation} onChange={(v) => update("emergencyRelation", v)} placeholder="e.g. Spouse" />
            </div>
          </div>

          {/* Medical Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-emerald-600" />
              Medical Information
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <InputField label="Known Allergies" value={form.allergies} onChange={(v) => update("allergies", v)} placeholder="Comma separated (e.g. Penicillin, Aspirin)" />
            </div>
          </div>

          {/* ABHA & Insurance */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              ABHA & Insurance (Optional)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="ABHA ID" value={form.abhaId} onChange={(v) => update("abhaId", v)} placeholder="91-XXXX-XXXX-XXXX" />
              <InputField label="Insurance Provider" value={form.insuranceProvider} onChange={(v) => update("insuranceProvider", v)} placeholder="e.g. Star Health" />
              <InputField label="Policy No." value={form.insurancePolicyNo} onChange={(v) => update("insurancePolicyNo", v)} placeholder="Policy number" />
              <InputField label="Valid Till" value={form.insuranceValidTill} onChange={(v) => update("insuranceValidTill", v)} type="date" />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors shadow-sm">
            Register Patient
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-slate-400"
      />
    </div>
  );
}
