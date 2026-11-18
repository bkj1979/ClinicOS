import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { openClinicDatabase } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();
  if (user.role !== "doctor") {
    return Response.json({ error: "The doctor mobile workspace is available to doctor accounts only." }, { status: 403 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length > 100) {
    return Response.json({ error: "Search text must be 100 characters or fewer." }, { status: 400 });
  }

  let database;
  try {
    database = await openClinicDatabase();
    const search = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
    const patients = await database.prepare(`
      SELECT p.id, p.uhid, p.name, p.age, p.gender,
        p.last_visit AS lastVisit, p.total_visits AS totalVisits,
        COALESCE((
          SELECT MAX(e.date) FROM encounters e
          WHERE e.patient_id = p.id AND e.doctor_id = ?
        ), (
          SELECT MAX(a.date) FROM appointments a
          WHERE a.patient_id = p.id AND a.doctor_id = ?
        )) AS doctorLastVisit
      FROM patients p
      WHERE (p.name LIKE ? ESCAPE '\\' OR p.phone LIKE ? ESCAPE '\\' OR p.uhid LIKE ? ESCAPE '\\')
        AND (
          EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.doctor_id = ?)
          OR EXISTS (SELECT 1 FROM encounters e WHERE e.patient_id = p.id AND e.doctor_id = ?)
          OR EXISTS (SELECT 1 FROM prescriptions r WHERE r.patient_id = p.id AND r.doctor_id = ?)
        )
      ORDER BY doctorLastVisit DESC, p.name COLLATE NOCASE
      LIMIT 30
    `).all(user.userId, user.userId, search, search, search, user.userId, user.userId, user.userId);

    return Response.json(patients, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Could not search the doctor's assigned patients:", error);
    return Response.json({ error: "Unable to search your patient records." }, { status: 500 });
  } finally {
    database?.close();
  }
}
