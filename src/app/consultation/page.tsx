"use client";

import React, { useState } from "react";
import {
  Stethoscope, ClipboardList, Pill, FlaskConical, FileSearch,
  Save, CheckCircle2, Printer, Receipt, Mic, MicOff,
  AlertTriangle, Heart, Thermometer, Activity, Wind,
  Droplets, Weight, Ruler, Brain, ChevronRight, Plus,
  Trash2, Search, Clock, User, Shield, ArrowLeft, X,
} from "lucide-react";
import { cn, formatDate, getStatusColor, getInitials } from "@/lib/utils";
import { encounters, patients, drugs } from "@/lib/mock-data";
import AppLayout from "@/components/layout/app-layout";

const encounter = encounters[0]; // diabetes patient
const patient = patients[0];

const frequencyOptions = ["Once daily (OD)", "Twice daily (BD)", "Thrice daily (TDS)", "Four times daily (QID)", "Every 8 hours (Q8H)", "Every 12 hours (Q12H)", "At bedtime (HS)", "As needed (SOS/PRN)", "Once weekly", "Alternate days"];
const routeOptions = ["Oral", "Sublingual", "Topical", "Intravenous", "Intramuscular", "Subcutaneous", "Inhalation", "Rectal", "Ophthalmic", "Otic", "Nasal"];
const durationOptions = ["3 days", "5 days", "7 days", "10 days", "14 days", "21 days", "30 days", "60 days", "90 days", "Continue"];

const pastVisits = [
  { date: "2026-10-15", doctor: "Dr. Priya Sharma", complaint: "Routine diabetes follow-up", diagnoses: ["E11.65 - Type 2 DM"] },
  { date: "2026-09-10", doctor: "Dr. Priya Sharma", complaint: "Weakness and giddiness", diagnoses: ["E11.65 - Type 2 DM", "R42 - Dizziness"] },
  { date: "2026-08-05", doctor: "Dr. Priya Sharma", complaint: "Annual health check", diagnoses: ["E11.65 - Type 2 DM", "E66.01 - Obesity"] },
  { date: "2026-06-20", doctor: "Dr. Rajesh Patel", complaint: "Chest discomfort", diagnoses: ["R07.9 - Chest pain, unspecified"] },
];

const activeMedications = [
  { name: "Metformin 500mg", dosage: "BD with meals", since: "2024-01-15" },
  { name: "Amlodipine 5mg", dosage: "OD at bedtime", since: "2025-03-10" },
  { name: "Atorvastatin 10mg", dosage: "OD at bedtime", since: "2025-06-01" },
];

const recentLabValues = [
  { test: "HbA1c", value: "7.8%", range: "4.0-5.6%", status: "high" as const, date: "2026-10-31" },
  { test: "FBS", value: "186 mg/dL", range: "70-100", status: "high" as const, date: "2026-10-31" },
  { test: "Creatinine", value: "1.1 mg/dL", range: "0.7-1.3", status: "normal" as const, date: "2026-09-10" },
  { test: "Total Cholesterol", value: "210 mg/dL", range: "<200", status: "high" as const, date: "2026-09-10" },
  { test: "BP (Avg)", value: "138/88", range: "<120/80", status: "high" as const, date: "2026-10-31" },
];

const icdCodes = [
  { code: "E11.65", desc: "Type 2 diabetes mellitus with hyperglycemia" },
  { code: "E11.9", desc: "Type 2 diabetes mellitus without complications" },
  { code: "E11.40", desc: "Type 2 DM with diabetic neuropathy, unspecified" },
  { code: "I10", desc: "Essential (primary) hypertension" },
  { code: "E66.01", desc: "Morbid obesity due to excess calories" },
  { code: "R53.83", desc: "Other fatigue" },
  { code: "H53.8", desc: "Other visual disturbances" },
  { code: "E78.5", desc: "Dyslipidemia, unspecified" },
];

export default function ConsultationPage() {
  const [activeTab, setActiveTab] = useState<"soap" | "vitals" | "rx" | "labs" | "diagnosis">("soap");
  const [isRecording, setIsRecording] = useState(false);
  const [soap, setSoap] = useState(encounter.notes);
  const [vitals, setVitals] = useState({
    temperature: 98.2, bpSys: 138, bpDia: 88, heartRate: 78, respRate: 16,
    spo2: 98, weight: 82, height: 172, bmi: 27.7, bloodSugar: 186, painScale: 1,
  });
  const [rxItems, setRxItems] = useState(encounter.prescriptions);
  const [labOrders, setLabOrders] = useState(encounter.labOrders);
  const [diagnoses, setDiagnoses] = useState(encounter.diagnoses);
  const [icdSearch, setIcdSearch] = useState("");
  const [drugSearch, setDrugSearch] = useState("");
  const [showDrugForm, setShowDrugForm] = useState(false);
  const [newDrug, setNewDrug] = useState<{
    drugName: string;
    genericName: string;
    dosage: string;
    frequency: string;
    duration: string;
    route: string;
    instructions: string;
    quantity: number;
    beforeAfterFood: "before" | "after" | "with" | "any";
  }>({ drugName: "", genericName: "", dosage: "", frequency: "Twice daily (BD)", duration: "30 days", route: "Oral", instructions: "", quantity: 30, beforeAfterFood: "after" });

  const filteredIcd = icdSearch ? icdCodes.filter(c => c.code.toLowerCase().includes(icdSearch.toLowerCase()) || c.desc.toLowerCase().includes(icdSearch.toLowerCase())) : [];
  const filteredDrugs = drugSearch ? drugs.filter(d => d.name.toLowerCase().includes(drugSearch.toLowerCase()) || d.genericName.toLowerCase().includes(drugSearch.toLowerCase())) : [];

  const getVitalStatus = (name: string, value: number) => {
    const ranges: Record<string, { low: number; high: number }> = {
      temperature: { low: 97, high: 99.5 }, bpSys: { low: 90, high: 120 }, bpDia: { low: 60, high: 80 },
      heartRate: { low: 60, high: 100 }, respRate: { low: 12, high: 20 }, spo2: { low: 95, high: 100 },
      bloodSugar: { low: 70, high: 100 }, bmi: { low: 18.5, high: 24.9 },
    };
    const r = ranges[name];
    if (!r) return "normal";
    if (value < r.low || value > r.high) return value > r.high * 1.2 || value < r.low * 0.8 ? "critical" : "warning";
    return "normal";
  };

  const tabs = [
    { id: "soap" as const, label: "SOAP Notes", icon: ClipboardList },
    { id: "vitals" as const, label: "Vitals", icon: Heart },
    { id: "rx" as const, label: "Prescriptions", icon: Pill },
    { id: "labs" as const, label: "Lab Orders", icon: FlaskConical },
    { id: "diagnosis" as const, label: "Diagnosis", icon: FileSearch },
  ];

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Patient Header Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {getInitials(patient.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-800">{patient.name}</h2>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">{patient.uhid}</span>
                  {patient.abhaId && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                      <Shield className="w-3 h-3" /> ABHA
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>{patient.age}y / {patient.gender}</span>
                  <span>•</span>
                  <span>{patient.bloodGroup}</span>
                  <span>•</span>
                  <span>{patient.phone}</span>
                  <span>•</span>
                  <span>{patient.totalVisits} visits</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Allergies */}
              {patient.allergies.length > 0 && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  {patient.allergies.map((a) => (
                    <span key={a} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[11px] font-medium">{a}</span>
                  ))}
                </div>
              )}
              {/* Chronic conditions */}
              {patient.chronicConditions.map((c) => (
                <span key={c} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[11px] font-medium">{c}</span>
              ))}
              {/* AI Voice Scribe Toggle */}
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  isRecording ? "bg-red-500 text-white animate-pulse" : "bg-violet-100 text-violet-700 hover:bg-violet-200"
                )}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                {isRecording ? "Stop Recording" : "AI Voice Scribe"}
              </button>
            </div>
          </div>
          <div className="mt-3 p-2 bg-slate-50 rounded-lg text-sm text-slate-600">
            <span className="font-medium text-slate-700">Chief Complaint: </span>{encounter.chiefComplaint}
          </div>
        </div>

        {/* Main Content: Left (Clinical) + Right (History) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Panel - Clinical Notes */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50 px-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    activeTab === tab.id
                      ? "border-emerald-500 text-emerald-700 bg-white"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === "rx" && <span className="ml-1 bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{rxItems.length}</span>}
                  {tab.id === "labs" && <span className="ml-1 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{labOrders.length}</span>}
                  {tab.id === "diagnosis" && <span className="ml-1 bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{diagnoses.length}</span>}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* SOAP Notes Tab */}
              {activeTab === "soap" && (
                <div className="space-y-4">
                  {(["subjective", "objective", "assessment", "plan"] as const).map((section) => (
                    <div key={section}>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                        <span className={cn("w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold text-white",
                          section === "subjective" ? "bg-blue-500" : section === "objective" ? "bg-emerald-500" : section === "assessment" ? "bg-amber-500" : "bg-violet-500"
                        )}>
                          {section[0].toUpperCase()}
                        </span>
                        {section.charAt(0).toUpperCase() + section.slice(1)}
                      </label>
                      <textarea
                        value={soap[section]}
                        onChange={(e) => setSoap({ ...soap, [section]: e.target.value })}
                        rows={section === "plan" ? 6 : 4}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none leading-relaxed"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Vitals Tab */}
              {activeTab === "vitals" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[
                    { key: "temperature", label: "Temperature", unit: "°F", icon: Thermometer, value: vitals.temperature },
                    { key: "bpSys", label: "BP Systolic", unit: "mmHg", icon: Heart, value: vitals.bpSys },
                    { key: "bpDia", label: "BP Diastolic", unit: "mmHg", icon: Heart, value: vitals.bpDia },
                    { key: "heartRate", label: "Heart Rate", unit: "bpm", icon: Activity, value: vitals.heartRate },
                    { key: "respRate", label: "Respiratory Rate", unit: "/min", icon: Wind, value: vitals.respRate },
                    { key: "spo2", label: "SpO₂", unit: "%", icon: Droplets, value: vitals.spo2 },
                    { key: "weight", label: "Weight", unit: "kg", icon: Weight, value: vitals.weight },
                    { key: "height", label: "Height", unit: "cm", icon: Ruler, value: vitals.height },
                    { key: "bmi", label: "BMI", unit: "kg/m²", icon: Brain, value: vitals.bmi },
                    { key: "bloodSugar", label: "Blood Sugar", unit: "mg/dL", icon: Droplets, value: vitals.bloodSugar },
                  ].map((vital) => {
                    const status = getVitalStatus(vital.key, vital.value);
                    return (
                      <div key={vital.key} className={cn("rounded-xl border p-4 transition-colors",
                        status === "critical" ? "border-red-300 bg-red-50" : status === "warning" ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <vital.icon className={cn("w-4 h-4",
                              status === "critical" ? "text-red-500" : status === "warning" ? "text-amber-500" : "text-emerald-500"
                            )} />
                            <span className="text-xs font-medium text-slate-600">{vital.label}</span>
                          </div>
                          <span className={cn("w-2 h-2 rounded-full",
                            status === "critical" ? "bg-red-500 animate-pulse" : status === "warning" ? "bg-amber-500" : "bg-emerald-500"
                          )} />
                        </div>
                        <input
                          type="number"
                          value={vital.value}
                          onChange={(e) => setVitals({ ...vitals, [vital.key]: parseFloat(e.target.value) || 0 })}
                          className={cn("w-full text-2xl font-bold bg-transparent outline-none",
                            status === "critical" ? "text-red-700" : status === "warning" ? "text-amber-700" : "text-slate-800"
                          )}
                        />
                        <span className="text-xs text-slate-400">{vital.unit}</span>
                      </div>
                    );
                  })}
                  {/* Pain Scale */}
                  <div className="col-span-2 border border-slate-200 rounded-xl p-4">
                    <label className="text-xs font-medium text-slate-600 mb-2 block">Pain Scale (0-10)</label>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 11 }, (_, i) => (
                        <button key={i} onClick={() => setVitals({ ...vitals, painScale: i })}
                          className={cn("flex-1 h-8 rounded text-xs font-bold transition-colors",
                            vitals.painScale === i ? (i <= 3 ? "bg-emerald-500 text-white" : i <= 6 ? "bg-amber-500 text-white" : "bg-red-500 text-white") : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          )}>{i}</button>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>No Pain</span><span>Moderate</span><span>Worst Pain</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Prescriptions Tab */}
              {activeTab === "rx" && (
                <div className="space-y-4">
                  {/* Drug Search */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input type="text" value={drugSearch} onChange={(e) => { setDrugSearch(e.target.value); setShowDrugForm(false); }}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Search drug by name or generic name..." />
                      {drugSearch && filteredDrugs.length > 0 && !showDrugForm && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                          {filteredDrugs.map((d) => (
                            <button key={d.id} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-0"
                              onClick={() => { setNewDrug({ ...newDrug, drugName: d.name, genericName: d.genericName, dosage: d.strength }); setDrugSearch(""); setShowDrugForm(true); }}>
                              <span className="font-medium text-slate-800">{d.name}</span>
                              <span className="text-slate-400 ml-2">{d.genericName} • {d.dosageForm} • Stock: {d.currentStock}</span>
                              {d.currentStock <= d.minStock && <span className="ml-2 text-red-500 text-xs font-medium">Low Stock!</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setShowDrugForm(!showDrugForm)} className="flex items-center gap-1 px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600">
                      <Plus className="w-4 h-4" /> Add Drug
                    </button>
                  </div>

                  {/* Add Drug Form */}
                  {showDrugForm && (
                    <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-emerald-800">Add Prescription Item</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="col-span-2">
                          <label className="text-[11px] font-medium text-slate-600">Drug Name</label>
                          <input value={newDrug.drugName} onChange={(e) => setNewDrug({ ...newDrug, drugName: e.target.value })}
                            className="w-full mt-0.5 px-2.5 py-1.5 border rounded text-sm" />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-600">Dosage</label>
                          <input value={newDrug.dosage} onChange={(e) => setNewDrug({ ...newDrug, dosage: e.target.value })}
                            className="w-full mt-0.5 px-2.5 py-1.5 border rounded text-sm" />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-600">Quantity</label>
                          <input type="number" value={newDrug.quantity} onChange={(e) => setNewDrug({ ...newDrug, quantity: parseInt(e.target.value) || 0 })}
                            className="w-full mt-0.5 px-2.5 py-1.5 border rounded text-sm" />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-600">Frequency</label>
                          <select value={newDrug.frequency} onChange={(e) => setNewDrug({ ...newDrug, frequency: e.target.value })}
                            className="w-full mt-0.5 px-2.5 py-1.5 border rounded text-sm bg-white">{frequencyOptions.map(f => <option key={f}>{f}</option>)}</select>
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-600">Duration</label>
                          <select value={newDrug.duration} onChange={(e) => setNewDrug({ ...newDrug, duration: e.target.value })}
                            className="w-full mt-0.5 px-2.5 py-1.5 border rounded text-sm bg-white">{durationOptions.map(d => <option key={d}>{d}</option>)}</select>
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-600">Route</label>
                          <select value={newDrug.route} onChange={(e) => setNewDrug({ ...newDrug, route: e.target.value })}
                            className="w-full mt-0.5 px-2.5 py-1.5 border rounded text-sm bg-white">{routeOptions.map(r => <option key={r}>{r}</option>)}</select>
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-600">Timing</label>
                          <select value={newDrug.beforeAfterFood} onChange={(e) => setNewDrug({ ...newDrug, beforeAfterFood: e.target.value as "before"|"after"|"with"|"any" })}
                            className="w-full mt-0.5 px-2.5 py-1.5 border rounded text-sm bg-white">
                            <option value="before">Before Food</option><option value="after">After Food</option><option value="with">With Food</option><option value="any">Any Time</option>
                          </select>
                        </div>
                        <div className="col-span-2 md:col-span-4">
                          <label className="text-[11px] font-medium text-slate-600">Special Instructions</label>
                          <input value={newDrug.instructions} onChange={(e) => setNewDrug({ ...newDrug, instructions: e.target.value })}
                            className="w-full mt-0.5 px-2.5 py-1.5 border rounded text-sm" placeholder="e.g., Take with warm water" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowDrugForm(false)} className="px-3 py-1.5 text-sm text-slate-600 border rounded hover:bg-slate-50">Cancel</button>
                        <button onClick={() => {
                          setRxItems([...rxItems, { id: `rx-new-${Date.now()}`, ...newDrug }]);
                          setShowDrugForm(false);
                          setNewDrug({ drugName: "", genericName: "", dosage: "", frequency: "Twice daily (BD)", duration: "30 days", route: "Oral", instructions: "", quantity: 30, beforeAfterFood: "after" });
                        }} className="px-3 py-1.5 text-sm bg-emerald-500 text-white rounded font-medium hover:bg-emerald-600">Add to Prescription</button>
                      </div>
                    </div>
                  )}

                  {/* Prescription Items List */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">#</th>
                          <th className="text-left px-3 py-2 font-medium">Drug</th>
                          <th className="text-left px-3 py-2 font-medium">Dosage</th>
                          <th className="text-left px-3 py-2 font-medium">Frequency</th>
                          <th className="text-left px-3 py-2 font-medium">Duration</th>
                          <th className="text-left px-3 py-2 font-medium">Route</th>
                          <th className="text-left px-3 py-2 font-medium">Timing</th>
                          <th className="text-left px-3 py-2 font-medium">Qty</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rxItems.map((item, idx) => (
                          <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2">
                              <span className="font-medium text-slate-800">{item.drugName}</span>
                              {item.genericName && <span className="block text-[11px] text-slate-400">{item.genericName}</span>}
                            </td>
                            <td className="px-3 py-2">{item.dosage}</td>
                            <td className="px-3 py-2">{item.frequency}</td>
                            <td className="px-3 py-2">{item.duration}</td>
                            <td className="px-3 py-2">{item.route}</td>
                            <td className="px-3 py-2">
                              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium",
                                item.beforeAfterFood === "before" ? "bg-blue-100 text-blue-700" : item.beforeAfterFood === "after" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                              )}>{item.beforeAfterFood} food</span>
                            </td>
                            <td className="px-3 py-2">{item.quantity}</td>
                            <td className="px-3 py-2">
                              <button onClick={() => setRxItems(rxItems.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Drug Interaction Warning */}
                  {rxItems.length > 1 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-amber-800">Drug Interaction Check</h4>
                        <p className="text-xs text-amber-700 mt-1">
                          <span className="font-medium">Metformin + Glimepiride:</span> Moderate interaction — Combined use may increase risk of hypoglycemia. Monitor blood glucose closely.
                        </p>
                        <p className="text-[11px] text-amber-600 mt-1">Severity: Moderate • Clinical Action: Monitor • Documented in: Drug Interaction Database v2.1</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lab Orders Tab */}
              {activeTab === "labs" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input type="text" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Search lab tests (e.g., CBC, Lipid Profile, HbA1c)..." />
                    <button className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
                      <Plus className="w-4 h-4" /> Order Test
                    </button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-slate-600">Test</th>
                          <th className="text-left px-3 py-2 font-medium text-slate-600">Code</th>
                          <th className="text-left px-3 py-2 font-medium text-slate-600">Category</th>
                          <th className="text-left px-3 py-2 font-medium text-slate-600">Status</th>
                          <th className="text-left px-3 py-2 font-medium text-slate-600">Result</th>
                          <th className="text-left px-3 py-2 font-medium text-slate-600">Normal Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {labOrders.map((lab) => (
                          <tr key={lab.id} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium text-slate-800">{lab.testName}</td>
                            <td className="px-3 py-2 text-slate-500 font-mono text-xs">{lab.testCode}</td>
                            <td className="px-3 py-2 text-slate-500">{lab.category}</td>
                            <td className="px-3 py-2">
                              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", getStatusColor(lab.status))}>{lab.status}</span>
                            </td>
                            <td className="px-3 py-2">
                              {lab.result ? (
                                <span className={cn("font-semibold",
                                  lab.normalRange && lab.result && parseFloat(lab.result) > parseFloat(lab.normalRange.split("-")[1]?.trim() || "999") ? "text-red-600" : "text-slate-800"
                                )}>{lab.result} {lab.unit}</span>
                              ) : <span className="text-slate-400">—</span>}
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-400">{lab.normalRange || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Diagnosis Tab */}
              {activeTab === "diagnosis" && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input type="text" value={icdSearch} onChange={(e) => setIcdSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Search ICD-11 codes (e.g., E11, hypertension, diabetes)..." />
                    {icdSearch && filteredIcd.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-10">
                        {filteredIcd.map((code) => (
                          <button key={code.code} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-0"
                            onClick={() => {
                              if (!diagnoses.find(d => d.icdCode === code.code)) {
                                setDiagnoses([...diagnoses, { id: `dg-${Date.now()}`, icdCode: code.code, description: code.desc, type: "secondary" }]);
                              }
                              setIcdSearch("");
                            }}>
                            <span className="font-mono text-emerald-600 font-medium">{code.code}</span>
                            <span className="ml-2 text-slate-600">{code.desc}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {diagnoses.map((dx, idx) => (
                      <div key={dx.id} className={cn("flex items-center gap-3 p-3 rounded-lg border",
                        dx.type === "primary" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
                      )}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium text-emerald-700">{dx.icdCode}</span>
                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium",
                              dx.type === "primary" ? "bg-emerald-200 text-emerald-800" : dx.type === "secondary" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                            )}>{dx.type}</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-0.5">{dx.description}</p>
                        </div>
                        <select value={dx.type} onChange={(e) => {
                          const updated = [...diagnoses];
                          updated[idx].type = e.target.value as "primary" | "secondary" | "differential";
                          setDiagnoses(updated);
                        }} className="px-2 py-1 border rounded text-xs bg-white">
                          <option value="primary">Primary</option>
                          <option value="secondary">Secondary</option>
                          <option value="differential">Differential</option>
                        </select>
                        <button onClick={() => setDiagnoses(diagnoses.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Patient History */}
          <div className="space-y-4">
            {/* Allergy Alert */}
            {patient.allergies.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-red-700 text-xs font-semibold mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> ALLERGIES
                </div>
                {patient.allergies.map((a) => (
                  <span key={a} className="inline-block mr-1 mb-1 px-2 py-0.5 bg-red-200 text-red-800 rounded text-[11px] font-medium">{a}</span>
                ))}
              </div>
            )}

            {/* Active Medications */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Active Medications</h3>
              <div className="space-y-2">
                {activeMedications.map((med) => (
                  <div key={med.name} className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700">{med.name}</p>
                    <p className="text-[11px] text-slate-500">{med.dosage} • Since {formatDate(med.since)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Lab Values */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Recent Lab Values</h3>
              <div className="space-y-1.5">
                {recentLabValues.map((lab) => (
                  <div key={lab.test} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-xs text-slate-600">{lab.test}</span>
                    <span className={cn("text-xs font-semibold",
                      lab.status === "high" ? "text-red-600" : lab.status === "normal" ? "text-emerald-600" : "text-amber-600"
                    )}>{lab.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Past Visits */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Visit History</h3>
              <div className="space-y-2.5">
                {pastVisits.map((visit) => (
                  <div key={visit.date} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{formatDate(visit.date)}</span>
                      <span className="text-[11px] text-slate-400">{visit.doctor}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-1">{visit.complaint}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {visit.diagnoses.map((d) => (
                        <span key={d} className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{d}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="sticky bottom-4 bg-white rounded-xl border border-slate-200 shadow-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Encounter: {encounter.id}</span>
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Draft — Unsaved changes</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              <Printer className="w-4 h-4" /> Print Rx
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
              <Receipt className="w-4 h-4" /> Invoice
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 shadow-md">
              <CheckCircle2 className="w-4 h-4" /> Complete & Sign
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

