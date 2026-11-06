"use client";

import React, { useEffect, useState } from "react";
import {
  Pill, Search, Plus, Printer, Send, Eye, CheckCircle2, Clock,
  AlertTriangle, QrCode, FileText, Download, ChevronDown, ChevronUp,
  Stethoscope, User, Shield, Phone, Calendar, Package, X,
} from "lucide-react";
import { cn, formatDate, getStatusColor, getInitials, formatCurrency } from "@/lib/utils";
import { prescriptions, encounters, patients as mockPatients, drugs } from "@/lib/mock-data";
import AppLayout from "@/components/layout/app-layout";
import { createPrescriptionPdf } from "@/lib/prescription-pdf";
import { getPrescriptionVerificationQr } from "@/lib/prescription-qr";
import type { Patient } from "@/lib/types";

interface DrugInteractionItem {
  drug1: string;
  drug2: string;
  severity: "mild" | "moderate" | "severe";
  description: string;
  recommendation: string;
}

const drugInteractions: DrugInteractionItem[] = [
  {
    drug1: "Atorvastatin 20mg",
    drug2: "Aspirin 75mg",
    severity: "mild" as const,
    description: "Aspirin may slightly increase the plasma concentration of Atorvastatin. Usually not clinically significant at these doses.",
    recommendation: "No dosage adjustment needed. Monitor for muscle pain.",
  },
  {
    drug1: "Telmisartan 40mg",
    drug2: "Aspirin 75mg",
    severity: "moderate" as const,
    description: "NSAIDs/Aspirin may reduce the antihypertensive effect of Telmisartan and may increase risk of renal impairment.",
    recommendation: "Monitor blood pressure and renal function. Low-dose aspirin (75mg) is generally safe.",
  },
  {
    drug1: "Metformin 1000mg",
    drug2: "Glimepiride 1mg",
    severity: "moderate" as const,
    description: "Combined use of two anti-diabetic agents increases the risk of hypoglycemia.",
    recommendation: "Educate patient about signs of hypoglycemia. Start Glimepiride at lowest dose. Monitor blood glucose.",
  },
];

export default function PrescriptionsPage() {
  const [patientRecords, setPatientRecords] = useState<Patient[]>([]);
  const [patientsLoaded, setPatientsLoaded] = useState(false);
  const [patientLoadError, setPatientLoadError] = useState("");
  const [documentActionError, setDocumentActionError] = useState("");
  const [expandedRx, setExpandedRx] = useState<string | null>("prx2");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInteractionPanel, setShowInteractionPanel] = useState(false);
  const [showNewRxModal, setShowNewRxModal] = useState(false);
  const [shareRxId, setShareRxId] = useState<string | null>(null);
  const [shareConsentConfirmed, setShareConsentConfirmed] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isPreparingShare, setIsPreparingShare] = useState(false);
  const [shareQrDataUrl, setShareQrDataUrl] = useState("");
  const [shareFallback, setShareFallback] = useState(false);
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/patients")
      .then(async (response) => {
        const result = await response.json() as Patient[] | { error?: string };
        if (!response.ok || !Array.isArray(result)) {
          throw new Error("error" in result ? result.error : "Unable to load patients.");
        }
        if (active) {
          setPatientRecords(result);
          setPatientLoadError("");
          setPatientsLoaded(true);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setPatientLoadError(error instanceof Error ? error.message : "Unable to load patients.");
          setPatientsLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const shareRx = prescriptions.find((rx) => rx.id === shareRxId);
  const sharePatient = shareRx ? patientRecords.find((patient) => patient.id === shareRx.patientId) : undefined;

  const openShareDialog = (prescriptionId: string) => {
    setShareRxId(prescriptionId);
    setShareConsentConfirmed(false);
    setShareFallback(false);
    setShareQrDataUrl("");
    setShareError("");
    setIsPreparingShare(true);
    void getPrescriptionVerificationQr(prescriptionId).then(
      ({ dataUrl }) => setShareQrDataUrl(dataUrl),
      (error: unknown) => setShareError(error instanceof Error ? error.message : "Could not create a verification QR.")
    ).finally(() => setIsPreparingShare(false));
  };

  const handleSharePrescription = () => {
    if (!shareRx || !sharePatient?.phone || !shareConsentConfirmed || !shareQrDataUrl) return;

    setShareError("");
    try {
      const file = createPrescriptionPdf(shareRx, sharePatient, { verificationQrDataUrl: shareQrDataUrl });
      const shareData = {
        files: [file],
        title: `Prescription ${shareRx.prescriptionNo}`,
        text: "Please find the attached prescription from ClinicOS.",
      };

      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: shareData.files })
      ) {
        setIsSharing(true);
        void navigator.share(shareData).then(
          () => {
            setShareRxId(null);
            setShareConsentConfirmed(false);
          },
          (error: unknown) => {
            if (error instanceof Error && error.name === "AbortError") return;
            setShareError(error instanceof Error ? error.message : "The prescription could not be shared.");
          }
        ).finally(() => setIsSharing(false));
        return;
      }

      const downloadUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = file.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      setShareFallback(true);
    } catch (error) {
      setShareError(error instanceof Error ? error.message : "The prescription PDF could not be prepared.");
    }
  };

  const getWhatsAppChatUrl = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    const internationalNumber = phone.trim().startsWith("+") && digits.length >= 8 && digits.length <= 15
      ? digits
      : digits.length === 10
        ? `91${digits}`
        : digits.length === 11 && digits.startsWith("0")
          ? `91${digits.slice(1)}`
          : digits.length === 12 && digits.startsWith("91")
            ? digits
            : null;

    if (!internationalNumber) return null;
    return `https://wa.me/${internationalNumber}?text=${encodeURIComponent("Please find the attached prescription from ClinicOS.")}`;
  };

  const downloadPrescriptionPdf = async (rxId: string) => {
    const prescription = prescriptions.find((item) => item.id === rxId);
    const patient = prescription
      ? patientRecords.find((item) => item.id === prescription.patientId)
      : undefined;

    if (!prescription || !patient) {
      setDocumentActionError("Patient details are not available. Reload the page and try again.");
      return;
    }

    try {
      setDocumentActionError("");
      const { dataUrl } = await getPrescriptionVerificationQr(rxId);
      const file = createPrescriptionPdf(prescription, patient, { verificationQrDataUrl: dataUrl });
      const downloadUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
    } catch (error) {
      setDocumentActionError(error instanceof Error ? error.message : "The prescription PDF could not be downloaded.");
    }
  };

  const printPrescription = (rxId: string) => {
    const prescription = prescriptions.find((item) => item.id === rxId);
    const patient = prescription
      ? patientRecords.find((item) => item.id === prescription.patientId)
      : undefined;

    if (!prescription || !patient) {
      setDocumentActionError("Patient details are not available. Reload the page and try again.");
      return;
    }

    const printWindow = window.open("about:blank", "_blank");
    if (!printWindow) {
      setDocumentActionError("The print window was blocked. Allow pop-ups for ClinicOS and try again.");
      return;
    }

    try {
      setDocumentActionError("");
      void getPrescriptionVerificationQr(rxId).then(({ dataUrl }) => {
        const file = createPrescriptionPdf(prescription, patient, {
          autoPrint: true,
          verificationQrDataUrl: dataUrl,
        });
        const printUrl = URL.createObjectURL(file);
        printWindow.location.href = printUrl;
        window.setTimeout(() => URL.revokeObjectURL(printUrl), 10 * 60 * 1000);
      }).catch((error: unknown) => {
        printWindow.close();
        setDocumentActionError(error instanceof Error ? error.message : "The prescription could not be prepared for printing.");
      });
    } catch (error) {
      printWindow.close();
      setDocumentActionError(error instanceof Error ? error.message : "The prescription could not be prepared for printing.");
    }
  };

  const filteredRx = prescriptions.filter(
    (rx) =>
      rx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.prescriptionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.doctorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: prescriptions.length,
    dispensed: prescriptions.filter((p) => p.status === "dispensed").length,
    pending: prescriptions.filter((p) => p.status === "created").length,
    erxSent: 0,
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Smart Prescriptions</h1>
            <p className="text-sm text-slate-500 mt-0.5">e-Rx management with drug interaction checking</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInteractionPanel(!showInteractionPanel)}
              className="flex items-center gap-2 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-50"
            >
              <AlertTriangle className="w-4 h-4" />
              Interaction Checker
            </button>
            <button
              onClick={() => setShowNewRxModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-sm font-medium hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              New Prescription
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Today", value: stats.total, icon: FileText, color: "text-blue-600 bg-blue-50 border-blue-200" },
            { label: "Dispensed", value: stats.dispensed, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
            { label: "Pending Dispensing", value: stats.pending, icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-200" },
            { label: "e-Rx Sent", value: stats.erxSent, icon: Send, color: "text-violet-600 bg-violet-50 border-violet-200" },
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

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Search by patient name, Rx number, or doctor..."
          />
        </div>

        {patientLoadError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Patient records could not be loaded. e-Rx sharing is disabled until the patient contact details are available. {patientLoadError}
          </div>
        )}
        {documentActionError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {documentActionError}
          </div>
        )}

        {/* Drug Interaction Panel */}
        {showInteractionPanel && (
          <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-sm text-amber-800">Drug Interaction Alerts</h3>
              </div>
              <button onClick={() => setShowInteractionPanel(false)} className="text-amber-400 hover:text-amber-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {drugInteractions.map((interaction, idx) => (
                <div key={idx} className={cn("rounded-lg border p-3",
                  interaction.severity === "severe" ? "border-red-200 bg-red-50" :
                  interaction.severity === "moderate" ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50"
                )}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                      interaction.severity === "severe" ? "bg-red-500 text-white" :
                      interaction.severity === "moderate" ? "bg-amber-500 text-white" : "bg-blue-500 text-white"
                    )}>{interaction.severity}</span>
                    <span className="text-sm font-medium text-slate-800">{interaction.drug1} ↔ {interaction.drug2}</span>
                  </div>
                  <p className="text-xs text-slate-600">{interaction.description}</p>
                  <p className="text-xs text-slate-500 mt-1 italic">
                    <span className="font-medium">Recommendation:</span> {interaction.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prescription List */}
        <div className="space-y-4">
          {filteredRx.map((rx) => {
            const isExpanded = expandedRx === rx.id;
            const patientData = patientRecords.find((p) => p.id === rx.patientId);

            return (
              <div key={rx.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Prescription Header */}
                <button
                  onClick={() => setExpandedRx(isExpanded ? null : rx.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    Rx
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-emerald-700">{rx.prescriptionNo}</span>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", getStatusColor(rx.status))}>
                        {rx.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700">{rx.patientName}</span>
                      <span>•</span>
                      <span>{rx.doctorName}</span>
                      <span>•</span>
                      <span>{formatDate(rx.date)}</span>
                      <span>•</span>
                      <span>{rx.items.length} items</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); printPrescription(rx.id); }}
                      disabled={!patientsLoaded || !patientData}
                      aria-label={`Print prescription ${rx.prescriptionNo}`}
                      title={!patientsLoaded ? "Loading patient records" : patientLoadError || (patientData ? "Print prescription" : "Patient details are unavailable")}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openShareDialog(rx.id); }}
                      disabled={!patientsLoaded || Boolean(patientLoadError) || !patientData?.phone}
                      aria-label={`Send e-Rx for ${rx.patientName}`}
                      title={!patientsLoaded ? "Loading patient records" : patientLoadError || (patientData?.phone ? "Share prescription PDF" : "Patient mobile number is missing")}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-slate-200">
                    {/* Prescription Preview */}
                    <div className="p-6 max-w-3xl mx-auto">
                      {/* Print Header */}
                      <div className="border-b-2 border-emerald-500 pb-4 mb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-xl font-bold text-slate-800">ClinicOS - Koramangala</h2>
                            <p className="text-xs text-slate-500 mt-0.5">No. 42, 80 Feet Road, Koramangala 4th Block, Bangalore - 560034</p>
                            <p className="text-xs text-slate-500">Phone: 080-41234567 | GST: 29AABCC1234D1ZN</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">{rx.doctorName}</p>
                            <p className="text-xs text-slate-500">
                              {rx.doctorId === "u1" ? "General Medicine" : rx.doctorId === "u2" ? "Cardiology" : "Specialist"}
                            </p>
                            <p className="text-xs text-slate-500">Reg. No: {rx.doctorId === "u1" ? "KMC-45678" : "KMC-45679"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Patient Info Row */}
                      <div className="grid grid-cols-3 gap-4 mb-4 text-xs">
                        <div>
                          <span className="text-slate-400">Patient:</span>
                          <span className="ml-1 font-medium text-slate-800">{rx.patientName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Age/Gender:</span>
                          <span className="ml-1 font-medium text-slate-800">{patientData?.age}y / {patientData?.gender}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Date:</span>
                          <span className="ml-1 font-medium text-slate-800">{formatDate(rx.date)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">UHID:</span>
                          <span className="ml-1 font-mono font-medium text-slate-800">{patientData?.uhid}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Rx No:</span>
                          <span className="ml-1 font-mono font-medium text-emerald-700">{rx.prescriptionNo}</span>
                        </div>
                        {patientData?.abhaId && (
                          <div>
                            <span className="text-slate-400">ABHA:</span>
                            <span className="ml-1 font-mono font-medium text-slate-800">{patientData.abhaId}</span>
                          </div>
                        )}
                      </div>

                      {/* Diagnosis */}
                      <div className="mb-4 p-2.5 bg-slate-50 rounded-lg">
                        <span className="text-xs font-semibold text-slate-600">Diagnosis: </span>
                        <span className="text-xs text-slate-700">{rx.diagnoses.join(" | ")}</span>
                      </div>

                      {/* Rx Symbol & Items */}
                      <div className="mb-4">
                        <div className="text-2xl font-serif text-emerald-600 mb-3">℞</div>
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b-2 border-slate-200">
                              <th className="text-left pb-2 text-xs font-semibold text-slate-500 w-8">#</th>
                              <th className="text-left pb-2 text-xs font-semibold text-slate-500">Medicine</th>
                              <th className="text-left pb-2 text-xs font-semibold text-slate-500">Dose</th>
                              <th className="text-left pb-2 text-xs font-semibold text-slate-500">Frequency</th>
                              <th className="text-left pb-2 text-xs font-semibold text-slate-500">Duration</th>
                              <th className="text-left pb-2 text-xs font-semibold text-slate-500">Qty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rx.items.map((item, idx) => (
                              <tr key={item.id} className="border-b border-slate-100">
                                <td className="py-2.5 text-slate-400">{idx + 1}.</td>
                                <td className="py-2.5">
                                  <span className="font-medium text-slate-800">{item.drugName}</span>
                                  {item.genericName && <span className="block text-[11px] text-slate-400 italic">({item.genericName})</span>}
                                  {item.instructions && <span className="block text-[10px] text-blue-600 mt-0.5">ℹ {item.instructions}</span>}
                                </td>
                                <td className="py-2.5 text-slate-700">{item.dosage}</td>
                                <td className="py-2.5 text-slate-700">{item.frequency}</td>
                                <td className="py-2.5 text-slate-700">{item.duration}</td>
                                <td className="py-2.5 text-slate-700">{item.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Advice & Follow-up */}
                      <div className="space-y-3 mb-4">
                        <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                          <span className="text-xs font-semibold text-blue-700">Advice: </span>
                          <span className="text-xs text-blue-800">{rx.advice}</span>
                        </div>
                        {rx.followUpDate && (
                          <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-semibold text-amber-700">Follow-up: </span>
                            <span className="text-xs text-amber-800">{formatDate(rx.followUpDate)}</span>
                          </div>
                        )}
                      </div>

                      {/* Signature & Verification QR */}
                      <div className="flex items-end justify-between pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-3">
                          <PrescriptionVerificationQr prescriptionId={rx.id} />
                        </div>
                        <div className="text-right">
                          <div className="w-40 border-b border-slate-300 mb-1 h-8"></div>
                          <p className="text-sm font-medium text-slate-700">{rx.doctorName}</p>
                          <p className="text-[10px] text-slate-400">Digital Signature</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        {rx.status === "dispensed" ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Dispensed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Package className="w-3.5 h-3.5" /> Pending Dispensing
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => downloadPrescriptionPdf(rx.id)}
                          disabled={!patientsLoaded || !patientData}
                          className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Download className="w-3.5 h-3.5" /> Download PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => printPrescription(rx.id)}
                          disabled={!patientsLoaded || !patientData}
                          className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print
                        </button>
                        <button
                          type="button"
                          onClick={() => openShareDialog(rx.id)}
                          disabled={!patientsLoaded || Boolean(patientLoadError) || !patientData?.phone}
                          title={!patientsLoaded ? "Loading patient records" : patientLoadError || (patientData?.phone ? "Share prescription PDF" : "Patient mobile number is missing")}
                          className="flex items-center gap-1 px-3 py-1.5 border border-blue-300 rounded text-xs text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Send className="w-3.5 h-3.5" /> Send e-Rx
                        </button>
                        {rx.status !== "dispensed" && (
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded text-xs font-medium hover:bg-emerald-600">
                            <Package className="w-3.5 h-3.5" /> Dispense
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {shareRx && sharePatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="share-erx-title"
              className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h2 id="share-erx-title" className="text-lg font-bold text-slate-800">Share prescription PDF</h2>
                <button
                  type="button"
                  onClick={() => setShareRxId(null)}
                  aria-label="Close share dialog"
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 p-6">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p><span className="font-medium text-slate-600">Patient:</span> {sharePatient.name}</p>
                  <p><span className="font-medium text-slate-600">Mobile:</span> {sharePatient.phone}</p>
                  <p><span className="font-medium text-slate-600">Prescription:</span> {shareRx.prescriptionNo}</p>
                </div>
                <p className="text-sm text-slate-600">
                  Your device will open its share sheet. Choose WhatsApp and verify that the selected chat matches this patient and mobile number before sending. The browser cannot select a WhatsApp recipient for you.
                </p>
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={shareConsentConfirmed}
                    onChange={(event) => setShareConsentConfirmed(event.target.checked)}
                    className="mt-1"
                  />
                  <span>I verified this mobile number and confirmed the patient consents to receive this prescription through WhatsApp.</span>
                </label>

                {shareFallback && (
                  <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    <p>The PDF was downloaded because this browser cannot share file attachments directly. Open the patient&apos;s WhatsApp chat and attach the downloaded PDF.</p>
                    {getWhatsAppChatUrl(sharePatient.phone) ? (
                      <a
                        href={getWhatsAppChatUrl(sharePatient.phone) ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-700"
                      >
                        Open WhatsApp chat
                      </a>
                    ) : (
                      <p className="text-xs">Add the patient&apos;s country code to the mobile number to open a direct chat.</p>
                    )}
                  </div>
                )}
                {shareError && <p role="alert" className="text-sm text-red-600">{shareError}</p>}
              </div>
              <div className="flex justify-end gap-2 border-t px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShareRxId(null)}
                  className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSharePrescription}
                  disabled={!shareConsentConfirmed || isSharing || isPreparingShare || !shareQrDataUrl}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSharing ? "Opening share sheet..." : isPreparingShare ? "Preparing verified PDF..." : "Share e-Rx PDF"}
                </button>
              </div>
            </section>
          </div>
        )}

        {/* New Prescription Modal */}
        {showNewRxModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">New Prescription</h2>
                <button onClick={() => setShowNewRxModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Patient *</label>
                    <select className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                      {(patientRecords.length ? patientRecords : mockPatients).map((p) => <option key={p.id}>{p.name} ({p.uhid})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Doctor *</label>
                    <select className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                      <option>Dr. Priya Sharma - General Medicine</option>
                      <option>Dr. Rajesh Patel - Cardiology</option>
                      <option>Dr. Ananya Reddy - Dermatology</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Diagnosis</label>
                  <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Search ICD codes or diagnosis..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Add Medicines</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" placeholder="Search drug name..." />
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center text-sm text-slate-400">
                  <Pill className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  Search and add drugs above. For full prescribing workflow, use the <a href="/consultation" className="text-emerald-600 underline">Consultation page</a>.
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Advice</label>
                  <textarea className="w-full px-3 py-2 border rounded-lg text-sm resize-none" rows={2} placeholder="Patient advice..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Follow-up Date</label>
                  <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button onClick={() => setShowNewRxModal(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={() => { setShowNewRxModal(false); alert("Prescription created!"); }}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600">Create Prescription</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function PrescriptionVerificationQr({ prescriptionId }: { prescriptionId: string }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const generateQrCode = async () => {
      try {
        const { url, dataUrl } = await getPrescriptionVerificationQr(prescriptionId);

        if (active) {
          setVerificationUrl(url);
          setQrDataUrl(dataUrl);
          setError("");
        }
      } catch (generationError) {
        if (active) {
          setError(generationError instanceof Error ? generationError.message : "Could not create a verification QR.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void generateQrCode();
    return () => {
      active = false;
    };
  }, [prescriptionId]);

  const isLocalUrl = verificationUrl
    ? ["localhost", "127.0.0.1", "[::1]"].includes(new URL(verificationUrl).hostname)
    : false;

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-1">
        {qrDataUrl ? (
          <a href={verificationUrl} target="_blank" rel="noopener noreferrer" aria-label="Open prescription verification page">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Prescription verification QR code" className="h-full w-full" />
          </a>
        ) : isLoading ? (
          <QrCode className="h-8 w-8 animate-pulse text-slate-300" />
        ) : (
          <span className="px-1 text-center text-[9px] leading-tight text-red-600">QR unavailable</span>
        )}
      </div>
      <div className="max-w-36">
        <p className="text-[10px] font-medium text-slate-500">Scan for verification</p>
        {error && <p role="status" className="mt-1 text-[9px] leading-tight text-red-600">{error}</p>}
        {!error && isLocalUrl && (
          <p className="mt-1 text-[9px] leading-tight text-amber-700">Local-only. Set NEXT_PUBLIC_CLINICOS_BASE_URL for phone scanning.</p>
        )}
      </div>
    </div>
  );
}
