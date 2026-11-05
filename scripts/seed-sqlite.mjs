import { mkdir, readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const mockData = await import("../src/lib/mock-data.ts");
const databasePath = fileURLToPath(new URL("../prisma/clinic-os.db", import.meta.url));
const schemaPath = new URL("../prisma/schema.sql", import.meta.url);

const collections = [
  {
    table: "centres",
    records: mockData.centres,
    fields: {
      id: "id",
      name: "name",
      code: "code",
      address: "address",
      phone: "phone",
      email: "email",
      gst_no: "gstNo",
      registration_no: "registrationNo",
      is_active: "isActive",
    },
    booleanFields: ["is_active"],
  },
  {
    table: "users",
    records: mockData.users,
    fields: {
      id: "id",
      name: "name",
      email: "email",
      role: "role",
      phone: "phone",
      specialization: "specialization",
      registration_no: "registrationNo",
      avatar: "avatar",
      is_active: "isActive",
      centres_json: "centres",
    },
    jsonFields: ["centres_json"],
    booleanFields: ["is_active"],
  },
  {
    table: "patients",
    records: mockData.patients,
    fields: {
      id: "id",
      uhid: "uhid",
      abha_id: "abhaId",
      name: "name",
      phone: "phone",
      email: "email",
      gender: "gender",
      dob: "dob",
      age: "age",
      blood_group: "bloodGroup",
      address_json: "address",
      emergency_contact_json: "emergencyContact",
      allergies_json: "allergies",
      chronic_conditions_json: "chronicConditions",
      insurance_info_json: "insuranceInfo",
      registered_at: "registeredAt",
      last_visit: "lastVisit",
      total_visits: "totalVisits",
    },
    jsonFields: [
      "address_json",
      "emergency_contact_json",
      "allergies_json",
      "chronic_conditions_json",
      "insurance_info_json",
    ],
  },
  {
    table: "appointments",
    records: mockData.appointments,
    fields: {
      id: "id",
      patient_id: "patientId",
      patient_name: "patientName",
      patient_phone: "patientPhone",
      patient_age: "patientAge",
      patient_gender: "patientGender",
      doctor_id: "doctorId",
      doctor_name: "doctorName",
      department: "department",
      date: "date",
      time_slot: "timeSlot",
      type: "type",
      status: "status",
      token_number: "tokenNumber",
      chief_complaint: "chiefComplaint",
      notes: "notes",
      created_at: "createdAt",
    },
  },
  {
    table: "opd_queue",
    records: mockData.opdQueue,
    fields: {
      id: "id",
      token_number: "tokenNumber",
      patient_id: "patientId",
      patient_name: "patientName",
      patient_age: "patientAge",
      patient_gender: "patientGender",
      appointment_id: "appointmentId",
      doctor_id: "doctorId",
      doctor_name: "doctorName",
      department: "department",
      type: "type",
      status: "status",
      priority: "priority",
      check_in_time: "checkInTime",
      consult_start_time: "consultStartTime",
      consult_end_time: "consultEndTime",
      estimated_wait_minutes: "estimatedWaitMinutes",
      vitals_recorded: "vitalsRecorded",
    },
    booleanFields: ["vitals_recorded"],
  },
  {
    table: "drugs",
    records: mockData.drugs,
    fields: {
      id: "id",
      name: "name",
      generic_name: "genericName",
      category: "category",
      manufacturer: "manufacturer",
      dosage_form: "dosageForm",
      strength: "strength",
      hsn_code: "hsnCode",
      schedule: "schedule",
      mrp: "mrp",
      purchase_price: "purchasePrice",
      gst_percent: "gstPercent",
      current_stock: "currentStock",
      min_stock: "minStock",
      max_stock: "maxStock",
      reorder_level: "reorderLevel",
      unit: "unit",
      rack_location: "rackLocation",
      is_active: "isActive",
    },
    booleanFields: ["is_active"],
  },
  {
    table: "suppliers",
    records: mockData.suppliers,
    fields: {
      id: "id",
      name: "name",
      contact_person: "contactPerson",
      phone: "phone",
      email: "email",
      gst_no: "gstNo",
      drug_license_no: "drugLicenseNo",
      address: "address",
      is_active: "isActive",
    },
    booleanFields: ["is_active"],
  },
  {
    table: "encounters",
    records: mockData.encounters,
    fields: {
      id: "id",
      patient_id: "patientId",
      patient_name: "patientName",
      doctor_id: "doctorId",
      doctor_name: "doctorName",
      date: "date",
      department: "department",
      type: "type",
      chief_complaint: "chiefComplaint",
      vitals_json: "vitals",
      notes_json: "notes",
      diagnoses_json: "diagnoses",
      prescriptions_json: "prescriptions",
      lab_orders_json: "labOrders",
      procedures_json: "procedures",
      follow_up_date: "followUpDate",
      attachments_json: "attachments",
      ai_transcript: "aiTranscript",
      ai_soap_notes: "aiSoapNotes",
      status: "status",
    },
    jsonFields: [
      "vitals_json",
      "notes_json",
      "diagnoses_json",
      "prescriptions_json",
      "lab_orders_json",
      "procedures_json",
      "attachments_json",
    ],
  },
  {
    table: "invoices",
    records: mockData.invoices,
    fields: {
      id: "id",
      invoice_no: "invoiceNo",
      patient_id: "patientId",
      patient_name: "patientName",
      patient_phone: "patientPhone",
      encounter_id: "encounterId",
      date: "date",
      items_json: "items",
      subtotal: "subtotal",
      total_discount: "totalDiscount",
      total_gst: "totalGst",
      grand_total: "grandTotal",
      amount_paid: "amountPaid",
      balance: "balance",
      status: "status",
      payments_json: "payments",
      notes: "notes",
      centre: "centre",
    },
    jsonFields: ["items_json", "payments_json"],
  },
  {
    table: "prescriptions",
    records: mockData.prescriptions,
    fields: {
      id: "id",
      prescription_no: "prescriptionNo",
      patient_id: "patientId",
      patient_name: "patientName",
      doctor_id: "doctorId",
      doctor_name: "doctorName",
      encounter_id: "encounterId",
      date: "date",
      items_json: "items",
      diagnoses_json: "diagnoses",
      advice: "advice",
      follow_up_date: "followUpDate",
      status: "status",
      qr_code: "qrCode",
    },
    jsonFields: ["items_json", "diagnoses_json"],
  },
  {
    table: "revenue_by_month",
    records: mockData.revenueByMonth,
    fields: {
      month: "name",
      revenue: "revenue",
      patients: "patients",
      consultations: "consultations",
    },
  },
  {
    table: "department_revenue",
    records: mockData.departmentRevenue,
    fields: {
      department: "name",
      value: "value",
      patients: "patients",
    },
  },
  {
    table: "patient_demographics",
    records: mockData.patientDemographics,
    fields: {
      age_group: "name",
      male: "male",
      female: "female",
    },
  },
  {
    table: "top_diagnoses",
    records: mockData.topDiagnoses,
    fields: {
      diagnosis: "name",
      count: "count",
      percentage: "percentage",
    },
  },
  {
    table: "centre_comparison",
    records: mockData.centreComparison,
    fields: {
      centre_name: "name",
      revenue: "revenue",
      patients: "patients",
      satisfaction: "satisfaction",
      avg_wait_time: "avgWaitTime",
    },
  },
  {
    table: "daily_patient_flow",
    records: mockData.dailyPatientFlow,
    fields: {
      hour: "hour",
      walkin: "walkin",
      scheduled: "scheduled",
    },
  },
];

const clearOrder = [
  "auth_sessions",
  "auth_users",
  "prescriptions",
  "invoices",
  "opd_queue",
  "appointments",
  "encounters",
  "patients",
  "users",
  "centres",
  "drugs",
  "suppliers",
  "revenue_by_month",
  "department_revenue",
  "patient_demographics",
  "top_diagnoses",
  "centre_comparison",
  "daily_patient_flow",
];

await mkdir(new URL("../prisma/", import.meta.url), { recursive: true });

const database = new DatabaseSync(databasePath);

try {
  database.exec(await readFile(schemaPath, "utf8"));
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("BEGIN IMMEDIATE");

  try {
    for (const table of clearOrder) {
      database.exec(`DELETE FROM ${table}`);
    }

    let recordCount = 0;

    for (const collection of collections) {
      const columns = Object.keys(collection.fields);
      const placeholders = columns.map(() => "?").join(", ");
      const insert = database.prepare(
        `INSERT INTO ${collection.table} (${columns.join(", ")}) VALUES (${placeholders})`,
      );
      const jsonFields = new Set(collection.jsonFields ?? []);
      const booleanFields = new Set(collection.booleanFields ?? []);

      for (const record of collection.records) {
        const values = columns.map((column) => {
          const value = record[collection.fields[column]];
          if (value === undefined) return null;
          if (jsonFields.has(column)) return JSON.stringify(value);
          if (booleanFields.has(column)) return Number(value);
          return value;
        });

        insert.run(...values);
        recordCount += 1;
      }
    }

    database.exec("DROP TABLE IF EXISTS mock_records");
    database.exec("COMMIT");
    console.log(`Seeded ${recordCount} records into ${collections.length} typed tables.`);
    console.log(`SQLite database: ${databasePath}`);
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
} finally {
  database.close();
}
