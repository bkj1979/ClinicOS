import { randomUUID } from "node:crypto";
import type { Patient } from "@/lib/types";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { openClinicDatabase, type ClinicDatabase } from "@/lib/database";

export const runtime = "nodejs";

interface PatientRow {
  id: string;
  uhid: string;
  abha_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  gender: string;
  dob: string;
  age: number;
  blood_group: string | null;
  address_json: string | null;
  emergency_contact_json: string | null;
  allergies_json: string;
  chronic_conditions_json: string;
  insurance_info_json: string | null;
  registered_at: string;
  last_visit: string | null;
  total_visits: number;
}

interface RegisterPatientBody {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  gender?: unknown;
  dob?: unknown;
  bloodGroup?: unknown;
  addressLine1?: unknown;
  city?: unknown;
  state?: unknown;
  pincode?: unknown;
  emergencyName?: unknown;
  emergencyPhone?: unknown;
  emergencyRelation?: unknown;
  allergies?: unknown;
  abhaId?: unknown;
  insuranceProvider?: unknown;
  insurancePolicyNo?: unknown;
  insuranceValidTill?: unknown;
}

function parseJson<T>(value: string | null): T | undefined {
  return value === null ? undefined : JSON.parse(value) as T;
}

function toPatient(row: PatientRow): Patient {
  return {
    id: row.id,
    uhid: row.uhid,
    abhaId: row.abha_id ?? undefined,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    gender: row.gender as Patient["gender"],
    dob: row.dob,
    age: row.age,
    bloodGroup: row.blood_group ?? undefined,
    address: parseJson<Patient["address"]>(row.address_json),
    emergencyContact: parseJson<Patient["emergencyContact"]>(row.emergency_contact_json),
    allergies: JSON.parse(row.allergies_json) as string[],
    chronicConditions: JSON.parse(row.chronic_conditions_json) as string[],
    insuranceInfo: parseJson<Patient["insuranceInfo"]>(row.insurance_info_json),
    registeredAt: row.registered_at,
    lastVisit: row.last_visit ?? undefined,
    totalVisits: row.total_visits,
  };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function calculateAge(dob: string): number {
  const birthDate = new Date(`${dob}T00:00:00.000Z`);
  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() < birthDate.getUTCDate());

  if (beforeBirthday) age -= 1;
  return age;
}

export async function GET(request: Request) {
  if (!await getAuthenticatedUser(request)) return unauthorizedResponse();
  try {
    const database = await openClinicDatabase();

    try {
      const rows = await database
        .prepare("SELECT * FROM patients ORDER BY name COLLATE NOCASE")
        .all() as unknown as PatientRow[];
      return Response.json(rows.map(toPatient));
    } finally {
      database.close();
    }
  } catch (error) {
    console.error("Failed to load patients from SQLite:", error);
    return Response.json({ error: "Unable to load patients from the local database." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await getAuthenticatedUser(request)) return unauthorizedResponse();
  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
    return Response.json({ error: "Request body must be a patient object." }, { status: 400 });
  }

  const body = parsedBody as RegisterPatientBody;

  const name = text(body.name);
  const phone = text(body.phone);
  const email = text(body.email);
  const gender = text(body.gender);
  const dob = text(body.dob);
  const bloodGroup = text(body.bloodGroup);

  if (!name || name.length > 120) {
    return Response.json({ error: "Enter a patient name (up to 120 characters)." }, { status: 400 });
  }
  if (!/^\d{10}$/.test(phone)) {
    return Response.json({ error: "Enter a valid 10-digit phone number." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!["Male", "Female", "Other"].includes(gender)) {
    return Response.json({ error: "Select a valid gender." }, { status: 400 });
  }
  if (!validDate(dob) || dob > new Date().toISOString().slice(0, 10)) {
    return Response.json({ error: "Enter a valid date of birth that is not in the future." }, { status: 400 });
  }
  if (bloodGroup && !["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(bloodGroup)) {
    return Response.json({ error: "Select a valid blood group." }, { status: 400 });
  }

  const addressLine1 = text(body.addressLine1);
  const city = text(body.city);
  const state = text(body.state);
  const pincode = text(body.pincode);
  const emergencyName = text(body.emergencyName);
  const emergencyPhone = text(body.emergencyPhone);
  const emergencyRelation = text(body.emergencyRelation);
  const insuranceProvider = text(body.insuranceProvider);
  const insurancePolicyNo = text(body.insurancePolicyNo);
  const insuranceValidTill = text(body.insuranceValidTill);

  if (pincode && !/^\d{6}$/.test(pincode)) {
    return Response.json({ error: "Enter a valid 6-digit pincode." }, { status: 400 });
  }
  if (
    [emergencyName, emergencyPhone, emergencyRelation].some(Boolean) &&
    (!emergencyName || !/^\d{10}$/.test(emergencyPhone) || !emergencyRelation)
  ) {
    return Response.json({ error: "Complete all emergency contact fields using a valid 10-digit phone number." }, { status: 400 });
  }
  if (
    [insuranceProvider, insurancePolicyNo, insuranceValidTill].some(Boolean) &&
    (!insuranceProvider || !insurancePolicyNo || !validDate(insuranceValidTill))
  ) {
    return Response.json({ error: "Complete all insurance fields and provide a valid policy expiry date." }, { status: 400 });
  }

  const registeredAt = new Date().toISOString().slice(0, 10);
  const id = randomUUID();
  const address = addressLine1
    ? { line1: addressLine1, city: city || "Bangalore", state: state || "Karnataka", pincode }
    : undefined;
  const emergencyContact = emergencyName
    ? { name: emergencyName, phone: emergencyPhone, relation: emergencyRelation }
    : undefined;
  const allergies = text(body.allergies)
    .split(",")
    .map((allergy) => allergy.trim())
    .filter(Boolean);
  const insuranceInfo = insuranceProvider
    ? { provider: insuranceProvider, policyNo: insurancePolicyNo, validTill: insuranceValidTill }
    : undefined;

  let database: ClinicDatabase | undefined;
  try {
    database = await openClinicDatabase();
    await database.exec("PRAGMA foreign_keys = ON");
    await database.exec("BEGIN IMMEDIATE");

    try {
      const maxUhid = await database
        .prepare("SELECT COALESCE(MAX(CAST(SUBSTR(uhid, 4) AS INTEGER)), 100000) AS max_id FROM patients")
        .get() as { max_id: number };
      const patient: Patient = {
        id,
        uhid: `COS${maxUhid.max_id + 1}`,
        abhaId: text(body.abhaId) || undefined,
        name,
        phone,
        email: email || undefined,
        gender: gender as Patient["gender"],
        dob,
        age: calculateAge(dob),
        bloodGroup: bloodGroup || undefined,
        address,
        emergencyContact,
        allergies,
        chronicConditions: [],
        insuranceInfo,
        registeredAt,
        totalVisits: 0,
      };

      await database.prepare(`
        INSERT INTO patients (
          id, uhid, abha_id, name, phone, email, gender, dob, age, blood_group,
          address_json, emergency_contact_json, allergies_json, chronic_conditions_json,
          insurance_info_json, registered_at, last_visit, total_visits
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        patient.id,
        patient.uhid,
        patient.abhaId ?? null,
        patient.name,
        patient.phone,
        patient.email ?? null,
        patient.gender,
        patient.dob,
        patient.age,
        patient.bloodGroup ?? null,
        patient.address ? JSON.stringify(patient.address) : null,
        patient.emergencyContact ? JSON.stringify(patient.emergencyContact) : null,
        JSON.stringify(patient.allergies),
        JSON.stringify(patient.chronicConditions),
        patient.insuranceInfo ? JSON.stringify(patient.insuranceInfo) : null,
        patient.registeredAt,
        null,
        patient.totalVisits,
      );

      await database.exec("COMMIT");
      return Response.json(patient, { status: 201 });
    } catch (error) {
      await database.exec("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Failed to register patient in the database:", error);
    return Response.json({ error: "Unable to register patient. Please check the local database and try again." }, { status: 500 });
  } finally {
    database?.close();
  }
}
