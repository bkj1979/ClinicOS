// ============================================================
// ClinicOS — Comprehensive Mock Data
// ============================================================
import type { Patient, Appointment, QueueEntry, Drug, Invoice, Encounter, Prescription, Supplier, Centre, User } from "./types";

// ---- Centres ----
export const centres: Centre[] = [
  { id: "c1", name: "ClinicOS - Koramangala", code: "KOR", address: "No. 42, 80 Feet Road, Koramangala 4th Block, Bangalore - 560034", phone: "080-41234567", email: "koramangala@clinicos.in", gstNo: "29AABCC1234D1ZN", registrationNo: "KA/BLR/2024/0456", isActive: true },
  { id: "c2", name: "ClinicOS - Indiranagar", code: "IND", address: "No. 18, 12th Main, HAL 2nd Stage, Indiranagar, Bangalore - 560038", phone: "080-41234568", email: "indiranagar@clinicos.in", gstNo: "29AABCC1234D2ZM", registrationNo: "KA/BLR/2024/0789", isActive: true },
  { id: "c3", name: "ClinicOS - HSR Layout", code: "HSR", address: "No. 7, Sector 2, HSR Layout, Bangalore - 560102", phone: "080-41234569", email: "hsr@clinicos.in", gstNo: "29AABCC1234D3ZL", registrationNo: "KA/BLR/2024/1012", isActive: true },
];

// ---- Users / Staff ----
export const users: User[] = [
  { id: "u1", name: "Dr. Priya Sharma", email: "priya.sharma@clinicos.in", role: "doctor", phone: "9876543210", specialization: "General Medicine", registrationNo: "KMC-45678", isActive: true, centres: ["c1", "c2"] },
  { id: "u2", name: "Dr. Rajesh Patel", email: "rajesh.patel@clinicos.in", role: "doctor", phone: "9876543211", specialization: "Cardiology", registrationNo: "KMC-45679", isActive: true, centres: ["c1"] },
  { id: "u3", name: "Dr. Ananya Reddy", email: "ananya.reddy@clinicos.in", role: "doctor", phone: "9876543212", specialization: "Dermatology", registrationNo: "KMC-45680", isActive: true, centres: ["c1", "c3"] },
  { id: "u4", name: "Dr. Mohammed Irfan", email: "mohammed.irfan@clinicos.in", role: "doctor", phone: "9876543213", specialization: "Orthopedics", registrationNo: "KMC-45681", isActive: true, centres: ["c2"] },
  { id: "u5", name: "Dr. Kavitha Nair", email: "kavitha.nair@clinicos.in", role: "doctor", phone: "9876543214", specialization: "Pediatrics", registrationNo: "KMC-45682", isActive: true, centres: ["c3"] },
  { id: "u6", name: "Meera Joshi", email: "meera.joshi@clinicos.in", role: "receptionist", phone: "9876543215", isActive: true, centres: ["c1"] },
  { id: "u7", name: "Suresh Kumar", email: "suresh.kumar@clinicos.in", role: "pharmacist", phone: "9876543216", isActive: true, centres: ["c1"] },
  { id: "u8", name: "Lakshmi Devi", email: "lakshmi.devi@clinicos.in", role: "nurse", phone: "9876543217", isActive: true, centres: ["c1", "c2"] },
  { id: "u9", name: "Admin User", email: "admin@clinicos.in", role: "admin", phone: "9876543218", isActive: true, centres: ["c1", "c2", "c3"] },
];

// ---- Patients ----
export const patients: Patient[] = [
  { id: "p1", uhid: "COS100001", abhaId: "91-1234-5678-9012", name: "Arun Kumar Verma", phone: "9845012345", email: "arun.verma@gmail.com", gender: "Male", dob: "1985-03-15", age: 41, bloodGroup: "O+", address: { line1: "Flat 302, Prestige Shantiniketan", city: "Bangalore", state: "Karnataka", pincode: "560034" }, allergies: ["Penicillin"], chronicConditions: ["Type 2 Diabetes", "Hypertension"], registeredAt: "2024-01-15", lastVisit: "2026-10-28", totalVisits: 24 },
  { id: "p2", uhid: "COS100002", abhaId: "91-2345-6789-0123", name: "Sneha Gupta", phone: "9845012346", gender: "Female", dob: "1992-07-22", age: 34, bloodGroup: "A+", address: { line1: "No. 12, 3rd Cross, JP Nagar", city: "Bangalore", state: "Karnataka", pincode: "560078" }, allergies: [], chronicConditions: [], registeredAt: "2024-03-10", lastVisit: "2026-10-30", totalVisits: 8 },
  { id: "p3", uhid: "COS100003", name: "Ravi Shankar Iyer", phone: "9845012347", gender: "Male", dob: "1978-11-05", age: 48, bloodGroup: "B+", address: { line1: "45, 1st Main, Jayanagar 4th Block", city: "Bangalore", state: "Karnataka", pincode: "560041" }, allergies: ["Sulfa drugs", "Aspirin"], chronicConditions: ["Chronic Kidney Disease Stage 3"], registeredAt: "2023-11-20", lastVisit: "2026-10-29", totalVisits: 32 },
  { id: "p4", uhid: "COS100004", abhaId: "91-3456-7890-1234", name: "Fatima Begum", phone: "9845012348", gender: "Female", dob: "1965-02-14", age: 61, bloodGroup: "AB+", address: { line1: "Flat 101, Al-Ameen Residency, Wilson Garden", city: "Bangalore", state: "Karnataka", pincode: "560027" }, allergies: ["Ibuprofen"], chronicConditions: ["Rheumatoid Arthritis", "Osteoporosis"], registeredAt: "2024-06-05", lastVisit: "2026-10-27", totalVisits: 15 },
  { id: "p5", uhid: "COS100005", name: "Deepak Hegde", phone: "9845012349", gender: "Male", dob: "1990-09-30", age: 36, bloodGroup: "O-", address: { line1: "23, 5th Cross, Malleshwaram", city: "Bangalore", state: "Karnataka", pincode: "560003" }, allergies: [], chronicConditions: [], registeredAt: "2025-01-12", lastVisit: "2026-10-31", totalVisits: 5 },
  { id: "p6", uhid: "COS100006", name: "Anjali Menon", phone: "9845012350", gender: "Female", dob: "1988-04-18", age: 38, bloodGroup: "A-", address: { line1: "Flat 504, Brigade Metropolis, Whitefield", city: "Bangalore", state: "Karnataka", pincode: "560066" }, allergies: ["Codeine"], chronicConditions: ["Hypothyroidism"], registeredAt: "2024-09-25", lastVisit: "2026-10-30", totalVisits: 11 },
  { id: "p7", uhid: "COS100007", name: "Sunil Deshmukh", phone: "9845012351", gender: "Male", dob: "1972-12-08", age: 53, bloodGroup: "B-", address: { line1: "102, Palm Meadows, Ramagondanahalli", city: "Bangalore", state: "Karnataka", pincode: "560066" }, allergies: [], chronicConditions: ["COPD", "Hypertension"], registeredAt: "2024-02-14", lastVisit: "2026-10-26", totalVisits: 18 },
  { id: "p8", uhid: "COS100008", name: "Priya Ramachandran", phone: "9845012352", gender: "Female", dob: "1995-06-25", age: 31, bloodGroup: "O+", address: { line1: "No. 8, Richmond Road", city: "Bangalore", state: "Karnataka", pincode: "560025" }, allergies: [], chronicConditions: [], registeredAt: "2025-07-01", lastVisit: "2026-10-31", totalVisits: 3 },
  { id: "p9", uhid: "COS100009", name: "Karthik Narayanan", phone: "9845012353", gender: "Male", dob: "1982-01-20", age: 44, bloodGroup: "A+", address: { line1: "Villa 15, Adarsh Palm Retreat, Bellandur", city: "Bangalore", state: "Karnataka", pincode: "560103" }, allergies: ["Metformin"], chronicConditions: ["Type 2 Diabetes"], registeredAt: "2024-04-18", lastVisit: "2026-10-29", totalVisits: 14 },
  { id: "p10", uhid: "COS100010", name: "Lakshmi Venkatesh", phone: "9845012354", gender: "Female", dob: "1958-08-12", age: 68, bloodGroup: "AB-", address: { line1: "3rd Floor, Mantri Elegance, Banashankari", city: "Bangalore", state: "Karnataka", pincode: "560070" }, allergies: ["Tramadol", "Erythromycin"], chronicConditions: ["Atrial Fibrillation", "Hypertension", "Type 2 Diabetes"], registeredAt: "2023-10-30", lastVisit: "2026-10-31", totalVisits: 42 },
  { id: "p11", uhid: "COS100011", name: "Vikram Singh", phone: "9845012355", gender: "Male", dob: "2019-03-14", age: 7, bloodGroup: "B+", address: { line1: "Flat 201, Sobha Dream Acres, Panathur", city: "Bangalore", state: "Karnataka", pincode: "560103" }, allergies: [], chronicConditions: [], registeredAt: "2025-02-28", lastVisit: "2026-10-25", totalVisits: 6 },
  { id: "p12", uhid: "COS100012", name: "Nandini Kulkarni", phone: "9845012356", gender: "Female", dob: "1997-11-03", age: 29, bloodGroup: "O+", address: { line1: "22, 2nd Main, Koramangala 6th Block", city: "Bangalore", state: "Karnataka", pincode: "560095" }, allergies: [], chronicConditions: ["PCOS"], registeredAt: "2025-05-12", lastVisit: "2026-10-30", totalVisits: 7 },
];

// ---- Appointments (today's) ----
const today = new Date().toISOString().split("T")[0];
export const appointments: Appointment[] = [
  { id: "a1", patientId: "p1", patientName: "Arun Kumar Verma", patientPhone: "9845012345", patientAge: 41, patientGender: "Male", doctorId: "u1", doctorName: "Dr. Priya Sharma", department: "General Medicine", date: today, timeSlot: "09:00 AM", type: "scheduled", status: "completed", tokenNumber: "T001", chiefComplaint: "Follow-up for diabetes management", createdAt: "2026-10-28" },
  { id: "a2", patientId: "p2", patientName: "Sneha Gupta", patientPhone: "9845012346", patientAge: 34, patientGender: "Female", doctorId: "u1", doctorName: "Dr. Priya Sharma", department: "General Medicine", date: today, timeSlot: "09:15 AM", type: "scheduled", status: "completed", tokenNumber: "T002", chiefComplaint: "Persistent cough and cold for 5 days", createdAt: "2026-10-29" },
  { id: "a3", patientId: "p3", patientName: "Ravi Shankar Iyer", patientPhone: "9845012347", patientAge: 48, patientGender: "Male", doctorId: "u2", doctorName: "Dr. Rajesh Patel", department: "Cardiology", date: today, timeSlot: "09:30 AM", type: "scheduled", status: "completed", tokenNumber: "T003", chiefComplaint: "Chest pain on exertion", createdAt: "2026-10-27" },
  { id: "a4", patientId: "p4", patientName: "Fatima Begum", patientPhone: "9845012348", patientAge: 61, patientGender: "Female", doctorId: "u4", doctorName: "Dr. Mohammed Irfan", department: "Orthopedics", date: today, timeSlot: "10:00 AM", type: "follow-up", status: "in-consultation", tokenNumber: "T004", chiefComplaint: "Knee pain - follow-up after physiotherapy", createdAt: "2026-10-25" },
  { id: "a5", patientId: "p5", patientName: "Deepak Hegde", patientPhone: "9845012349", patientAge: 36, patientGender: "Male", doctorId: "u3", doctorName: "Dr. Ananya Reddy", department: "Dermatology", date: today, timeSlot: "10:15 AM", type: "scheduled", status: "waiting", tokenNumber: "T005", chiefComplaint: "Recurring skin rash on arms", createdAt: "2026-10-30" },
  { id: "a6", patientId: "p6", patientName: "Anjali Menon", patientPhone: "9845012350", patientAge: 38, patientGender: "Female", doctorId: "u1", doctorName: "Dr. Priya Sharma", department: "General Medicine", date: today, timeSlot: "10:30 AM", type: "walk-in", status: "waiting", tokenNumber: "T006", chiefComplaint: "Thyroid check-up and fatigue", createdAt: today },
  { id: "a7", patientId: "p7", patientName: "Sunil Deshmukh", patientPhone: "9845012351", patientAge: 53, patientGender: "Male", doctorId: "u2", doctorName: "Dr. Rajesh Patel", department: "Cardiology", date: today, timeSlot: "10:45 AM", type: "scheduled", status: "waiting", tokenNumber: "T007", chiefComplaint: "Blood pressure monitoring", createdAt: "2026-10-28" },
  { id: "a8", patientId: "p8", patientName: "Priya Ramachandran", patientPhone: "9845012352", patientAge: 31, patientGender: "Female", doctorId: "u3", doctorName: "Dr. Ananya Reddy", department: "Dermatology", date: today, timeSlot: "11:00 AM", type: "scheduled", status: "scheduled", tokenNumber: "T008", chiefComplaint: "Acne treatment follow-up", createdAt: "2026-10-29" },
  { id: "a9", patientId: "p9", patientName: "Karthik Narayanan", patientPhone: "9845012353", patientAge: 44, patientGender: "Male", doctorId: "u1", doctorName: "Dr. Priya Sharma", department: "General Medicine", date: today, timeSlot: "11:15 AM", type: "follow-up", status: "scheduled", tokenNumber: "T009", chiefComplaint: "Diabetes medication review", createdAt: "2026-10-27" },
  { id: "a10", patientId: "p10", patientName: "Lakshmi Venkatesh", patientPhone: "9845012354", patientAge: 68, patientGender: "Female", doctorId: "u2", doctorName: "Dr. Rajesh Patel", department: "Cardiology", date: today, timeSlot: "11:30 AM", type: "scheduled", status: "scheduled", tokenNumber: "T010", chiefComplaint: "Atrial fibrillation - routine check", createdAt: "2026-10-26" },
  { id: "a11", patientId: "p11", patientName: "Vikram Singh", patientPhone: "9845012355", patientAge: 7, patientGender: "Male", doctorId: "u5", doctorName: "Dr. Kavitha Nair", department: "Pediatrics", date: today, timeSlot: "11:45 AM", type: "scheduled", status: "scheduled", tokenNumber: "T011", chiefComplaint: "Vaccination - DPT booster", createdAt: "2026-10-30" },
  { id: "a12", patientId: "p12", patientName: "Nandini Kulkarni", patientPhone: "9845012356", patientAge: 29, patientGender: "Female", doctorId: "u1", doctorName: "Dr. Priya Sharma", department: "General Medicine", date: today, timeSlot: "12:00 PM", type: "walk-in", status: "scheduled", tokenNumber: "T012", chiefComplaint: "Irregular periods and weight gain", createdAt: today },
];

// ---- OPD Queue ----
export const opdQueue: QueueEntry[] = [
  { id: "q1", tokenNumber: "T004", patientId: "p4", patientName: "Fatima Begum", patientAge: 61, patientGender: "Female", appointmentId: "a4", doctorId: "u4", doctorName: "Dr. Mohammed Irfan", department: "Orthopedics", type: "follow-up", status: "in-consultation", priority: "normal", checkInTime: "2026-10-31T09:45:00", consultStartTime: "2026-10-31T10:02:00", estimatedWaitMinutes: 0, vitalsRecorded: true },
  { id: "q2", tokenNumber: "T005", patientId: "p5", patientName: "Deepak Hegde", patientAge: 36, patientGender: "Male", appointmentId: "a5", doctorId: "u3", doctorName: "Dr. Ananya Reddy", department: "Dermatology", type: "scheduled", status: "waiting", priority: "normal", checkInTime: "2026-10-31T10:00:00", estimatedWaitMinutes: 5, vitalsRecorded: true },
  { id: "q3", tokenNumber: "T006", patientId: "p6", patientName: "Anjali Menon", patientAge: 38, patientGender: "Female", appointmentId: "a6", doctorId: "u1", doctorName: "Dr. Priya Sharma", department: "General Medicine", type: "walk-in", status: "waiting", priority: "normal", checkInTime: "2026-10-31T10:20:00", estimatedWaitMinutes: 12, vitalsRecorded: true },
  { id: "q4", tokenNumber: "T007", patientId: "p7", patientName: "Sunil Deshmukh", patientAge: 53, patientGender: "Male", appointmentId: "a7", doctorId: "u2", doctorName: "Dr. Rajesh Patel", department: "Cardiology", type: "scheduled", status: "waiting", priority: "urgent", checkInTime: "2026-10-31T10:30:00", estimatedWaitMinutes: 8, vitalsRecorded: false },
];

// ---- Drugs / Inventory ----
export const drugs: Drug[] = [
  { id: "d1", name: "Metformin 500mg", genericName: "Metformin Hydrochloride", category: "Anti-diabetic", manufacturer: "USV Pvt Ltd", dosageForm: "Tablet", strength: "500mg", hsnCode: "30049099", schedule: "H", mrp: 45, purchasePrice: 28, gstPercent: 12, currentStock: 2500, minStock: 500, maxStock: 5000, reorderLevel: 800, unit: "Strip of 10", rackLocation: "A1-01", isActive: true },
  { id: "d2", name: "Amlodipine 5mg", genericName: "Amlodipine Besylate", category: "Anti-hypertensive", manufacturer: "Cipla Ltd", dosageForm: "Tablet", strength: "5mg", hsnCode: "30049099", schedule: "H", mrp: 52, purchasePrice: 32, gstPercent: 12, currentStock: 1800, minStock: 400, maxStock: 4000, reorderLevel: 600, unit: "Strip of 10", rackLocation: "A1-02", isActive: true },
  { id: "d3", name: "Azithromycin 500mg", genericName: "Azithromycin", category: "Antibiotic", manufacturer: "Alkem Labs", dosageForm: "Tablet", strength: "500mg", hsnCode: "30049099", schedule: "H1", mrp: 95, purchasePrice: 58, gstPercent: 12, currentStock: 320, minStock: 200, maxStock: 2000, reorderLevel: 350, unit: "Strip of 3", rackLocation: "A2-01", isActive: true },
  { id: "d4", name: "Pantoprazole 40mg", genericName: "Pantoprazole Sodium", category: "Antacid / PPI", manufacturer: "Sun Pharma", dosageForm: "Tablet", strength: "40mg", hsnCode: "30049099", schedule: "H", mrp: 68, purchasePrice: 42, gstPercent: 12, currentStock: 1400, minStock: 300, maxStock: 3000, reorderLevel: 500, unit: "Strip of 10", rackLocation: "A2-03", isActive: true },
  { id: "d5", name: "Paracetamol 650mg", genericName: "Paracetamol", category: "Analgesic / Antipyretic", manufacturer: "GSK Pharma", dosageForm: "Tablet", strength: "650mg", hsnCode: "30049099", schedule: "OTC", mrp: 35, purchasePrice: 18, gstPercent: 12, currentStock: 4200, minStock: 1000, maxStock: 8000, reorderLevel: 1500, unit: "Strip of 15", rackLocation: "B1-01", isActive: true },
  { id: "d6", name: "Cetirizine 10mg", genericName: "Cetirizine Hydrochloride", category: "Anti-allergic", manufacturer: "Dr Reddy's", dosageForm: "Tablet", strength: "10mg", hsnCode: "30049099", schedule: "OTC", mrp: 30, purchasePrice: 15, gstPercent: 12, currentStock: 3200, minStock: 500, maxStock: 6000, reorderLevel: 800, unit: "Strip of 10", rackLocation: "B1-02", isActive: true },
  { id: "d7", name: "Amoxicillin 500mg", genericName: "Amoxicillin Trihydrate", category: "Antibiotic", manufacturer: "Mankind Pharma", dosageForm: "Capsule", strength: "500mg", hsnCode: "30049099", schedule: "H1", mrp: 85, purchasePrice: 52, gstPercent: 12, currentStock: 180, minStock: 200, maxStock: 2000, reorderLevel: 300, unit: "Strip of 10", rackLocation: "A2-02", isActive: true },
  { id: "d8", name: "Atorvastatin 10mg", genericName: "Atorvastatin Calcium", category: "Lipid-lowering", manufacturer: "Zydus Cadila", dosageForm: "Tablet", strength: "10mg", hsnCode: "30049099", schedule: "H", mrp: 72, purchasePrice: 44, gstPercent: 12, currentStock: 950, minStock: 200, maxStock: 2500, reorderLevel: 400, unit: "Strip of 10", rackLocation: "A3-01", isActive: true },
  { id: "d9", name: "Insulin Glargine 100IU/ml", genericName: "Insulin Glargine", category: "Anti-diabetic", manufacturer: "Sanofi India", dosageForm: "Injection", strength: "100IU/ml", hsnCode: "30049039", schedule: "H", mrp: 1450, purchasePrice: 1100, gstPercent: 5, currentStock: 45, minStock: 20, maxStock: 100, reorderLevel: 30, unit: "Vial 10ml", rackLocation: "C1-01", isActive: true },
  { id: "d10", name: "Salbutamol 100mcg Inhaler", genericName: "Salbutamol Sulphate", category: "Bronchodilator", manufacturer: "Cipla Ltd", dosageForm: "Inhaler", strength: "100mcg/puff", hsnCode: "30049099", schedule: "H", mrp: 145, purchasePrice: 95, gstPercent: 12, currentStock: 85, minStock: 30, maxStock: 200, reorderLevel: 50, unit: "Inhaler 200 doses", rackLocation: "C2-01", isActive: true },
  { id: "d11", name: "Betamethasone Cream 0.1%", genericName: "Betamethasone Valerate", category: "Corticosteroid (Topical)", manufacturer: "Glenmark", dosageForm: "Cream", strength: "0.1% w/w", hsnCode: "30049099", schedule: "H", mrp: 120, purchasePrice: 75, gstPercent: 12, currentStock: 65, minStock: 30, maxStock: 200, reorderLevel: 40, unit: "Tube 20g", rackLocation: "D1-01", isActive: true },
  { id: "d12", name: "ORS Powder", genericName: "Oral Rehydration Salts", category: "Rehydration", manufacturer: "FDC Ltd", dosageForm: "Powder", strength: "21.8g", hsnCode: "30049099", schedule: "OTC", mrp: 22, purchasePrice: 12, gstPercent: 5, currentStock: 5500, minStock: 500, maxStock: 10000, reorderLevel: 1000, unit: "Sachet", rackLocation: "B2-01", isActive: true },
];

// ---- Suppliers ----
export const suppliers: Supplier[] = [
  { id: "s1", name: "MedSupply India Pvt Ltd", contactPerson: "Ramesh Agarwal", phone: "9988776655", email: "orders@medsupply.in", gstNo: "29AABCM7654D1ZP", drugLicenseNo: "KA/20B/2020/1234", address: "No. 45, Peenya Industrial Area, Bangalore", isActive: true },
  { id: "s2", name: "PharmaDirect Solutions", contactPerson: "Sunita Reddy", phone: "9988776656", email: "procurement@pharmadirect.in", gstNo: "29AABCP4567E2ZQ", drugLicenseNo: "KA/21B/2021/5678", address: "Plot 12, Electronic City Phase 1, Bangalore", isActive: true },
  { id: "s3", name: "HealthWholesale Corp", contactPerson: "Dinesh Shah", phone: "9988776657", email: "bulk@healthwholesale.co.in", gstNo: "29AABCH8901F3ZR", drugLicenseNo: "KA/20B/2019/9012", address: "Bommasandra Industrial Area, Bangalore", isActive: true },
];

// ---- Invoices ----
export const invoices: Invoice[] = [
  {
    id: "inv1", invoiceNo: "INV-2610-1001", patientId: "p1", patientName: "Arun Kumar Verma", patientPhone: "9845012345", encounterId: "e1", date: today,
    items: [
      { id: "ii1", description: "Consultation - General Medicine", category: "consultation", quantity: 1, unitPrice: 800, discount: 0, gstPercent: 0, gstAmount: 0, totalAmount: 800 },
      { id: "ii2", description: "HbA1c Test", category: "lab", quantity: 1, unitPrice: 450, discount: 0, gstPercent: 0, gstAmount: 0, totalAmount: 450 },
      { id: "ii3", description: "Metformin 500mg x 3 strips", category: "pharmacy", quantity: 3, unitPrice: 45, discount: 5, gstPercent: 12, gstAmount: 14, totalAmount: 142 },
    ],
    subtotal: 1392, totalDiscount: 5, totalGst: 14, grandTotal: 1392, amountPaid: 1392, balance: 0, status: "paid",
    payments: [{ id: "pay1", invoiceId: "inv1", amount: 1392, mode: "upi", referenceNo: "UPI-TXN-98765", date: today, receivedBy: "Meera Joshi" }],
    centre: "ClinicOS - Koramangala"
  },
  {
    id: "inv2", invoiceNo: "INV-2610-1002", patientId: "p3", patientName: "Ravi Shankar Iyer", patientPhone: "9845012347", encounterId: "e2", date: today,
    items: [
      { id: "ii4", description: "Consultation - Cardiology", category: "consultation", quantity: 1, unitPrice: 1200, discount: 0, gstPercent: 0, gstAmount: 0, totalAmount: 1200 },
      { id: "ii5", description: "ECG", category: "procedure", quantity: 1, unitPrice: 350, discount: 0, gstPercent: 0, gstAmount: 0, totalAmount: 350 },
      { id: "ii6", description: "2D Echocardiography", category: "procedure", quantity: 1, unitPrice: 2500, discount: 200, gstPercent: 0, gstAmount: 0, totalAmount: 2300 },
      { id: "ii7", description: "Lipid Profile", category: "lab", quantity: 1, unitPrice: 600, discount: 0, gstPercent: 0, gstAmount: 0, totalAmount: 600 },
    ],
    subtotal: 4450, totalDiscount: 200, totalGst: 0, grandTotal: 4450, amountPaid: 2500, balance: 1950, status: "partial",
    payments: [{ id: "pay2", invoiceId: "inv2", amount: 2500, mode: "card", referenceNo: "CARD-TXN-45678", date: today, receivedBy: "Meera Joshi" }],
    centre: "ClinicOS - Koramangala"
  },
  {
    id: "inv3", invoiceNo: "INV-2610-1003", patientId: "p5", patientName: "Deepak Hegde", patientPhone: "9845012349", date: today,
    items: [
      { id: "ii8", description: "Consultation - Dermatology", category: "consultation", quantity: 1, unitPrice: 1000, discount: 0, gstPercent: 0, gstAmount: 0, totalAmount: 1000 },
      { id: "ii9", description: "Skin Biopsy", category: "procedure", quantity: 1, unitPrice: 1500, discount: 0, gstPercent: 0, gstAmount: 0, totalAmount: 1500 },
    ],
    subtotal: 2500, totalDiscount: 0, totalGst: 0, grandTotal: 2500, amountPaid: 0, balance: 2500, status: "pending",
    payments: [],
    centre: "ClinicOS - Koramangala"
  },
];

// ---- Encounters / EMR ----
export const encounters: Encounter[] = [
  {
    id: "e1", patientId: "p1", patientName: "Arun Kumar Verma", doctorId: "u1", doctorName: "Dr. Priya Sharma",
    date: today, department: "General Medicine", type: "follow-up", chiefComplaint: "Follow-up for diabetes management, reports fatigue and occasional blurry vision",
    vitals: { id: "v1", patientId: "p1", encounterId: "e1", recordedAt: today, recordedBy: "Lakshmi Devi", temperature: 98.2, bloodPressureSystolic: 138, bloodPressureDiastolic: 88, heartRate: 78, respiratoryRate: 16, oxygenSaturation: 98, weight: 82, height: 172, bmi: 27.7, bloodSugar: 186, painScale: 1 },
    notes: {
      subjective: "Patient reports persistent fatigue for 2 weeks. Occasional blurred vision, especially in the evening. Compliance with Metformin 500mg BD is good. Diet control has been poor - admits to frequent sweets consumption. No polyuria or polydipsia. Sleep is adequate.",
      objective: "General appearance: Well-nourished, alert. BP: 138/88 mmHg (slightly elevated). FBS: 186 mg/dL (elevated). HbA1c: 7.8% (above target). BMI: 27.7 (overweight). Fundoscopy: No diabetic retinopathy changes. Pedal pulses: Present bilaterally. Sensation: Intact in extremities.",
      assessment: "Type 2 Diabetes Mellitus - suboptimal control. Pre-hypertension. Obesity Grade 1. The fatigue and blurry vision are likely related to hyperglycemia.",
      plan: "1. Increase Metformin to 1000mg BD\n2. Add Glimepiride 1mg OD before breakfast\n3. Strict dietary counseling - refer to nutritionist\n4. Home BP monitoring twice daily\n5. Review HbA1c in 3 months\n6. Ophthalmology referral for annual diabetic eye screening\n7. Foot care education\n8. Follow-up in 4 weeks"
    },
    diagnoses: [
      { id: "dg1", icdCode: "E11.65", description: "Type 2 diabetes mellitus with hyperglycemia", type: "primary" },
      { id: "dg2", icdCode: "R53.83", description: "Other fatigue", type: "secondary" },
      { id: "dg3", icdCode: "E66.01", description: "Morbid obesity due to excess calories", type: "secondary" },
    ],
    prescriptions: [
      { id: "rx1", drugName: "Metformin 1000mg", genericName: "Metformin HCl", dosage: "1000mg", frequency: "Twice daily", duration: "30 days", route: "Oral", instructions: "Take with meals", quantity: 60, beforeAfterFood: "with" },
      { id: "rx2", drugName: "Glimepiride 1mg", genericName: "Glimepiride", dosage: "1mg", frequency: "Once daily", duration: "30 days", route: "Oral", instructions: "Take 15-30 minutes before breakfast", quantity: 30, beforeAfterFood: "before" },
      { id: "rx3", drugName: "Amlodipine 5mg", genericName: "Amlodipine Besylate", dosage: "5mg", frequency: "Once daily", duration: "30 days", route: "Oral", instructions: "Take at bedtime", quantity: 30, beforeAfterFood: "any" },
    ],
    labOrders: [
      { id: "lo1", testName: "HbA1c", testCode: "HBA1C", category: "Biochemistry", status: "completed", result: "7.8%", normalRange: "4.0 - 5.6%", unit: "%", orderedAt: today, completedAt: today },
      { id: "lo2", testName: "Fasting Blood Sugar", testCode: "FBS", category: "Biochemistry", status: "completed", result: "186", normalRange: "70 - 100", unit: "mg/dL", orderedAt: today, completedAt: today },
      { id: "lo3", testName: "Lipid Profile", testCode: "LIPID", category: "Biochemistry", status: "ordered", orderedAt: today },
      { id: "lo4", testName: "Serum Creatinine", testCode: "SCREAT", category: "Biochemistry", status: "ordered", orderedAt: today },
    ],
    procedures: [],
    followUpDate: "2026-11-28",
    attachments: [],
    status: "completed"
  },
  {
    id: "e2", patientId: "p3", patientName: "Ravi Shankar Iyer", doctorId: "u2", doctorName: "Dr. Rajesh Patel",
    date: today, department: "Cardiology", type: "opd", chiefComplaint: "Chest pain on exertion for 1 week",
    vitals: { id: "v2", patientId: "p3", encounterId: "e2", recordedAt: today, recordedBy: "Lakshmi Devi", temperature: 98.6, bloodPressureSystolic: 152, bloodPressureDiastolic: 94, heartRate: 88, respiratoryRate: 18, oxygenSaturation: 97, weight: 78, height: 168, bmi: 27.6, painScale: 4 },
    notes: {
      subjective: "Patient presents with exertional chest pain for 1 week. Pain is retrosternal, pressure-like, radiates to left arm. Occurs during moderate exertion (climbing 2 flights of stairs). Relieved by rest in 5-10 minutes. No associated diaphoresis, nausea, or dyspnea at rest. History of CKD Stage 3. Non-smoker. Family history: Father had MI at age 55.",
      objective: "BP: 152/94 mmHg. HR: 88 bpm, regular. JVP: Normal. Heart sounds: S1S2 heard, no murmurs. Lungs: Clear bilateral. ECG: Normal sinus rhythm, no ST-T changes at rest. Peripheral edema: Absent.",
      assessment: "Suspected stable angina pectoris. Uncontrolled hypertension. High cardiovascular risk profile given CKD Stage 3 and family history.",
      plan: "1. 2D Echo today to assess LV function\n2. TMT (Treadmill Test) after 2D Echo review\n3. Start Atorvastatin 20mg HS\n4. Continue current antihypertensives, add Telmisartan 40mg\n5. Tab Aspirin 75mg OD\n6. Tab Nitroglycerin SL PRN for acute chest pain\n7. Lipid profile, Renal function tests\n8. Review with reports in 1 week\n9. If TMT positive, plan for coronary angiography"
    },
    diagnoses: [
      { id: "dg4", icdCode: "I20.8", description: "Other forms of angina pectoris", type: "primary" },
      { id: "dg5", icdCode: "I10", description: "Essential (primary) hypertension", type: "secondary" },
      { id: "dg6", icdCode: "N18.3", description: "Chronic kidney disease, stage 3", type: "secondary" },
    ],
    prescriptions: [
      { id: "rx4", drugName: "Atorvastatin 20mg", genericName: "Atorvastatin Calcium", dosage: "20mg", frequency: "Once daily", duration: "30 days", route: "Oral", instructions: "Take at bedtime", quantity: 30, beforeAfterFood: "after" },
      { id: "rx5", drugName: "Telmisartan 40mg", genericName: "Telmisartan", dosage: "40mg", frequency: "Once daily", duration: "30 days", route: "Oral", instructions: "Take in the morning", quantity: 30, beforeAfterFood: "before" },
      { id: "rx6", drugName: "Aspirin 75mg", genericName: "Acetylsalicylic Acid", dosage: "75mg", frequency: "Once daily", duration: "30 days", route: "Oral", instructions: "Take after lunch", quantity: 30, beforeAfterFood: "after" },
      { id: "rx7", drugName: "Nitroglycerin 0.5mg SL", genericName: "Glyceryl Trinitrate", dosage: "0.5mg", frequency: "As needed", duration: "PRN", route: "Sublingual", instructions: "Place under tongue during chest pain. May repeat once after 5 min. If no relief, call emergency.", quantity: 10, beforeAfterFood: "any" },
    ],
    labOrders: [
      { id: "lo5", testName: "Lipid Profile", testCode: "LIPID", category: "Biochemistry", status: "sample-collected", orderedAt: today },
      { id: "lo6", testName: "Serum Creatinine", testCode: "SCREAT", category: "Biochemistry", status: "sample-collected", orderedAt: today },
      { id: "lo7", testName: "Troponin I", testCode: "TROPI", category: "Biochemistry", status: "processing", orderedAt: today },
    ],
    procedures: ["ECG - 12 Lead", "2D Echocardiography"],
    followUpDate: "2026-11-07",
    attachments: [],
    status: "completed"
  },
];

// ---- Prescriptions ----
export const prescriptions: Prescription[] = [
  {
    id: "prx1", prescriptionNo: "RX-2610-001", patientId: "p1", patientName: "Arun Kumar Verma", doctorId: "u1", doctorName: "Dr. Priya Sharma", encounterId: "e1", date: today,
    items: encounters[0].prescriptions, diagnoses: ["Type 2 diabetes mellitus with hyperglycemia", "Other fatigue"], advice: "Strict dietary control. Avoid sweets and refined carbs. Walk 30 mins daily. Monitor blood sugar at home. Annual eye checkup.", followUpDate: "2026-11-28", status: "dispensed"
  },
  {
    id: "prx2", prescriptionNo: "RX-2610-002", patientId: "p3", patientName: "Ravi Shankar Iyer", doctorId: "u2", doctorName: "Dr. Rajesh Patel", encounterId: "e2", date: today,
    items: encounters[1].prescriptions, diagnoses: ["Angina pectoris", "Hypertension", "CKD Stage 3"], advice: "Avoid heavy exertion until review. Keep SL Nitroglycerin accessible at all times. Low salt diet. Report immediately if chest pain at rest or lasting >15 min.", followUpDate: "2026-11-07", status: "created"
  },
];

// ---- Analytics Data ----
export const revenueByMonth = [
  { name: "May", revenue: 485000, patients: 320, consultations: 280 },
  { name: "Jun", revenue: 520000, patients: 345, consultations: 310 },
  { name: "Jul", revenue: 498000, patients: 330, consultations: 295 },
  { name: "Aug", revenue: 612000, patients: 410, consultations: 370 },
  { name: "Sep", revenue: 580000, patients: 395, consultations: 355 },
  { name: "Oct", revenue: 645000, patients: 428, consultations: 390 },
];

export const departmentRevenue = [
  { name: "General Medicine", value: 245000, patients: 180 },
  { name: "Cardiology", value: 185000, patients: 95 },
  { name: "Dermatology", value: 125000, patients: 88 },
  { name: "Orthopedics", value: 110000, patients: 72 },
  { name: "Pediatrics", value: 85000, patients: 65 },
];

export const patientDemographics = [
  { name: "0-18", male: 45, female: 38 },
  { name: "19-35", male: 82, female: 95 },
  { name: "36-50", male: 110, female: 98 },
  { name: "51-65", male: 75, female: 88 },
  { name: "65+", male: 42, female: 55 },
];

export const topDiagnoses = [
  { name: "Type 2 Diabetes", count: 85, percentage: 19.8 },
  { name: "Hypertension", count: 72, percentage: 16.8 },
  { name: "Upper Respiratory Infection", count: 58, percentage: 13.5 },
  { name: "Allergic Rhinitis", count: 45, percentage: 10.5 },
  { name: "Osteoarthritis", count: 38, percentage: 8.9 },
  { name: "Dermatitis", count: 32, percentage: 7.5 },
  { name: "Hypothyroidism", count: 28, percentage: 6.5 },
  { name: "GERD", count: 25, percentage: 5.8 },
];

export const centreComparison = [
  { name: "Koramangala", revenue: 645000, patients: 428, satisfaction: 4.6, avgWaitTime: 12 },
  { name: "Indiranagar", revenue: 520000, patients: 350, satisfaction: 4.4, avgWaitTime: 18 },
  { name: "HSR Layout", revenue: 380000, patients: 265, satisfaction: 4.7, avgWaitTime: 8 },
];

export const dailyPatientFlow = [
  { hour: "8 AM", walkin: 2, scheduled: 5 },
  { hour: "9 AM", walkin: 5, scheduled: 12 },
  { hour: "10 AM", walkin: 8, scheduled: 15 },
  { hour: "11 AM", walkin: 6, scheduled: 14 },
  { hour: "12 PM", walkin: 4, scheduled: 8 },
  { hour: "1 PM", walkin: 1, scheduled: 2 },
  { hour: "2 PM", walkin: 3, scheduled: 6 },
  { hour: "3 PM", walkin: 5, scheduled: 10 },
  { hour: "4 PM", walkin: 7, scheduled: 12 },
  { hour: "5 PM", walkin: 6, scheduled: 10 },
  { hour: "6 PM", walkin: 4, scheduled: 8 },
  { hour: "7 PM", walkin: 2, scheduled: 4 },
];
