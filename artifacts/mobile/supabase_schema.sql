-- Cricket360 Supabase Schema
-- Run this in the Supabase SQL Editor (Table Editor > SQL Editor)
-- Region: ap-south-1

-- ─── Enable UUID extension ───────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Batches ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.batches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  age_range TEXT NOT NULL,
  coach_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Users (auth-linked profiles) ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'student')),
  login_id TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  is_first_login BOOLEAN DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  linked_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Coaches ───────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coaches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  designation TEXT NOT NULL DEFAULT 'Coach',
  hrms_id TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  photo_url TEXT,
  batch_ids TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ─── Students ─────────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  father_name TEXT NOT NULL,
  is_railway BOOLEAN NOT NULL DEFAULT FALSE,
  designation TEXT,
  department TEXT,
  pf_no TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  parent_mobile TEXT NOT NULL,
  whatsapp_no TEXT,
  email TEXT,
  address TEXT NOT NULL,
  date_of_registration TEXT NOT NULL,
  registration_fees INTEGER NOT NULL DEFAULT 500,
  date_of_admission TEXT NOT NULL,
  admission_fees INTEGER NOT NULL DEFAULT 1000,
  photo_url TEXT,
  batch_id TEXT NOT NULL REFERENCES public.batches(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  height INTEGER,
  weight INTEGER,
  playing_role TEXT CHECK (playing_role IN ('Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Performance Logs ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.performance_logs (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  batch_id TEXT NOT NULL REFERENCES public.batches(id),
  coach_id TEXT NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  batting_na BOOLEAN NOT NULL DEFAULT FALSE,
  footwork INTEGER CHECK (footwork BETWEEN 1 AND 5),
  shot_selection INTEGER CHECK (shot_selection BETWEEN 1 AND 5),
  timing INTEGER CHECK (timing BETWEEN 1 AND 5),
  bowling_na BOOLEAN NOT NULL DEFAULT FALSE,
  line_and_length INTEGER CHECK (line_and_length BETWEEN 1 AND 5),
  action INTEGER CHECK (action BETWEEN 1 AND 5),
  pace_and_variation INTEGER CHECK (pace_and_variation BETWEEN 1 AND 5),
  fielding_na BOOLEAN NOT NULL DEFAULT FALSE,
  catching INTEGER CHECK (catching BETWEEN 1 AND 5),
  ground_fielding INTEGER CHECK (ground_fielding BETWEEN 1 AND 5),
  throwing INTEGER CHECK (throwing BETWEEN 1 AND 5),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Attendance Logs ───────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES public.batches(id),
  coach_id TEXT NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  entries JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(batch_id, date)
);

-- ─── Financial Logs (Fees) ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.financial_logs (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  billing_month TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Unpaid', 'Pending', 'Paid', 'Rejected')),
  receipt_uri TEXT,
  verified_by TEXT,
  rejection_note TEXT,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  UNIQUE(student_id, billing_month)
);

-- ─── Settings ──────────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  fee_amount INTEGER NOT NULL DEFAULT 500,
  upi_id TEXT NOT NULL,
  beneficiary_name TEXT NOT NULL,
  qr_code_url TEXT,
  whatsapp_group_link TEXT,
  academy_name TEXT NOT NULL DEFAULT 'Cricket360',
  academy_address TEXT,
  academy_phone TEXT,
  academy_email TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Notifications ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  for_role TEXT NOT NULL CHECK (for_role IN ('admin', 'coach', 'student')),
  for_user_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  link_id TEXT
);

-- ─── Indexes ────────────────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_performance_student ON public.performance_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_performance_date ON public.performance_logs(date);
CREATE INDEX IF NOT EXISTS idx_attendance_batch_date ON public.attendance_logs(batch_id, date);
CREATE INDEX IF NOT EXISTS idx_financial_student ON public.financial_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_financial_month ON public.financial_logs(billing_month);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON public.notifications(for_role, for_user_id);

-- ─── RLS Policies (Row Level Security) ───────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow read for all authenticated users (app-level auth via loginId)
-- In production, use Supabase Auth with custom claims for stricter RLS
CREATE POLICY "Allow all reads" ON public.batches FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON public.coaches FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON public.performance_logs FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON public.attendance_logs FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON public.financial_logs FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow all reads" ON public.settings FOR SELECT USING (true);

-- Allow all writes (app-level authorization checks in code)
CREATE POLICY "Allow all inserts" ON public.batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all inserts" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all inserts" ON public.coaches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all inserts" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all inserts" ON public.performance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all inserts" ON public.attendance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all inserts" ON public.financial_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all inserts" ON public.notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all updates" ON public.batches FOR UPDATE USING (true);
CREATE POLICY "Allow all updates" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow all updates" ON public.coaches FOR UPDATE USING (true);
CREATE POLICY "Allow all updates" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Allow all updates" ON public.performance_logs FOR UPDATE USING (true);
CREATE POLICY "Allow all updates" ON public.attendance_logs FOR UPDATE USING (true);
CREATE POLICY "Allow all updates" ON public.financial_logs FOR UPDATE USING (true);
CREATE POLICY "Allow all updates" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Allow all updates" ON public.settings FOR UPDATE USING (true);

CREATE POLICY "Allow all deletes" ON public.students FOR DELETE USING (true);
CREATE POLICY "Allow all deletes" ON public.coaches FOR DELETE USING (true);
CREATE POLICY "Allow all deletes" ON public.users FOR DELETE USING (true);

-- ─── Seed Data (Batches + Default Settings) ─────────────────────────────────────────────

INSERT INTO public.batches (id, name, label, age_range, coach_ids) VALUES
  ('batch-a', 'Group A', '6-10 years', '6-10 years', '{}'),
  ('batch-b', 'Group B', '11-15 years', '11-15 years', '{}'),
  ('batch-c', 'Group C', '15+ yrs', '15+ yrs', '{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.settings (id, fee_amount, upi_id, beneficiary_name, academy_name, academy_address, academy_phone, academy_email) VALUES
  (1, 500, 'cricket360@upi', 'Cricket360 Academy', 'Cricket360 Academy', 'Dhanbad, Jharkhand', '9999999999', 'admin@cricket360.in')
ON CONFLICT (id) DO NOTHING;

-- ─── Storage bucket policy (make it public) ────────────────────────────────────────────────

-- Enable public access to the cricket360 bucket (already done via UI, but included here for completeness)
-- Go to Storage > Policies and add: (role() = 'anon') for SELECT on objects and buckets
