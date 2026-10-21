import { db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const COLLECTION = "timetable";

/**
 * Get the distinct list of courses a staff member teaches, derived from the
 * Timetable collection. Timetable docs (see AdminTimeTable.jsx) only carry a
 * `staffName` string and `title` — there's no staffId/code field — so this
 * matches by name rather than uid.
 * @param {string} staffName
 * @returns {Promise<{count: number, codes: string[]}>}
 */
export async function getStaffCourseSummary(staffName) {
  const q = query(collection(db, COLLECTION), where("staffName", "==", staffName));
  const snap = await getDocs(q);

  const codes = new Set();
  snap.forEach((doc) => {
    const data = doc.data();
    if (data.title) codes.add(data.title);
  });

  return { count: codes.size, codes: Array.from(codes) };
}