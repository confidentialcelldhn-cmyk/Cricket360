// DD/MM/YYYY ↔ YYYY-MM-DD conversion utilities

/**
 * Parse a date string that may be in either "YYYY-MM-DD" (ISO) or "DD/MM/YYYY" (display) format.
 * Returns a valid Date object in both cases, safely handling React Native timezone issues.
 */
export function parseDate(dob: string): Date {
  if (!dob) return new Date(NaN);
  
  // Handle DD/MM/YYYY format
  if (dob.includes("/")) {
    const parts = dob.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
  }
  
  // Handle YYYY-MM-DD or Supabase Timestamps (YYYY-MM-DDTHH:MM:SSZ)
  if (dob.includes("-")) {
    const datePart = dob.split("T")[0]; // Ignore time part if present
    const parts = datePart.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
  }
  
  return new Date(dob);
}

/** Calculate age from a date string in either ISO or DD/MM/YYYY format */
export function getAge(dob: string): number {
  const today = new Date();
  const birth = parseDate(dob);
  if (isNaN(birth.getTime())) return 0;
  
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age;
}

/** "2016-03-15" → "15/03/2016" for display in form inputs */
export function toDisplayDate(iso: string): string {
  if (!iso || iso.length < 10) return iso;
  const datePart = iso.split("T")[0];
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** "15/03/2016" → "2016-03-15" for internal storage */
export function fromDisplayDate(display: string): string {
  if (!display) return "";
  if (display.includes("/")) {
    const parts = display.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      if (y.length === 4) return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  return display;
}

/** Format an ISO date for readable display (e.g. "15 Mar 2016") */
export function prettyDate(iso: string): string {
  if (!iso || iso.length < 10) return iso ?? "—";
  try {
    const d = parseDate(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}
