CREATE TABLE IF NOT EXISTS centres (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  gst_no TEXT NOT NULL,
  registration_no TEXT NOT NULL,
  is_active INTEGER NOT NULL CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  phone TEXT NOT NULL,
  specialization TEXT,
  registration_no TEXT,
  avatar TEXT,
  is_active INTEGER NOT NULL CHECK (is_active IN (0, 1)),
  centres_json TEXT NOT NULL CHECK (json_valid(centres_json))
);

CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  login_id TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT,
  role TEXT NOT NULL CHECK (role IN ('doctor', 'receptionist', 'pharmacist', 'nurse', 'admin')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  auth_user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  uhid TEXT NOT NULL UNIQUE,
  abha_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  gender TEXT NOT NULL,
  dob TEXT NOT NULL,
  age INTEGER NOT NULL,
  blood_group TEXT,
  address_json TEXT CHECK (address_json IS NULL OR json_valid(address_json)),
  emergency_contact_json TEXT CHECK (emergency_contact_json IS NULL OR json_valid(emergency_contact_json)),
  allergies_json TEXT NOT NULL CHECK (json_valid(allergies_json)),
  chronic_conditions_json TEXT NOT NULL CHECK (json_valid(chronic_conditions_json)),
  insurance_info_json TEXT CHECK (insurance_info_json IS NULL OR json_valid(insurance_info_json)),
  registered_at TEXT NOT NULL,
  last_visit TEXT,
  total_visits INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_age INTEGER NOT NULL,
  patient_gender TEXT NOT NULL,
  doctor_id TEXT NOT NULL REFERENCES users(id),
  doctor_name TEXT NOT NULL,
  department TEXT NOT NULL,
  date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  token_number TEXT,
  chief_complaint TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS appointments_doctor_slot_unique_idx
  ON appointments (doctor_id, date, time_slot)
  WHERE status <> 'cancelled';

CREATE TABLE IF NOT EXISTS opd_queue (
  id TEXT PRIMARY KEY,
  token_number TEXT NOT NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  patient_name TEXT NOT NULL,
  patient_age INTEGER NOT NULL,
  patient_gender TEXT NOT NULL,
  appointment_id TEXT NOT NULL REFERENCES appointments(id),
  doctor_id TEXT NOT NULL REFERENCES users(id),
  doctor_name TEXT NOT NULL,
  department TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  check_in_time TEXT NOT NULL,
  consult_start_time TEXT,
  consult_end_time TEXT,
  estimated_wait_minutes INTEGER NOT NULL,
  vitals_recorded INTEGER NOT NULL CHECK (vitals_recorded IN (0, 1))
);

CREATE TABLE IF NOT EXISTS drugs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT NOT NULL,
  category TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  dosage_form TEXT NOT NULL,
  strength TEXT NOT NULL,
  hsn_code TEXT NOT NULL,
  schedule TEXT NOT NULL,
  mrp REAL NOT NULL,
  purchase_price REAL NOT NULL,
  gst_percent REAL NOT NULL,
  current_stock INTEGER NOT NULL,
  min_stock INTEGER NOT NULL,
  max_stock INTEGER NOT NULL,
  reorder_level INTEGER NOT NULL,
  unit TEXT NOT NULL,
  rack_location TEXT NOT NULL,
  is_active INTEGER NOT NULL CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  gst_no TEXT NOT NULL,
  drug_license_no TEXT NOT NULL,
  address TEXT NOT NULL,
  is_active INTEGER NOT NULL CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS encounters (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  patient_name TEXT NOT NULL,
  doctor_id TEXT NOT NULL REFERENCES users(id),
  doctor_name TEXT NOT NULL,
  date TEXT NOT NULL,
  department TEXT NOT NULL,
  type TEXT NOT NULL,
  chief_complaint TEXT NOT NULL,
  vitals_json TEXT CHECK (vitals_json IS NULL OR json_valid(vitals_json)),
  notes_json TEXT NOT NULL CHECK (json_valid(notes_json)),
  diagnoses_json TEXT NOT NULL CHECK (json_valid(diagnoses_json)),
  prescriptions_json TEXT NOT NULL CHECK (json_valid(prescriptions_json)),
  lab_orders_json TEXT NOT NULL CHECK (json_valid(lab_orders_json)),
  procedures_json TEXT NOT NULL CHECK (json_valid(procedures_json)),
  follow_up_date TEXT,
  attachments_json TEXT NOT NULL CHECK (json_valid(attachments_json)),
  ai_transcript TEXT,
  ai_soap_notes TEXT,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_no TEXT NOT NULL UNIQUE,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  encounter_id TEXT REFERENCES encounters(id),
  date TEXT NOT NULL,
  items_json TEXT NOT NULL CHECK (json_valid(items_json)),
  subtotal REAL NOT NULL,
  total_discount REAL NOT NULL,
  total_gst REAL NOT NULL,
  grand_total REAL NOT NULL,
  amount_paid REAL NOT NULL,
  balance REAL NOT NULL,
  status TEXT NOT NULL,
  payments_json TEXT NOT NULL CHECK (json_valid(payments_json)),
  notes TEXT,
  centre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY,
  prescription_no TEXT NOT NULL UNIQUE,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  patient_name TEXT NOT NULL,
  doctor_id TEXT NOT NULL REFERENCES users(id),
  doctor_name TEXT NOT NULL,
  encounter_id TEXT NOT NULL REFERENCES encounters(id),
  date TEXT NOT NULL,
  items_json TEXT NOT NULL CHECK (json_valid(items_json)),
  diagnoses_json TEXT NOT NULL CHECK (json_valid(diagnoses_json)),
  advice TEXT NOT NULL,
  follow_up_date TEXT,
  status TEXT NOT NULL,
  qr_code TEXT
);

CREATE TABLE IF NOT EXISTS revenue_by_month (
  month TEXT PRIMARY KEY,
  revenue REAL NOT NULL,
  patients INTEGER NOT NULL,
  consultations INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS department_revenue (
  department TEXT PRIMARY KEY,
  value REAL NOT NULL,
  patients INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_demographics (
  age_group TEXT PRIMARY KEY,
  male INTEGER NOT NULL,
  female INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS top_diagnoses (
  diagnosis TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  percentage REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS centre_comparison (
  centre_name TEXT PRIMARY KEY,
  revenue REAL NOT NULL,
  patients INTEGER NOT NULL,
  satisfaction REAL NOT NULL,
  avg_wait_time INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_patient_flow (
  hour TEXT PRIMARY KEY,
  walkin INTEGER NOT NULL,
  scheduled INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS patients_name_idx ON patients(name);
CREATE INDEX IF NOT EXISTS patients_phone_idx ON patients(phone);
CREATE INDEX IF NOT EXISTS appointments_date_idx ON appointments(date);
CREATE INDEX IF NOT EXISTS appointments_patient_id_idx ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS encounters_patient_id_idx ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS invoices_patient_id_idx ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS prescriptions_patient_id_idx ON prescriptions(patient_id);
