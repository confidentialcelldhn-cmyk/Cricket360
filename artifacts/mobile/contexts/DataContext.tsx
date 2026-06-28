import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  defaultSettings,
  mockAttendanceLogs,
  mockBatches,
  mockCoaches,
  mockFinancialLogs,
  mockNotifications,
  mockPerformanceLogs,
  mockSchedules,
  mockStudents,
} from "@/data/mockData";
import {
  fetchStudents,
  fetchCoaches,
  fetchBatches,
  fetchAttendanceLogs,
  fetchPerformanceLogs,
  fetchFinancialLogs,
  fetchSettings,
  insertStudent,
  insertCoach,
  insertUser,
  updateStudentRecord,
  updateCoachRecord,
  updateUserRecord,
  resetUserPassword,
  deleteStudentRecord,
  deleteCoachRecord,
  deleteUserRecord,
  upsertAttendanceLog,
  insertPerformanceLog,
  upsertFinancialLog,
  upsertSettings,
  uploadPhoto,
  getPhotoUrl,
} from "@/lib/supabaseService";
import {
  AppNotification,
  AttendanceLog,
  Batch,
  Coach,
  FinancialLog,
  PerformanceLog,
  Schedule,
  Student,
  SystemSettings,
  User,
} from "@/types";

const DATA_SEED_VERSION = "v4";

const KEYS = {
  seedVersion: "@c360_seed_version",
  students: "@c360_students",
  coaches: "@c360_coaches",
  batches: "@c360_batches",
  schedules: "@c360_schedules",
  attendance: "@c360_attendance",
  performance: "@c360_performance",
  financial: "@c360_financial",
  notifications: "@c360_notifications",
  settings: "@c360_settings",
  users: "@c360_users_data",
  supabaseEnabled: "@c360_supabase",
};

interface DataContextType {
  students: Student[];
  coaches: Coach[];
  batches: Batch[];
  schedules: Schedule[];
  attendanceLogs: AttendanceLog[];
  performanceLogs: PerformanceLog[];
  financialLogs: FinancialLog[];
  notifications: AppNotification[];
  settings: SystemSettings;
  isLoading: boolean;
  isOnline: boolean;
  useSupabase: boolean;
  resetPassword: (userId: string, role: string) => Promise<void>;

  // Student ops
  addStudent: (student: Student, user: User) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deactivateStudent: (id: string) => Promise<void>;
  reactivateStudent: (id: string) => Promise<void>;
  transferBatch: (studentId: string, newBatchId: string) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  // Coach ops
  addCoach: (coach: Coach, user: User) => Promise<void>;
  updateCoach: (id: string, updates: Partial<Coach>) => Promise<void>;
  deactivateCoach: (id: string) => Promise<void>;
  reactivateCoach: (id: string) => Promise<void>;
  deleteCoach: (id: string) => Promise<void>;

  // Photo / QR
  uploadStudentPhoto: (studentId: string, file: string) => Promise<string | null>;
  uploadQrPhoto: (file: string) => Promise<string | null>;

  // Batch ops
  addSchedule: (schedule: Schedule) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;

  // Attendance
  submitAttendance: (log: AttendanceLog) => Promise<void>;
  unlockAttendance: (logId: string) => Promise<void>;

  // Performance
  savePerformance: (log: PerformanceLog) => Promise<void>;

  // Fees
  uploadReceipt: (studentId: string, billingMonth: string, amount: number, receiptUri?: string) => Promise<void>;
  verifyReceipt: (logId: string, approved: boolean, note?: string, coachId?: string) => Promise<void>;

  // Notifications
  markNotificationRead: (id: string) => Promise<void>;

  // Settings
  updateSettings: (updates: Partial<SystemSettings>) => Promise<void>;

  // Helpers
  getStudentsByBatch: (batchId: string) => Student[];
  getPendingReceipts: (batchId: string) => { log: FinancialLog; student: Student }[];
  getDefaulters: (batchId: string, month: string) => Student[];
  getStudentFeeStatus: (studentId: string, month: string) => FinancialLog | undefined;
  getStudentPerformance: (studentId: string) => PerformanceLog[];
  getCoachBatches: (coachId: string) => Batch[];
  getTodayAttendance: (batchId: string, date: string) => AttendanceLog | undefined;
  getUnreadCount: (role: string, userId?: string) => number;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [performanceLogs, setPerformanceLogs] = useState<PerformanceLog[]>([]);
  const [financialLogs, setFinancialLogs] = useState<FinancialLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const [useSupabase, setUseSupabase] = useState(!!SUPABASE_URL);

  // Reset a coach or student password to the default in Supabase
  const resetPassword = useCallback(async (userId: string, role: string) => {
    const defaultPwd = role === "coach" ? "Coach@123" : "Student@123";
    await resetUserPassword(userId, defaultPwd);
  }, []);

  // Load from Supabase
  const loadSupabase = async () => {
    try {
      const [s, c, b, att, perf, fin, sets] = await Promise.all([
        fetchStudents(),
        fetchCoaches(),
        fetchBatches(),
        fetchAttendanceLogs(),
        fetchPerformanceLogs(),
        fetchFinancialLogs(),
        fetchSettings(),
      ]);
      setStudents(s);
      setCoaches(c);
      setBatches(b);
      setAttendanceLogs(att);
      setPerformanceLogs(perf);
      setFinancialLogs(fin);
      if (sets) setSettings(sets);
      setIsOnline(true);
      // Also cache locally
      await Promise.all([
        AsyncStorage.setItem(KEYS.students, JSON.stringify(s)),
        AsyncStorage.setItem(KEYS.coaches, JSON.stringify(c)),
        AsyncStorage.setItem(KEYS.batches, JSON.stringify(b)),
        AsyncStorage.setItem(KEYS.attendance, JSON.stringify(att)),
        AsyncStorage.setItem(KEYS.performance, JSON.stringify(perf)),
        AsyncStorage.setItem(KEYS.financial, JSON.stringify(fin)),
        sets ? AsyncStorage.setItem(KEYS.settings, JSON.stringify(sets)) : Promise.resolve(),
      ]);
    } catch (e) {
      console.warn("[Supabase load failed, falling back to local]", e);
      setIsOnline(false);
      await loadLocal();
    }
  };

  // Load from local AsyncStorage
  const loadLocal = async () => {
    const loadOrInit = async <T,>(key: string, fallback: T[]): Promise<T[]> => {
      const stored = await AsyncStorage.getItem(key);
      if (stored) return JSON.parse(stored) as T[];
      await AsyncStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    };

    const storedVersion = await AsyncStorage.getItem(KEYS.seedVersion);
    if (storedVersion !== DATA_SEED_VERSION) {
      await AsyncStorage.multiRemove([
        KEYS.students, KEYS.coaches, KEYS.batches, KEYS.schedules,
        KEYS.attendance, KEYS.performance, KEYS.financial,
        KEYS.notifications, KEYS.settings,
      ]);
      await AsyncStorage.setItem(KEYS.seedVersion, DATA_SEED_VERSION);
    }

    const [s, c, b, sch, att, perf, fin, notif, sets] = await Promise.all([
      loadOrInit(KEYS.students, mockStudents),
      loadOrInit(KEYS.coaches, mockCoaches),
      loadOrInit(KEYS.batches, mockBatches),
      loadOrInit(KEYS.schedules, mockSchedules),
      loadOrInit(KEYS.attendance, mockAttendanceLogs),
      loadOrInit(KEYS.performance, mockPerformanceLogs),
      loadOrInit(KEYS.financial, mockFinancialLogs),
      loadOrInit(KEYS.notifications, mockNotifications),
      AsyncStorage.getItem(KEYS.settings),
    ]);
    setStudents(s);
    setCoaches(c);
    setBatches(b);
    setSchedules(sch);
    setAttendanceLogs(att);
    setPerformanceLogs(perf);
    setFinancialLogs(fin);
    setNotifications(notif);
    if (sets) setSettings(JSON.parse(sets));
  };

  // Main load
  useEffect(() => {
    const init = async () => {
      if (useSupabase && SUPABASE_URL) {
        await loadSupabase();
      } else {
        await loadLocal();
      }
      setIsLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Local cache helper
  const saveLocal = async (key: string, data: unknown) => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  };

  // ─── Student Operations ─────────────────────────────────────────────────────────

  const addStudent = useCallback(async (student: Student, user: User) => {
    if (useSupabase && isOnline) {
      try {
        // Insert user first so login works, then insert student
        await insertUser(user);
        const saved = await insertStudent(student);
        setStudents((prev) => [saved, ...prev]);
        await saveLocal(KEYS.students, [...students, saved]);
        return;
      } catch (e) {
        console.warn("[Supabase] addStudent failed, falling back to local", e);
      }
    }
    const updated = [...students, student];
    setStudents(updated);
    await saveLocal(KEYS.students, updated);
  }, [students, useSupabase, isOnline]);

  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    if (useSupabase && isOnline) {
      try {
        await updateStudentRecord(id, updates);
      } catch (e) {
        console.warn("[Supabase] updateStudent failed, using local only", e);
      }
      // If parentMobile changed it is also the login ID — keep users table in sync
      if (updates.parentMobile) {
        const student = students.find((s) => s.id === id);
        if (student?.userId) {
          try {
            await updateUserRecord(student.userId, { loginId: updates.parentMobile });
          } catch (e) {
            console.warn("[Supabase] updateStudent loginId sync failed", e);
          }
        }
      }
    }
    const updated = students.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setStudents(updated);
    await saveLocal(KEYS.students, updated);
  }, [students, useSupabase, isOnline]);

  const deactivateStudent = useCallback(async (id: string) => {
    await updateStudent(id, { status: "inactive" });
  }, [updateStudent]);

  const reactivateStudent = useCallback(async (id: string) => {
    await updateStudent(id, { status: "active" });
  }, [updateStudent]);

  const transferBatch = useCallback(async (studentId: string, newBatchId: string) => {
    await updateStudent(studentId, { batchId: newBatchId });
  }, [updateStudent]);

  const deleteStudent = useCallback(async (id: string) => {
    const student = students.find((s) => s.id === id);
    if (useSupabase && isOnline) {
      try {
        await deleteStudentRecord(id);
        if (student?.userId) {
          try { await deleteUserRecord(student.userId); } catch {}
        }
      } catch (e) {
        console.warn("[Supabase] deleteStudent failed, removing locally", e);
      }
    }
    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);
    await saveLocal(KEYS.students, updated);
  }, [students, useSupabase, isOnline]);

  // ─── Coach Operations ─────────────────────────────────────────────────────────

  const addCoach = useCallback(async (coach: Coach, user: User) => {
    if (useSupabase && isOnline) {
      try {
        // Insert user first so login works, then insert coach
        await insertUser(user);
        const saved = await insertCoach(coach);
        setCoaches((prev) => [saved, ...prev]);
        await saveLocal(KEYS.coaches, [...coaches, saved]);
        return;
      } catch (e) {
        console.warn("[Supabase] addCoach failed, falling back to local", e);
      }
    }
    const updated = [...coaches, coach];
    setCoaches(updated);
    await saveLocal(KEYS.coaches, updated);
  }, [coaches, useSupabase, isOnline]);

  const updateCoach = useCallback(async (id: string, updates: Partial<Coach>) => {
    if (useSupabase && isOnline) {
      try {
        await updateCoachRecord(id, updates);
      } catch (e) {
        console.warn("[Supabase] updateCoach failed, using local only", e);
      }
      // If mobile changed it is also the login ID — keep users table in sync
      if (updates.mobile) {
        const coach = coaches.find((c) => c.id === id);
        if (coach?.userId) {
          try {
            await updateUserRecord(coach.userId, { loginId: updates.mobile });
          } catch (e) {
            console.warn("[Supabase] updateCoach loginId sync failed", e);
          }
        }
      }
    }
    const updated = coaches.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCoaches(updated);
    await saveLocal(KEYS.coaches, updated);
  }, [coaches, useSupabase, isOnline]);

  const deactivateCoach = useCallback(async (id: string) => {
    await updateCoach(id, { status: "inactive" });
  }, [updateCoach]);

  const reactivateCoach = useCallback(async (id: string) => {
    await updateCoach(id, { status: "active" });
  }, [updateCoach]);

  const deleteCoach = useCallback(async (id: string) => {
    const coach = coaches.find((c) => c.id === id);
    if (useSupabase && isOnline) {
      try {
        await deleteCoachRecord(id);
        if (coach?.userId) {
          try { await deleteUserRecord(coach.userId); } catch {}
        }
      } catch (e) {
        console.warn("[Supabase] deleteCoach failed, removing locally", e);
      }
    }
    const updated = coaches.filter((c) => c.id !== id);
    setCoaches(updated);
    await saveLocal(KEYS.coaches, updated);
  }, [coaches, useSupabase, isOnline]);

  // ─── Schedule ───────────────────────────────────────────────────────────────────────────────

  const addSchedule = useCallback(async (schedule: Schedule) => {
    const updated = [...schedules, schedule];
    setSchedules(updated);
    await saveLocal(KEYS.schedules, updated);
  }, [schedules]);

  const deleteSchedule = useCallback(async (id: string) => {
    const updated = schedules.filter((s) => s.id !== id);
    setSchedules(updated);
    await saveLocal(KEYS.schedules, updated);
  }, [schedules]);

  // ─── Attendance ────────────────────────────────────────────────────────────────────────────────────

  const submitAttendance = useCallback(async (log: AttendanceLog) => {
    if (useSupabase && isOnline) {
      try {
        await upsertAttendanceLog(log);
      } catch (e) {
        console.warn("[Supabase] submitAttendance failed, using local only", e);
      }
    }
    const existing = attendanceLogs.findIndex(
      (a) => a.batchId === log.batchId && a.date === log.date
    );
    let updated: AttendanceLog[];
    if (existing >= 0) {
      updated = attendanceLogs.map((a, i) => (i === existing ? log : a));
    } else {
      updated = [...attendanceLogs, log];
    }
    setAttendanceLogs(updated);
    await saveLocal(KEYS.attendance, updated);
  }, [attendanceLogs, useSupabase, isOnline]);

  const unlockAttendance = useCallback(async (logId: string) => {
    const log = attendanceLogs.find((a) => a.id === logId);
    if (!log) return;
    const unlocked = { ...log, isLocked: false };
    const updated = attendanceLogs.map((a) => (a.id === logId ? unlocked : a));
    setAttendanceLogs(updated);
    await saveLocal(KEYS.attendance, updated);
    if (useSupabase && isOnline) {
      try {
        await upsertAttendanceLog(unlocked);
      } catch (e) {
        console.warn("[Supabase] unlockAttendance failed", e);
      }
    }
  }, [attendanceLogs, useSupabase, isOnline]);

  // ─── Performance ──────────────────────────────────────────────────────────────────────────────────

  const savePerformance = useCallback(async (log: PerformanceLog) => {
    if (useSupabase && isOnline) {
      try {
        const saved = await insertPerformanceLog(log);
        setPerformanceLogs((prev) => [saved, ...prev]);
        await saveLocal(KEYS.performance, [saved, ...performanceLogs]);
        return;
      } catch (e) {
        console.warn("[Supabase] savePerformance failed, using local only", e);
      }
    }
    const updated = [...performanceLogs, log];
    setPerformanceLogs(updated);
    await saveLocal(KEYS.performance, updated);
  }, [performanceLogs, useSupabase, isOnline]);

  // ─── Fees ────────────────────────────────────────────────────────────────────────────────────────

  const uploadReceipt = useCallback(async (studentId: string, billingMonth: string, amount: number, receiptUri?: string) => {
    const id = `fee-${studentId}-${billingMonth}-${Date.now()}`;
    const existing = financialLogs.findIndex(
      (f) => f.studentId === studentId && f.billingMonth === billingMonth
    );
    const newLog: FinancialLog = {
      id,
      studentId,
      billingMonth,
      amount,
      status: "Pending",
      submittedAt: new Date().toISOString(),
      receiptUri,
    };
    let updated: FinancialLog[];
    if (existing >= 0) {
      updated = financialLogs.map((f, i) => (i === existing ? newLog : f));
    } else {
      updated = [...financialLogs, newLog];
    }
    setFinancialLogs(updated);
    await saveLocal(KEYS.financial, updated);
    if (useSupabase && isOnline) {
      try {
        await upsertFinancialLog(newLog);
      } catch (e) {
        console.warn("[Supabase] uploadReceipt failed", e);
      }
    }
  }, [financialLogs, useSupabase, isOnline]);

  const verifyReceipt = useCallback(async (logId: string, approved: boolean, note?: string, coachId?: string) => {
    const updated = financialLogs.map((f) =>
      f.id === logId
        ? {
            ...f,
            status: (approved ? "Paid" : "Rejected") as FinancialLog["status"],
            verifiedBy: coachId,
            verifiedAt: new Date().toISOString(),
            rejectionNote: note,
          }
        : f
    );
    setFinancialLogs(updated);
    await saveLocal(KEYS.financial, updated);
    if (useSupabase && isOnline) {
      const target = updated.find((f) => f.id === logId);
      if (target) {
        try {
          await upsertFinancialLog(target);
        } catch (e) {
          console.warn("[Supabase] verifyReceipt failed", e);
        }
      }
    }
  }, [financialLogs, useSupabase, isOnline]);

  // ─── Notifications ───────────────────────────────────────────────────────────────────────────────

  const markNotificationRead = useCallback(async (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    await saveLocal(KEYS.notifications, updated);
  }, [notifications]);

  // ─── Settings ──────────────────────────────────────────────────────────────────────────────────────

  const updateSettings = useCallback(async (updates: Partial<SystemSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    await saveLocal(KEYS.settings, updated);
    if (useSupabase && isOnline) {
      try {
        await upsertSettings(updated);
      } catch (e) {
        console.warn("[Supabase] updateSettings failed", e);
      }
    }
  }, [settings, useSupabase, isOnline]);

  // ─── Photo Upload ────────────────────────────────────────────────────────────────────────────────────────

  const uploadStudentPhoto = useCallback(async (studentId: string, file: string): Promise<string | null> => {
    if (!useSupabase || !isOnline) {
      return file;
    }
    try {
      const path = `students/${studentId}/${Date.now()}.jpg`;
      await uploadPhoto("cricket360", path, file);
      return getPhotoUrl("cricket360", path);
    } catch (e) {
      console.warn("[Supabase] uploadStudentPhoto failed", e);
      return file;
    }
  }, [useSupabase, isOnline]);

  const uploadQrPhoto = useCallback(async (file: string): Promise<string | null> => {
    if (!useSupabase || !isOnline) {
      return file;
    }
    try {
      const path = `settings/qr-${Date.now()}.jpg`;
      await uploadPhoto("cricket360", path, file);
      return getPhotoUrl("cricket360", path);
    } catch (e) {
      console.warn("[Supabase] uploadQrPhoto failed", e);
      return file;
    }
  }, [useSupabase, isOnline]);

  // ─── Helpers (unchanged) ────────────────────────────────────────────────────────────────────────────

  const getStudentsByBatch = useCallback(
    (batchId: string) => students.filter((s) => s.batchId === batchId && s.status === "active"),
    [students]
  );

  const getPendingReceipts = useCallback(
    (batchId: string) => {
      const batchStudentIds = students.filter((s) => s.batchId === batchId).map((s) => s.id);
      return financialLogs
        .filter((f) => f.status === "Pending" && batchStudentIds.includes(f.studentId))
        .map((log) => ({ log, student: students.find((s) => s.id === log.studentId)! }))
        .filter((r) => r.student);
    },
    [financialLogs, students]
  );

  const getDefaulters = useCallback(
    (batchId: string, month: string) => {
      const batchStudents = students.filter((s) => s.batchId === batchId && s.status === "active");
      return batchStudents.filter((student) => {
        const log = financialLogs.find((f) => f.studentId === student.id && f.billingMonth === month);
        return !log || log.status === "Unpaid" || log.status === "Rejected";
      });
    },
    [students, financialLogs]
  );

  const getStudentFeeStatus = useCallback(
    (studentId: string, month: string) => financialLogs.find((f) => f.studentId === studentId && f.billingMonth === month),
    [financialLogs]
  );

  const getStudentPerformance = useCallback(
    (studentId: string) => performanceLogs.filter((p) => p.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date)),
    [performanceLogs]
  );

  const getCoachBatches = useCallback(
    (coachId: string) => {
      const coach = coaches.find((c) => c.id === coachId);
      const coachBatchIds = coach?.batchIds ?? [];
      return batches.filter(
        (b) => b.coachIds.includes(coachId) || coachBatchIds.includes(b.id)
      );
    },
    [batches, coaches]
  );

  const getTodayAttendance = useCallback(
    (batchId: string, date: string) => attendanceLogs.find((a) => a.batchId === batchId && a.date === date),
    [attendanceLogs]
  );

  const getUnreadCount = useCallback(
    (role: string, userId?: string) =>
      notifications.filter((n) => {
        if (n.read) return false;
        if (n.forUserId && n.forUserId !== userId) return false;
        return n.forRole === role;
      }).length,
    [notifications]
  );

  return (
    <DataContext.Provider
      value={{
        students,
        coaches,
        batches,
        schedules,
        attendanceLogs,
        performanceLogs,
        financialLogs,
        notifications,
        settings,
        isLoading,
        isOnline,
        useSupabase,
        resetPassword,
        addStudent,
        updateStudent,
        deactivateStudent,
        reactivateStudent,
        transferBatch,
        deleteStudent,
        addCoach,
        updateCoach,
        deactivateCoach,
        reactivateCoach,
        deleteCoach,
        addSchedule,
        deleteSchedule,
        submitAttendance,
        unlockAttendance,
        savePerformance,
        uploadReceipt,
        verifyReceipt,
        markNotificationRead,
        updateSettings,
        uploadStudentPhoto,
        uploadQrPhoto,
        getStudentsByBatch,
        getPendingReceipts,
        getDefaulters,
        getStudentFeeStatus,
        getStudentPerformance,
        getCoachBatches,
        getTodayAttendance,
        getUnreadCount,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be inside DataProvider");
  return ctx;
}
