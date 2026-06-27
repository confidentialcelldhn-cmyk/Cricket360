export type UserRole = "admin" | "coach" | "student";

export type AccountStatus = "active" | "inactive";

export type AttendanceStatus = "Present" | "Absent" | "Late" | "Unmarked";

export type FeeStatus = "Unpaid" | "Pending" | "Paid" | "Rejected";

export type SessionType = "Practice" | "Match" | "Tournament";

export type PlayingRole = "Batsman" | "Bowler" | "All-Rounder" | "Wicket-Keeper";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  loginId: string;
  password: string;
  isFirstLogin: boolean;
  status: AccountStatus;
  linkedId: string; // studentId or coachId
}

export interface Coach {
  id: string;
  userId: string;
  name: string;
  designation: string;
  hrmsId: string;
  mobile: string;
  email: string;
  photo?: string;
  batchIds: string[];
  status: AccountStatus;
  createdAt: string;
}

export interface Student {
  id: string;
  userId: string;
  name: string;
  dateOfBirth: string;
  fatherName: string;
  isRailway: boolean;
  designation?: string;
  department?: string;
  pfNo?: string;
  gender: "Male" | "Female" | "Other";
  parentMobile: string;
  whatsappNo?: string;
  email?: string;
  address: string;
  dateOfRegistration: string;
  registrationFees: number;
  dateOfAdmission: string;
  admissionFees: number;
  photo?: string;
  batchId: string;
  status: AccountStatus;
  height?: number;
  weight?: number;
  playingRole?: PlayingRole;
}

export interface Batch {
  id: string;
  name: "Group A" | "Group B" | "Group C";
  label: string;
  ageRange: string;
  coachIds: string[];
}

export interface Schedule {
  id: string;
  batchId: string;
  type: SessionType;
  date: string;
  time: string;
  venue: string;
  isRecurring: boolean;
}

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
}

export interface AttendanceLog {
  id: string;
  batchId: string;
  coachId: string;
  date: string;
  isLocked: boolean;
  entries: AttendanceEntry[];
}

export interface PerformanceLog {
  id: string;
  studentId: string;
  batchId: string;
  coachId: string;
  date: string;
  battingNA: boolean;
  footwork: number;
  shotSelection: number;
  timing: number;
  bowlingNA: boolean;
  lineAndLength: number;
  action: number;
  paceAndVariation: number;
  fieldingNA: boolean;
  catching: number;
  groundFielding: number;
  throwing: number;
  remarks: string;
}

export interface FinancialLog {
  id: string;
  studentId: string;
  billingMonth: string;
  amount: number;
  status: FeeStatus;
  receiptUri?: string;
  verifiedBy?: string;
  rejectionNote?: string;
  submittedAt?: string;
  verifiedAt?: string;
}

export interface AppNotification {
  id: string;
  forRole: UserRole;
  forUserId?: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  linkId?: string;
}

export interface SystemSettings {
  feeAmount: number;
  upiId: string;
  beneficiaryName: string;
  qrCodeUrl?: string;
  whatsappGroupLink?: string;
  academyName: string;
  academyAddress: string;
  academyPhone: string;
  academyEmail: string;
}
