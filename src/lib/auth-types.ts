export type ClinicRole = "doctor" | "receptionist" | "pharmacist" | "nurse" | "admin";

export interface AuthUser {
  id: string;
  userId: string;
  name: string;
  loginId: string;
  role: ClinicRole;
  phone: string;
  specialization: string | null;
}
