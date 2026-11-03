// ============================================================
// ClinicOS - Type Definitions
// ============================================================

// ---- Users & Auth ----
export type UserRole = "admin" | "doctor" | "receptionist" | "pharmacist" | "nurse" | "lab_tech";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  specialization?: string;
  registrationNo?: string;
  avatar?: string;
  isActive: boolean;
  centres: string[];
}

// ---- Patients ----
export interface Patient {
  id: string;
  uhid: string;
  abhaId?: string;
  name: string;
  phone: string;
  email?: string;
  gender: "Male" | "Female" | "Other";
  dob: string;
  age: number;
  bloodGroup?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  allergies: string[];
  chronicConditions: string[];
  insuranceInfo?: {
    provider: string;
    policyNo: string;
    validTill: string;
  };
  registeredAt: string;
  lastVisit?: string;
  totalVisits: number;
}

// ---- Appointments ----
export type AppointmentStatus = "scheduled" | "waiting" | "in-consultation" | "completed" | "cancelled" | "no-show";
export type AppointmentType = "walk-in" | "scheduled" | "follow-up" | "teleconsult";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientGender: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  timeSlot: string;
  type: AppointmentType;
  status: AppointmentStatus;
  tokenNumber?: string;
  chiefComplaint?: string;
  notes?: string;
  createdAt: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  appointmentId?: string;
}

// ---- OPD Queue ----
export interface QueueEntry {
  id: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  department: string;
  type: AppointmentType;
  status: "waiting" | "in-consultation" | "completed" | "skipped";
  priority: "normal" | "urgent" | "emergency";
  checkInTime: string;
  consultStartTime?: string;
  consultEndTime?: string;
  estimatedWaitMinutes: number;
  vitalsRecorded: boolean;
}

// ---- Vitals ----
export interface Vitals {
  id: string;
  patientId: string;
  encounterId: string;
  recordedAt: string;
  recordedBy: string;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  bloodSugar?: number;
  painScale?: number;
}

// ---- EMR / Encounters ----
export interface Encounter {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  department: string;
  type: "opd" | "follow-up" | "emergency" | "teleconsult";
  chiefComplaint: string;
  vitals?: Vitals;
  notes: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  diagnoses: Diagnosis[];
  prescriptions: PrescriptionItem[];
  labOrders: LabOrder[];
  procedures: string[];
  followUpDate?: string;
  attachments: string[];
  aiTranscript?: string;
  aiSoapNotes?: string;
  status: "in-progress" | "completed" | "signed";
}

export interface Diagnosis {
  id: string;
  icdCode: string;
  description: string;
  type: "primary" | "secondary" | "differential";
}

// ---- Prescriptions ----
export interface PrescriptionItem {
  id: string;
  drugName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions?: string;
  quantity: number;
  beforeAfterFood: "before" | "after" | "with" | "any";
}

export interface Prescription {
  id: string;
  prescriptionNo: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  encounterId: string;
  date: string;
  items: PrescriptionItem[];
  diagnoses: string[];
  advice: string;
  followUpDate?: string;
  status: "created" | "dispensed" | "partially-dispensed" | "cancelled";
  qrCode?: string;
}

// ---- Pharmacy & Inventory ----
export interface Drug {
  id: string;
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  dosageForm: "Tablet" | "Capsule" | "Syrup" | "Injection" | "Cream" | "Drops" | "Inhaler" | "Powder" | "Gel" | "Ointment";
  strength: string;
  hsnCode: string;
  schedule: "H" | "H1" | "X" | "G" | "OTC";
  mrp: number;
  purchasePrice: number;
  gstPercent: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  unit: string;
  rackLocation: string;
  isActive: boolean;
}

export interface InventoryBatch {
  id: string;
  drugId: string;
  batchNumber: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  manufacturingDate: string;
  expiryDate: string;
  supplierId: string;
  receivedDate: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstNo: string;
  drugLicenseNo: string;
  address: string;
  isActive: boolean;
}

export interface PurchaseOrder {
  id: string;
  orderNo: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: "draft" | "ordered" | "received" | "partial" | "cancelled";
  orderDate: string;
  expectedDate: string;
  receivedDate?: string;
}

export interface PurchaseOrderItem {
  drugId: string;
  drugName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity?: number;
}

// ---- Billing ----
export type PaymentMode = "cash" | "upi" | "card" | "insurance" | "online" | "cheque";
export type InvoiceStatus = "paid" | "pending" | "partial" | "overdue" | "cancelled" | "refunded";

export interface InvoiceItem {
  id: string;
  description: string;
  category: "consultation" | "procedure" | "lab" | "pharmacy" | "service" | "other";
  quantity: number;
  unitPrice: number;
  discount: number;
  gstPercent: number;
  gstAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  encounterId?: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  grandTotal: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
  payments: Payment[];
  notes?: string;
  centre: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  mode: PaymentMode;
  referenceNo?: string;
  date: string;
  receivedBy: string;
}

// ---- Lab ----
export interface LabOrder {
  id: string;
  testName: string;
  testCode: string;
  category: string;
  status: "ordered" | "sample-collected" | "processing" | "completed" | "cancelled";
  result?: string;
  normalRange?: string;
  unit?: string;
  orderedAt: string;
  completedAt?: string;
}

// ---- ABDM ----
export interface ABDMRecord {
  id: string;
  patientId: string;
  abhaNumber: string;
  abhaAddress: string;
  healthRecordType: string;
  consentId?: string;
  consentStatus: "requested" | "granted" | "denied" | "revoked" | "expired";
  linkedAt: string;
  lastSynced?: string;
}

// ---- Analytics ----
export interface AnalyticsMetric {
  label: string;
  value: number;
  change: number;
  changeType: "increase" | "decrease" | "neutral";
  period: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// ---- Centre / Multi-location ----
export interface Centre {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  gstNo: string;
  registrationNo: string;
  isActive: boolean;
}

// ---- Audit ----
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

