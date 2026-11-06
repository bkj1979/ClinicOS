import { jsPDF } from "jspdf";
import type { Patient, Prescription } from "@/lib/types";

export function createPrescriptionPdf(
  prescription: Prescription,
  patient: Patient,
  options: { autoPrint?: boolean; verificationQrDataUrl?: string } = {},
): File {
  const document = new jsPDF({ format: "a4", unit: "mm" });
  const margin = 16;
  const contentWidth = document.internal.pageSize.getWidth() - margin * 2;
  const pageBottom = document.internal.pageSize.getHeight() - margin;
  let y = margin;

  const ensureSpace = (height: number) => {
    if (y + height > pageBottom) {
      document.addPage();
      y = margin;
    }
  };

  const addText = (text: string, size = 10, style: "normal" | "bold" = "normal", gap = 2) => {
    if (!text) return;

    document.setFont("helvetica", style);
    document.setFontSize(size);
    const lines = document.splitTextToSize(text, contentWidth) as string[];
    const lineHeight = size * 0.45;
    ensureSpace(lines.length * lineHeight + gap);
    document.text(lines, margin, y);
    y += lines.length * lineHeight + gap;
  };

  const addSection = (title: string) => {
    ensureSpace(9);
    document.setFont("helvetica", "bold");
    document.setFontSize(11);
    document.text(title, margin, y);
    y += 6;
  };

  document.setProperties({
    title: `Prescription ${prescription.prescriptionNo}`,
    subject: `Prescription for ${patient.name}`,
    author: prescription.doctorName,
  });

  document.setTextColor(15, 118, 110);
  addText("ClinicOS - Koramangala", 16, "bold", 1);
  document.setTextColor(71, 85, 105);
  addText("No. 42, 80 Feet Road, Koramangala 4th Block, Bangalore - 560034", 9, "normal", 0);
  addText("Phone: 080-41234567", 9, "normal", 4);
  document.setDrawColor(16, 185, 129);
  document.setLineWidth(0.7);
  document.line(margin, y, margin + contentWidth, y);
  y += 7;

  document.setTextColor(15, 23, 42);
  addText("PRESCRIPTION / e-Rx", 14, "bold", 2);
  addText(`Prescription No: ${prescription.prescriptionNo}    Date: ${prescription.date}`, 10);
  addText(`Patient: ${patient.name}    Age/Gender: ${patient.age} / ${patient.gender}`, 10);
  addText(`UHID: ${patient.uhid}    Mobile: ${patient.phone}`, 10);
  if (patient.address) {
    const address = [patient.address.line1, patient.address.line2, patient.address.city, patient.address.state, patient.address.pincode]
      .filter(Boolean)
      .join(", ");
    addText(`Address: ${address}`, 9);
  }
  addText(`Prescriber: ${prescription.doctorName}`, 10);

  addSection("Diagnosis");
  addText(prescription.diagnoses.join(" | "), 10);

  addSection("Medicines");
  prescription.items.forEach((item, index) => {
    addText(`${index + 1}. ${item.drugName}${item.genericName ? ` (${item.genericName})` : ""}`, 10, "bold", 1);
    addText(
      `Dose: ${item.dosage} | Frequency: ${item.frequency} | Duration: ${item.duration} | Quantity: ${item.quantity} | Route: ${item.route}`,
      9,
      "normal",
      1
    );
    if (item.instructions) addText(`Instructions: ${item.instructions}`, 9, "normal", 2);
  });

  addSection("Advice");
  addText(prescription.advice, 10);
  if (prescription.followUpDate) {
    addSection("Follow-up");
    addText(prescription.followUpDate, 10);
  }

  if (options.verificationQrDataUrl) {
    ensureSpace(34);
    document.addImage(options.verificationQrDataUrl, "PNG", margin, y, 28, 28);
    document.setFont("helvetica", "normal");
    document.setFontSize(8);
    document.text("Scan for verification", margin + 32, y + 14);
    y += 32;
  }

  addSection("Prescriber");
  addText(prescription.doctorName, 10, "bold", 1);
  addText("The QR verifies this record against the clinic database. It does not replace a legally recognized prescriber signature.", 8);

  if (options.autoPrint) document.autoPrint({ variant: "non-conform" });

  const fileName = `${prescription.prescriptionNo.replace(/[^a-zA-Z0-9._-]/g, "-")}.pdf`;
  return new File([document.output("blob")], fileName, { type: "application/pdf" });
}
