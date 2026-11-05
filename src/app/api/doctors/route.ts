import { getAuthenticatedUser, openAuthDatabase, unauthorizedResponse } from "@/lib/auth";
import type { User } from "@/lib/types";

export const runtime = "nodejs";

interface DoctorRow {
  id: string;
  name: string;
  email: string;
  role: User["role"];
  phone: string;
  specialization: string | null;
  registrationNo: string | null;
  avatar: string | null;
  isActive: number;
  centresJson: string;
}

export async function GET(request: Request) {
  if (!await getAuthenticatedUser(request)) return unauthorizedResponse();

  const database = await openAuthDatabase();
  try {
    const doctors = await database.prepare(`
      SELECT id, name, email, role, phone, specialization,
        registration_no AS registrationNo, avatar, is_active AS isActive,
        centres_json AS centresJson
      FROM users
      WHERE role = 'doctor' AND is_active = 1
      ORDER BY name COLLATE NOCASE
    `).all() as unknown as DoctorRow[];
    return Response.json(doctors.map((doctor): User => ({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      role: doctor.role,
      phone: doctor.phone,
      specialization: doctor.specialization ?? undefined,
      registrationNo: doctor.registrationNo ?? undefined,
      avatar: doctor.avatar ?? undefined,
      isActive: Boolean(doctor.isActive),
      centres: JSON.parse(doctor.centresJson) as string[],
    })), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not load active doctors from SQLite:", error);
    return Response.json({ error: "Unable to load the doctor list." }, { status: 500 });
  } finally {
    database.close();
  }
}
