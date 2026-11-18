"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Clock3, Plus, Save, Trash2 } from "lucide-react";
import { DoctorMobileHeader, DoctorMobileNavigation } from "@/components/doctor-mobile/navigation";
import type { PrescriptionItem } from "@/lib/types";

interface ChartData {
  patient: {
    id: string;
    uhid: string;
    name: string;
    phone: string;
    age: number;
    gender: string;
    bloodGroup: string | null;
    allergies: string[];
    chronicConditions: string[];
    lastVisit: string | null;
    totalVisits: number;
  };
  encounters: Array<{
    id: string;
    date: string;
    department: string;
    chiefComplaint: string;
    vitals: Record<string, number> | null;
    notes: Record<string, string>;
    diagnoses: Array<{ description?: string }>;
    followUpDate: string | null;
  }>;
  prescriptions: Array<{
    id: string;
    prescriptionNo: string;
    doctorName: string;
    date: string;
    medicines: PrescriptionItem[];
    advice: string;
    followUpDate: string | null;
  }>;
  activeAppointment: { id: string; date: string; timeSlot: string; status: string } | null;
}

interface MedicineDraft {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  quantity: string;
  beforeAfterFood: "before" | "after" | "with" | "any";
  instructions: string;
}

const emptyMedicine: MedicineDraft = {
  drugName: "",
  dosage: "",
  frequency: "Once daily (OD)",
  duration: "5 days",
  route: "Oral",
  quantity: "5",
  beforeAfterFood: "after",
  instructions: "",
};

const vitalFields = [
  { key: "temperature", label: "Temperature °C", placeholder: "e.g. 36.8" },
  { key: "bloodPressureSystolic", label: "Systolic BP", placeholder: "e.g. 120" },
  { key: "bloodPressureDiastolic", label: "Diastolic BP", placeholder: "e.g. 80" },
  { key: "heartRate", label: "Heart rate / min", placeholder: "e.g. 72" },
  { key: "respiratoryRate", label: "Respiratory rate / min", placeholder: "e.g. 16" },
  { key: "oxygenSaturation", label: "SpO₂ %", placeholder: "e.g. 98" },
  { key: "weight", label: "Weight kg", placeholder: "e.g. 70" },
  { key: "height", label: "Height cm", placeholder: "e.g. 170" },
  { key: "bloodSugar", label: "Blood sugar mg/dL", placeholder: "e.g. 100" },
  { key: "painScale", label: "Pain score (0–10)", placeholder: "e.g. 0" },
] as const;

async function getError(response: Response): Promise<string> {
  const result = await response.json() as { error?: string };
  return response.ok ? "" : result.error || "Unable to complete this request.";
}

class SignInRequiredError extends Error {}

export default function DoctorMobilePatientPage() {
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;
  const [chart, setChart] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signInRequired, setSignInRequired] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [soap, setSoap] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [diagnosis, setDiagnosis] = useState("");
  const [vitals, setVitals] = useState<Record<string, string>>({});
  const [advice, setAdvice] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [medicine, setMedicine] = useState<MedicineDraft>(emptyMedicine);
  const [medicines, setMedicines] = useState<MedicineDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [completingVisit, setCompletingVisit] = useState(false);

  const loadChart = useCallback(async () => {
    const response = await fetch(`/api/doctor-mobile/patients/${encodeURIComponent(patientId)}`, { cache: "no-store" });
    const result = await response.json() as ChartData | { error?: string };
    if (response.status === 401) throw new SignInRequiredError("Please sign in to continue.");
    if (!response.ok || !("patient" in result)) {
      throw new Error("error" in result ? result.error || "Unable to load this patient chart." : "Unable to load this patient chart.");
    }
    return result;
  }, [patientId]);

  useEffect(() => {
    let active = true;
    loadChart()
      .then((result) => {
        if (active) setChart(result);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setSignInRequired(loadError instanceof SignInRequiredError);
          setError(loadError instanceof Error ? loadError.message : "Unable to load this patient chart.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadChart]);

  const addMedicine = () => {
    if (!medicine.drugName.trim() || !medicine.dosage.trim() || !medicine.frequency.trim() || !medicine.quantity.trim()) return;
    setMedicines((current) => [...current, medicine]);
    setMedicine(emptyMedicine);
  };

  const saveConsultation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/doctor-mobile/encounters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          chiefComplaint,
          ...soap,
          diagnosis,
          advice,
          followUpDate,
          vitals: Object.fromEntries(
            Object.entries(vitals).filter(([, value]) => value.trim()).map(([key, value]) => [key, Number(value)]),
          ),
          medicines: medicines.map((item) => ({
            ...item,
            quantity: Number(item.quantity),
            genericName: "",
          })),
        }),
      });
      const requestError = await getError(response);
      if (requestError) throw new Error(requestError);
      const result = await response.json() as { encounterId: string; prescriptionNo?: string };
      setMessage(result.prescriptionNo
        ? `Consultation saved. Prescription ${result.prescriptionNo} created.`
        : "Consultation saved.");
      setChiefComplaint("");
      setSoap({ subjective: "", objective: "", assessment: "", plan: "" });
      setDiagnosis("");
      setVitals({});
      setAdvice("");
      setFollowUpDate("");
      setMedicines([]);
      setChart(await loadChart());
    } catch (saveError) {
      if (saveError instanceof SignInRequiredError) setSignInRequired(true);
      setError(saveError instanceof Error ? saveError.message : "Unable to save this consultation.");
    } finally {
      setSaving(false);
    }
  };

  const completeVisit = async () => {
    if (!chart?.activeAppointment || chart.activeAppointment.status !== "in-consultation") return;
    setCompletingVisit(true);
    setError("");
    try {
      const response = await fetch(`/api/doctor-mobile/appointments/${encodeURIComponent(chart.activeAppointment.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      const requestError = await getError(response);
      if (requestError) throw new Error(requestError);
      setMessage("Visit marked complete.");
      setChart(await loadChart());
    } catch (completeError) {
      if (completeError instanceof SignInRequiredError) setSignInRequired(true);
      setError(completeError instanceof Error ? completeError.message : "Unable to complete this visit.");
    } finally {
      setCompletingVisit(false);
    }
  };

  const patient = chart?.patient;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <DoctorMobileHeader title="Patient chart" />
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-5">
        <Link href="/doctor/patients" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"><ArrowLeft className="h-4 w-4" />My patients</Link>
        {loading ? (
          <p role="status" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading secure patient chart…</p>
        ) : error && !patient ? (
          <div className="rounded-xl border border-red-200 bg-white p-4">
            <p role="alert" className="text-sm text-red-700">{error}</p>
            {signInRequired && <Link href={`/login?next=${encodeURIComponent(`/doctor/patients/${patientId}`)}`} className="mt-3 inline-block text-sm font-medium text-emerald-800">Sign in to ClinicOS</Link>}
          </div>
        ) : patient ? (
          <>
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-emerald-700">{patient.uhid}</p>
                  <h1 className="mt-1 text-2xl font-bold text-slate-900">{patient.name}</h1>
                  <p className="mt-1 text-sm text-slate-600">{patient.age} years · {patient.gender}{patient.bloodGroup ? ` · ${patient.bloodGroup}` : ""}</p>
                  <a href={`tel:${patient.phone}`} className="mt-2 inline-block text-sm text-emerald-700">{patient.phone}</a>
                </div>
                {chart.activeAppointment && (
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium capitalize text-teal-700">
                    {chart.activeAppointment.status.replaceAll("-", " ")}
                  </span>
                )}
              </div>
              {(patient.allergies.length > 0 || patient.chronicConditions.length > 0) && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {patient.allergies.length > 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900"><AlertTriangle className="h-4 w-4" />Allergies</p><p className="mt-1 text-sm text-amber-900">{patient.allergies.join(", ")}</p></div>}
                  {patient.chronicConditions.length > 0 && <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-600">Chronic conditions</p><p className="mt-1 text-sm text-slate-800">{patient.chronicConditions.join(", ")}</p></div>}
                </div>
              )}
            </section>

            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {message && <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0" />{message}</p>}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><h2 className="text-lg font-bold text-slate-900">Recent consultations</h2><p className="text-xs text-slate-500">Your entries for this patient</p></div>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{chart.encounters.length} visits</span>
              </div>
              {chart.encounters.length === 0 ? <p className="text-sm text-slate-500">No prior consultations recorded by you.</p> : (
                <ul className="space-y-3">
                  {chart.encounters.map((encounter) => (
                    <li key={encounter.id} className="border-l-2 border-emerald-300 pl-3">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{encounter.date} · {encounter.department}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{encounter.chiefComplaint}</p>
                      {encounter.diagnoses.map((item, index) => item.description && <p key={`${encounter.id}-diagnosis-${index}`} className="mt-1 text-xs text-slate-600">{item.description}</p>)}
                      {encounter.vitals && Object.keys(encounter.vitals).length > 0 && <p className="mt-1 text-xs text-slate-500">{Object.entries(encounter.vitals).map(([key, value]) => `${key.replace(/([A-Z])/g, " $1")}: ${value}`).join(" · ")}</p>}
                      {encounter.notes.assessment && <p className="mt-1 text-xs text-slate-600"><span className="font-medium">Assessment:</span> {encounter.notes.assessment}</p>}
                      {encounter.followUpDate && <p className="mt-1 text-xs text-slate-500">Follow-up {encounter.followUpDate}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2"><Clock3 className="h-5 w-5 text-emerald-700" /><h2 className="text-lg font-bold text-slate-900">Prescriptions</h2></div>
              {chart.prescriptions.length === 0 ? <p className="text-sm text-slate-500">No prescriptions created by you.</p> : (
                <ul className="space-y-3">
                  {chart.prescriptions.map((prescription) => (
                    <li key={prescription.id} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-emerald-800">{prescription.prescriptionNo} · {prescription.date}</p>
                      <ul className="mt-2 space-y-1">
                        {prescription.medicines.map((item) => <li key={item.id} className="text-sm text-slate-800"><span className="font-medium">{item.drugName}</span><span className="text-slate-600"> · {item.dosage} · {item.frequency} · {item.duration}</span></li>)}
                      </ul>
                      {prescription.advice && <p className="mt-2 text-xs text-slate-600">{prescription.advice}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <form onSubmit={saveConsultation} className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
              <div><h2 className="text-lg font-bold text-slate-900">New consultation</h2><p className="mt-1 text-xs text-slate-500">Saved securely to the clinic record under your doctor account.</p></div>
              <label className="block text-sm font-medium text-slate-700">Chief complaint *
                <input required maxLength={1000} value={chiefComplaint} onChange={(event) => setChiefComplaint(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" placeholder="Reason for today's visit" />
              </label>
              {([
                ["subjective", "Subjective"],
                ["objective", "Objective"],
                ["assessment", "Assessment"],
                ["plan", "Plan"],
              ] as const).map(([key, label]) => (
                <label key={key} className="block text-sm font-medium text-slate-700">{label}
                  <textarea maxLength={5000} rows={2} value={soap[key]} onChange={(event) => setSoap((current) => ({ ...current, [key]: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" placeholder={`${label} notes`} />
                </label>
              ))}
              <fieldset className="rounded-xl border border-slate-200 p-3">
                <legend className="px-1 text-sm font-semibold text-slate-800">Vitals <span className="font-normal text-slate-500">(optional)</span></legend>
                <div className="grid grid-cols-2 gap-3">
                  {vitalFields.map((field) => (
                    <label key={field.key} className="text-xs font-medium text-slate-600">{field.label}
                      <input type="number" step="any" inputMode="decimal" value={vitals[field.key] || ""} onChange={(event) => setVitals((current) => ({ ...current, [field.key]: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm font-normal" placeholder={field.placeholder} />
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm font-medium text-slate-700">Diagnosis
                <input maxLength={5000} value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" placeholder="Diagnosis or assessment" />
              </label>
              <div className="border-t border-slate-100 pt-4">
                <h3 className="font-semibold text-slate-900">Prescription medicines <span className="font-normal text-slate-500">(optional)</span></h3>
                {medicines.length > 0 && <ul className="my-3 space-y-2">{medicines.map((item, index) => <li key={`${item.drugName}-${index}`} className="flex items-start gap-2 rounded-lg bg-slate-50 p-3"><span className="min-w-0 flex-1 text-sm"><span className="font-medium">{item.drugName}</span><span className="block text-xs text-slate-500">{item.dosage} · {item.frequency} · {item.duration} · {item.quantity} qty</span></span><button type="button" onClick={() => setMedicines((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${item.drugName}`} className="p-1 text-slate-500"><Trash2 className="h-4 w-4" /></button></li>)}</ul>}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-slate-600 sm:col-span-2">Medicine name
                    <input value={medicine.drugName} onChange={(event) => setMedicine((current) => ({ ...current, drugName: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" placeholder="Medicine name" />
                  </label>
                  <label className="text-xs font-medium text-slate-600">Dose
                    <input value={medicine.dosage} onChange={(event) => setMedicine((current) => ({ ...current, dosage: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" placeholder="e.g. 500 mg" />
                  </label>
                  <label className="text-xs font-medium text-slate-600">Frequency
                    <input value={medicine.frequency} onChange={(event) => setMedicine((current) => ({ ...current, frequency: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" placeholder="e.g. Twice daily (BD)" />
                  </label>
                  <label className="text-xs font-medium text-slate-600">Duration
                    <input value={medicine.duration} onChange={(event) => setMedicine((current) => ({ ...current, duration: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" placeholder="e.g. 5 days" />
                  </label>
                  <label className="text-xs font-medium text-slate-600">Quantity
                    <input type="number" min="1" max="10000" value={medicine.quantity} onChange={(event) => setMedicine((current) => ({ ...current, quantity: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" />
                  </label>
                  <label className="text-xs font-medium text-slate-600">Route
                    <select value={medicine.route} onChange={(event) => setMedicine((current) => ({ ...current, route: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"><option>Oral</option><option>Topical</option><option>Inhalation</option><option>Injection</option><option>Ophthalmic</option><option>Other</option></select>
                  </label>
                  <label className="text-xs font-medium text-slate-600">Food instruction
                    <select value={medicine.beforeAfterFood} onChange={(event) => setMedicine((current) => ({ ...current, beforeAfterFood: event.target.value as MedicineDraft["beforeAfterFood"] }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal"><option value="before">Before food</option><option value="after">After food</option><option value="with">With food</option><option value="any">Any time</option></select>
                  </label>
                  <label className="text-xs font-medium text-slate-600 sm:col-span-2">Instructions
                    <input value={medicine.instructions} onChange={(event) => setMedicine((current) => ({ ...current, instructions: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" placeholder="Optional instructions" />
                  </label>
                </div>
                <button type="button" onClick={addMedicine} disabled={!medicine.drugName.trim() || !medicine.dosage.trim() || !medicine.frequency.trim() || Number(medicine.quantity) < 1} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-200 px-3 text-sm font-medium text-emerald-800 disabled:opacity-50"><Plus className="h-4 w-4" />Add medicine</button>
              </div>
              {medicines.length > 0 && <label className="block text-sm font-medium text-slate-700">Prescription advice
                <textarea maxLength={5000} rows={2} value={advice} onChange={(event) => setAdvice(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" placeholder="Additional instructions" />
              </label>}
              <label className="block text-sm font-medium text-slate-700">Follow-up date
                <input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" />
              </label>
              <button disabled={saving} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "Saving securely…" : "Save consultation"}</button>
            </form>

            {chart.activeAppointment?.status === "in-consultation" && (
              <button onClick={() => void completeVisit()} disabled={completingVisit} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 disabled:opacity-60"><CheckCircle2 className="h-4 w-4" />{completingVisit ? "Completing…" : "Mark visit complete"}</button>
            )}
          </>
        ) : null}
      </main>
      <DoctorMobileNavigation />
    </div>
  );
}
