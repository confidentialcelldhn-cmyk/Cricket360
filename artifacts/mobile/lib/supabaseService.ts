import { supabase } from "./supabase";
import {
  AttendanceLog,
  Batch,
  Coach,
  FinancialLog,
  PerformanceLog,
  Student,
  SystemSettings,
  User,
} from "@/types";

// ─── Students ───────────────────────────────────────────────────────

export async function fetchStudents(): Promise<Student[]> {
  const { data, error } = await supabase.from("students").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromSupabaseStudent);
}

export async function insertStudent(student: Student): Promise<Student> {
  const { data, error } = await supabase.from("students").insert(toSupabaseStudent(student)).select().single();
  if (error) throw error;
  return fromSupabaseStudent(data);
}

export async function updateStudentRecord(id: string, updates: Partial<Student>): Promise<Student> {
  const patch = toSupabaseStudentPartial(updates);
  const { data, error } = await supabase.from("students").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return fromSupabaseStudent(data);
}

// ─── Coaches ───────────────────────────────────────────────────────

export async function fetchCoaches(): Promise<Coach[]> {
  const { data, error } = await supabase.from("coaches").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromSupabaseCoach);
}

export async function insertCoach(coach: Coach): Promise<Coach> {
  const { data, error } = await supabase.from("coaches").insert(toSupabaseCoach(coach)).select().single();
  if (error) throw error;
  return fromSupabaseCoach(data);
}

export async function updateCoachRecord(id: string, updates: Partial<Coach>): Promise<Coach> {
  const patch = toSupabaseCoachPartial(updates);
  const { data, error } = await supabase.from("coaches").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return fromSupabaseCoach(data);
}

export async function deleteStudentRecord(id: string): Promise<void> {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteCoachRecord(id: string): Promise<void> {
  const { error } = await supabase.from("coaches").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteUserRecord(id: string): Promise<void> {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;
}

// ─── Batches ───────────────────────────────────────────────────────

export async function fetchBatches(): Promise<Batch[]> {
  const { data, error } = await supabase.from("batches").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromSupabaseBatch);
}

// ─── Users (auth-linked profiles) ───────────────────────────────────

export async function updateUserRecord(
  id: string,
  updates: { password?: string; loginId?: string; isFirstLogin?: boolean }
): Promise<void> {
  const patch: any = {};
  if (updates.password !== undefined) patch.password = updates.password;
  if (updates.loginId !== undefined) patch.login_id = updates.loginId;
  if (updates.isFirstLogin !== undefined) patch.is_first_login = updates.isFirstLogin;
  const { error } = await supabase.from("users").update(patch).eq("id", id);
  if (error) throw error;
}

export async function resetUserPassword(userId: string, defaultPassword: string): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ password: defaultPassword, is_first_login: true })
    .eq("id", userId);
  if (error) throw error;
}

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromSupabaseUser);
}

export async function insertUser(user: User): Promise<User> {
  const { data, error } = await supabase.from("users").insert(toSupabaseUser(user)).select().single();
  if (error) throw error;
  return fromSupabaseUser(data);
}

// ─── Performance Logs ─────────────────────────────────────────────────────

export async function fetchPerformanceLogs(): Promise<PerformanceLog[]> {
  const { data, error } = await supabase.from("performance_logs").select("*").order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromSupabasePerformanceLog);
}

export async function insertPerformanceLog(log: PerformanceLog): Promise<PerformanceLog> {
  const { data, error } = await supabase.from("performance_logs").insert(toSupabasePerformanceLog(log)).select().single();
  if (error) throw error;
  return fromSupabasePerformanceLog(data);
}

// ─── Attendance Logs ───────────────────────────────────────────────────────────────────────────────

export async function fetchAttendanceLogs(): Promise<AttendanceLog[]> {
  const { data, error } = await supabase.from("attendance_logs").select("*").order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromSupabaseAttendanceLog);
}

export async function upsertAttendanceLog(log: AttendanceLog): Promise<AttendanceLog> {
  const { data, error } = await supabase.from("attendance_logs").upsert(toSupabaseAttendanceLog(log)).select().single();
  if (error) throw error;
  return fromSupabaseAttendanceLog(data);
}

// ─── Financial Logs (Fees) ───────────────────────────────────────────────────────────────

export async function fetchFinancialLogs(): Promise<FinancialLog[]> {
  const { data, error } = await supabase.from("financial_logs").select("*").order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromSupabaseFinancialLog);
}

export async function upsertFinancialLog(log: FinancialLog): Promise<FinancialLog> {
  const { data, error } = await supabase.from("financial_logs").upsert(toSupabaseFinancialLog(log)).select().single();
  if (error) throw error;
  return fromSupabaseFinancialLog(data);
}

// ─── Settings ───────────────────────────────────────────────────────

export async function fetchSettings(): Promise<SystemSettings | null> {
  const { data, error } = await supabase.from("settings").select("*").order("updated_at", { ascending: false }).limit(1).single();
  if (error) return null;
  return fromSupabaseSettings(data);
}

export async function upsertSettings(settings: SystemSettings): Promise<SystemSettings> {
  const { data, error } = await supabase.from("settings").upsert(toSupabaseSettings(settings)).select().single();
  if (error) throw error;
  return fromSupabaseSettings(data);
}

// ─── Storage (Photos) ──────────────────────────────────────────────────────────────

export async function uploadPhoto(bucket: "cricket360", path: string, file: string) {
  // file is always a data URI: "data:image/jpeg;base64,..."
  const base64 = file.startsWith("data:") ? file.split(",")[1] : file;
  if (!base64) throw new Error("Invalid base64 string");
  const mime = file.startsWith("data:") ? (file.match(/data:([^;]+);/)?.[1] ?? "image/jpeg") : "image/jpeg";

  // decode base64 → ArrayBuffer (works in React Native where Blob/atob may not)
  const { decode } = await import("base64-arraybuffer");
  const arrayBuffer = decode(base64);

  const { data, error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    cacheControl: "3600",
    upsert: true,
    contentType: mime,
  });
  if (error) throw error;
  return data;
}

export function getPhotoUrl(bucket: "cricket360", path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ─── Mappers: Supabase snake_case ↔ TypeScript camelCase ─────────────────────────────────────

function fromSupabaseStudent(row: any): Student {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    dateOfBirth: row.date_of_birth,
    fatherName: row.father_name,
    isRailway: row.is_railway,
    designation: row.designation,
    department: row.department,
    pfNo: row.pf_no,
    gender: row.gender,
    parentMobile: row.parent_mobile,
    whatsappNo: row.whatsapp_no,
    email: row.email,
    address: row.address,
    dateOfRegistration: row.date_of_registration,
    registrationFees: row.registration_fees,
    dateOfAdmission: row.date_of_admission,
    admissionFees: row.admission_fees,
    photo: row.photo_url ?? row.photo,
    batchId: row.batch_id,
    status: row.status,
    height: row.height,
    weight: row.weight,
    playingRole: row.playing_role,
  };
}

function toSupabaseStudent(s: Student): any {
  return {
    id: s.id,
    user_id: s.userId,
    name: s.name,
    date_of_birth: s.dateOfBirth,
    father_name: s.fatherName,
    is_railway: s.isRailway,
    designation: s.designation,
    department: s.department,
    pf_no: s.pfNo,
    gender: s.gender,
    parent_mobile: s.parentMobile,
    whatsapp_no: s.whatsappNo,
    email: s.email,
    address: s.address,
    date_of_registration: s.dateOfRegistration,
    registration_fees: s.registrationFees,
    date_of_admission: s.dateOfAdmission,
    admission_fees: s.admissionFees,
    photo_url: s.photo,
    batch_id: s.batchId,
    status: s.status,
    height: s.height,
    weight: s.weight,
    playing_role: s.playingRole,
  };
}

function toSupabaseStudentPartial(updates: Partial<Student>): any {
  const out: any = {};
  if (updates.name !== undefined) out.name = updates.name;
  if (updates.dateOfBirth !== undefined) out.date_of_birth = updates.dateOfBirth;
  if (updates.fatherName !== undefined) out.father_name = updates.fatherName;
  if (updates.isRailway !== undefined) out.is_railway = updates.isRailway;
  if (updates.designation !== undefined) out.designation = updates.designation;
  if (updates.department !== undefined) out.department = updates.department;
  if (updates.pfNo !== undefined) out.pf_no = updates.pfNo;
  if (updates.gender !== undefined) out.gender = updates.gender;
  if (updates.parentMobile !== undefined) out.parent_mobile = updates.parentMobile;
  if (updates.whatsappNo !== undefined) out.whatsapp_no = updates.whatsappNo;
  if (updates.email !== undefined) out.email = updates.email;
  if (updates.address !== undefined) out.address = updates.address;
  if (updates.dateOfRegistration !== undefined) out.date_of_registration = updates.dateOfRegistration;
  if (updates.registrationFees !== undefined) out.registration_fees = updates.registrationFees;
  if (updates.dateOfAdmission !== undefined) out.date_of_admission = updates.dateOfAdmission;
  if (updates.admissionFees !== undefined) out.admission_fees = updates.admissionFees;
  if (updates.photo !== undefined) out.photo_url = updates.photo;
  if (updates.batchId !== undefined) out.batch_id = updates.batchId;
  if (updates.status !== undefined) out.status = updates.status;
  if (updates.height !== undefined) out.height = updates.height;
  if (updates.weight !== undefined) out.weight = updates.weight;
  if (updates.playingRole !== undefined) out.playing_role = updates.playingRole;
  return out;
}

function fromSupabaseCoach(row: any): Coach {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    designation: row.designation,
    hrmsId: row.hrms_id,
    mobile: row.mobile,
    email: row.email,
    photo: row.photo_url ?? row.photo,
    batchIds: row.batch_ids ?? [],
    status: row.status,
    createdAt: row.created_at,
  };
}

function toSupabaseCoach(c: Coach): any {
  return {
    id: c.id,
    user_id: c.userId,
    name: c.name,
    designation: c.designation,
    hrms_id: c.hrmsId,
    mobile: c.mobile,
    email: c.email,
    photo_url: c.photo,
    batch_ids: c.batchIds,
    status: c.status,
    created_at: c.createdAt,
  };
}

function toSupabaseCoachPartial(updates: Partial<Coach>): any {
  const out: any = {};
  if (updates.name !== undefined) out.name = updates.name;
  if (updates.designation !== undefined) out.designation = updates.designation;
  if (updates.hrmsId !== undefined) out.hrms_id = updates.hrmsId;
  if (updates.mobile !== undefined) out.mobile = updates.mobile;
  if (updates.email !== undefined) out.email = updates.email;
  if (updates.photo !== undefined) out.photo_url = updates.photo;
  if (updates.batchIds !== undefined) out.batch_ids = updates.batchIds;
  if (updates.status !== undefined) out.status = updates.status;
  return out;
}

function fromSupabaseBatch(row: any): Batch {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    ageRange: row.age_range,
    coachIds: row.coach_ids ?? [],
  };
}

function fromSupabaseUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    loginId: row.login_id,
    password: row.password,
    isFirstLogin: row.is_first_login,
    status: row.status,
    linkedId: row.linked_id,
  };
}

function toSupabaseUser(u: User): any {
  return {
    id: u.id,
    name: u.name,
    role: u.role,
    login_id: u.loginId,
    password: u.password,
    is_first_login: u.isFirstLogin,
    status: u.status,
    linked_id: u.linkedId,
  };
}

function fromSupabasePerformanceLog(row: any): PerformanceLog {
  return {
    id: row.id,
    studentId: row.student_id,
    batchId: row.batch_id,
    coachId: row.coach_id,
    date: row.date,
    battingNA: row.batting_na,
    footwork: row.footwork,
    shotSelection: row.shot_selection,
    timing: row.timing,
    bowlingNA: row.bowling_na,
    lineAndLength: row.line_and_length,
    action: row.action,
    paceAndVariation: row.pace_and_variation,
    fieldingNA: row.fielding_na,
    catching: row.catching,
    groundFielding: row.ground_fielding,
    throwing: row.throwing,
    remarks: row.remarks,
  };
}

function toSupabasePerformanceLog(l: PerformanceLog): any {
  return {
    id: l.id,
    student_id: l.studentId,
    batch_id: l.batchId,
    coach_id: l.coachId,
    date: l.date,
    batting_na: l.battingNA,
    footwork: l.footwork,
    shot_selection: l.shotSelection,
    timing: l.timing,
    bowling_na: l.bowlingNA,
    line_and_length: l.lineAndLength,
    action: l.action,
    pace_and_variation: l.paceAndVariation,
    fielding_na: l.fieldingNA,
    catching: l.catching,
    ground_fielding: l.groundFielding,
    throwing: l.throwing,
    remarks: l.remarks,
  };
}

function fromSupabaseAttendanceLog(row: any): AttendanceLog {
  return {
    id: row.id,
    batchId: row.batch_id,
    coachId: row.coach_id,
    date: row.date,
    isLocked: row.is_locked,
    entries: row.entries ?? [],
  };
}

function toSupabaseAttendanceLog(l: AttendanceLog): any {
  return {
    id: l.id,
    batch_id: l.batchId,
    coach_id: l.coachId,
    date: l.date,
    is_locked: l.isLocked,
    entries: l.entries,
  };
}

function fromSupabaseFinancialLog(row: any): FinancialLog {
  return {
    id: row.id,
    studentId: row.student_id,
    billingMonth: row.billing_month,
    amount: row.amount,
    status: row.status,
    receiptUri: row.receipt_uri,
    verifiedBy: row.verified_by,
    rejectionNote: row.rejection_note,
    submittedAt: row.submitted_at,
    verifiedAt: row.verified_at,
  };
}

function toSupabaseFinancialLog(l: FinancialLog): any {
  return {
    id: l.id,
    student_id: l.studentId,
    billing_month: l.billingMonth,
    amount: l.amount,
    status: l.status,
    receipt_uri: l.receiptUri,
    verified_by: l.verifiedBy,
    rejection_note: l.rejectionNote,
    submitted_at: l.submittedAt,
    verified_at: l.verifiedAt,
  };
}

function fromSupabaseSettings(row: any): SystemSettings {
  return {
    feeAmount: row.fee_amount,
    upiId: row.upi_id,
    beneficiaryName: row.beneficiary_name,
    qrCodeUrl: row.qr_code_url,
    whatsappGroupLink: row.whatsapp_group_link,
    academyName: row.academy_name,
    academyAddress: row.academy_address,
    academyPhone: row.academy_phone,
    academyEmail: row.academy_email,
  };
}

function toSupabaseSettings(s: SystemSettings): any {
  return {
    fee_amount: s.feeAmount,
    upi_id: s.upiId,
    beneficiary_name: s.beneficiaryName,
    qr_code_url: s.qrCodeUrl,
    whatsapp_group_link: s.whatsappGroupLink,
    academy_name: s.academyName,
    academy_address: s.academyAddress,
    academy_phone: s.academyPhone,
    academy_email: s.academyEmail,
  };
}
