import { createHash, createHmac, timingSafeEqual } from "node:crypto";

interface PrescriptionVerificationClaims {
  id: string;
  fingerprint: string;
}

export interface PrescriptionVerificationRecord {
  id: string;
  prescription_no: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  encounter_id: string;
  date: string;
  items_json: string;
  diagnoses_json: string;
  advice: string;
  follow_up_date: string | null;
}

export function getPrescriptionFingerprint(record: PrescriptionVerificationRecord): string {
  const contents = JSON.stringify([
    record.id,
    record.prescription_no,
    record.patient_id,
    record.patient_name,
    record.doctor_id,
    record.doctor_name,
    record.encounter_id,
    record.date,
    record.items_json,
    record.diagnoses_json,
    record.advice,
    record.follow_up_date,
  ]);
  return createHash("sha256").update(contents).digest("base64url");
}

function getSigningKey(): Buffer {
  const value = process.env.CLINICOS_PRESCRIPTION_SIGNING_KEY;
  if (!value || Buffer.byteLength(value, "utf8") < 32) {
    throw new Error("Set CLINICOS_PRESCRIPTION_SIGNING_KEY to a secret of at least 32 bytes.");
  }
  return Buffer.from(value, "utf8");
}

export function createPrescriptionVerificationToken(id: string, fingerprint: string): string {
  const payload = Buffer.from(JSON.stringify({ id, fingerprint } satisfies PrescriptionVerificationClaims)).toString("base64url");
  const signature = createHmac("sha256", getSigningKey()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readPrescriptionVerificationToken(token: string): PrescriptionVerificationClaims | null {
  const parts = token.split(".");
  if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return null;

  const [payload, encodedSignature] = parts;
  const expectedSignature = createHmac("sha256", getSigningKey()).update(payload).digest();
  const suppliedSignature = Buffer.from(encodedSignature, "base64url");
  if (expectedSignature.length !== suppliedSignature.length || !timingSafeEqual(expectedSignature, suppliedSignature)) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("id" in parsed) ||
      typeof parsed.id !== "string" ||
      !("fingerprint" in parsed) ||
      typeof parsed.fingerprint !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(parsed.fingerprint)
    ) {
      return null;
    }

    return { id: parsed.id, fingerprint: parsed.fingerprint };
  } catch {
    return null;
  }
}
