# ClinicOS — Intelligent Medical Practice Management Platform

> State-of-the-art, AI-native Clinic Operating System built for Indian outpatient healthcare practices. ABDM & NABH compliant ready.

---

## 🌟 Key Features & Modules

### 1. 📅 Appointments & Live OPD Queue
- **Multi-channel Appointment Scheduling**: Scheduled, walk-in, and follow-up patient flows.
- **Doctor & Department Filtering**: Fast filtering across General Medicine, Cardiology, Dermatology, Orthopedics, and Pediatrics.
- **Kanban-Style Live OPD Queue**: 
  - Real-time token system with 3-column Kanban board (**Waiting**, **In Consultation**, **Completed**).
  - Urgency indicators (Normal, Urgent, Emergency) with vitals recording badges.
  - Doctor actions: **Call Next**, **Skip**, **Recall**, and **Mark No-Show**.
  - Integrated **TV Display Mode** for clinic waiting area monitors.
  - **Walk-in Quick Registration** modal for reception desks.

### 2. 🎙️ AI Voice Scribe & Ambient Documentation
- **Ambient Clinical Listening Interface**: Visual audio waveform animation with real-time recording timer.
- **Multilingual Support**: Supports English, Hindi, Kannada, Tamil, and Telugu with optional language auto-detection.
- **Automated SOAP Note Generation**: Converts patient-doctor conversation directly into structured Subjective, Objective, Assessment, and Plan notes.
- **Autonomous ICD-11 Coding**: Generates relevant ICD-11 codes with confidence percentages.
- **Clinical Synopsis**: One-click "Copy to EMR" and encounter integration.

### 3. 💊 Rx Pharmacy & Inventory Management
- **Central Drug Master Database**: 12+ drug formulations with HSN codes, schedules (H, H1, X, OTC), batch tracking, and rack locations.
- **Stock Tracking & Alerts**: Visual progress bars with automated low-stock and critical shortage warnings.
- **Purchase Order Workflow**: Supplier management, purchase orders creation, status tracking, and automated stock replenishment.
- **Dispensing Station**: Barcode/prescription search, batch verification, and one-click stock deduction.

### 4. 💰 Billing, Payments & Receipts
- **Unified Charge Capture**: Itemized billing across consultations, procedures, pharmacy, and diagnostic laboratory orders.
- **GST-Compliant Tax Invoicing**: Multi-tier tax breakdown (5%, 12%, 18%) with discount handling.
- **Multi-Mode Payment Acceptance**: Cash, UPI, Card, and Insurance/TPA processing.
- **Thermal & Letterhead Receipts**: Print-ready, branded receipt preview with QR code, tax summary, and amount in words.

### 5. 📋 EMR with Specialty Charting
- **Patient Registry**: Instant lookup by Name, Mobile Number, UHID, or ABHA ID.
- **Comprehensive Demographic Profile**: Allergies (red banner alerts), chronic conditions, emergency contacts, and insurance details.
- **Doctor Consultation Workspace**:
  - Interactive vitals entry with color-coded normal/warning/critical thresholds (BP, HR, SpO2, Temp, Blood Sugar, BMI, Pain Scale).
  - Specialty-tailored clinical history and past encounter timeline.
  - Lab test ordering with live status tracking (Biochemistry, Pathology, etc.).

### 6. 📝 Smart Prescriptions & e-Rx
- **Rapid Digital Prescriptions**: Prescribe medications in under 30 seconds with dosage, frequency, route, duration, and food timing.
- **Drug-Drug & Allergy Interaction Alerts**: Automated safety checks highlighting severity (Mild, Moderate, Severe) with clinical action guidance.
- **Digital Rx & QR Code**: Print on custom clinic letterhead or share digitally via e-Rx.

### 7. 🏛️ ABDM & NABH Compliance Ready
- **ABDM Integration Dashboard**:
  - ABHA ID creation, verification, and linking statistics.
  - Health Information Provider (HIP) & Health Information User (HIU) status indicators.
  - Consent Manager framework & health record push logs.
- **NABH Quality Indicator Checklist**:
  - 10 chapters evaluated (AAC, COP, MOM, PRE, HIC, CQI, ROM, FMS, HRM, IMS).
  - Expandable quality criteria with progress scoring (78% current compliance benchmark).

### 8. 📊 Analytics & Multi-Centre Business Intelligence
- **Executive KPI Cards**: Revenue, footfall, average revenue per patient, new vs repeat patient split, retention rate, and wait times.
- **Interactive Visualizations (Recharts)**:
  - 6-month Revenue trend (Area chart).
  - Departmental revenue contribution (Horizontal bar chart).
  - Age vs Gender demographics (Stacked bar chart).
  - Hourly walk-in vs scheduled patient census.
  - Top 8 clinic diagnoses breakdown.
  - Payment mode distribution (Pie chart).
- **Multi-Centre Comparison**: Side-by-side performance comparison for Koramangala, Indiranagar, and HSR Layout centres.
- **Doctor Productivity Metrics**: Consultations completed, revenue generated, average consultation duration, and patient satisfaction ratings.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22.18+ (tested on Node v24.16.0)
- npm 10+

### Installation & Running

```bash
# Navigate to the project directory
cd "clinic-os"

# Install dependencies (if not already installed)
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the ClinicOS landing page. Choose **Sign in** to access the clinic workspace. On first run, the one-time setup screen asks the clinic administrator to set a password; administrators can set passwords for other staff accounts in **Settings → Users & Roles**. Login IDs use each user's email in the Users table.

ClinicOS stores login IDs, roles, and salted password hashes in the SQLite `auth_users` table; it never stores or displays plaintext passwords. The `auth_sessions` table stores hashed session tokens. Account roles (`doctor`, `receptionist`, `pharmacist`, `nurse`, `lab_tech`, `admin`) are synchronized from the `users` table. The `admin@clinicos.in` account has administrator access; other seeded accounts retain their listed roles. Use **My Profile** to change your own password and **Sign Out** to end your session.

Administrators can add staff from **Settings → Users & Roles → Add User**. Enter the name and select a role; the login ID is generated from the name (for example, **Dr Hitendra Pandey** becomes `hitendra.pandey@clinicos.in`). After creating the account, choose **Set password** in the account list. New accounts are saved in both `users` and `auth_users`.

#### Configure optional Google sign-in

Google sign-in is shown when all three server-only environment variables are configured. In Google Cloud Console, create an OAuth 2.0 **Web application** client and add the callback URI below to its authorized redirect URIs:

```text
http://localhost:3000/api/auth/google/callback
```

Add these values to an untracked `.env.local` file in the project root (never commit the client secret):

```text
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

Restart the development server after editing `.env.local`. Google sign-in uses OAuth state and PKCE, requires a verified Google email, and only signs in an existing active ClinicOS user whose login ID matches that email; it does not create or link accounts automatically. Use an HTTPS redirect URI outside local development.

### Store the demo data in local SQLite

Most screens still use in-memory demo data. The Patient Registry, Appointments, and OPD Queue load persisted records from SQLite. Patient registration, appointment creation/status changes, and walk-in registration (patient, appointment, and queue entry) are saved locally. To create or reset the local database with the demo collections, use Node.js 22.18 or newer and run:

```bash
npm run db:seed
```

This creates `prisma/clinic-os.db` and resets its contents to the demo data each time the command runs; it removes patients registered since the previous seed. Each collection has its own typed table (such as `patients`, `appointments`, `drugs`, `invoices`, and `encounters`); nested objects and lists are stored as JSON columns. The schema is defined in `prisma/schema.sql`. SQLite is provided by Node.js, so no separate database server or SQLite installation is needed. The seed includes sample clinical records; it is demo data, not a production database.

### Try the local-only AI Voice Scribe

Voice Scribe can record a consultation, transcribe it with a local Whisper model, draft editable SOAP notes with a local Ollama model, and save the draft encounter in SQLite. Microphone audio and patient details are sent only to services on this computer. Raw audio is deleted after transcription; transcript and notes are stored only when **Save Draft to EMR** is clicked. Model files are downloaded once from their respective providers.

Use Python 3.10 or newer. Install Ollama for Windows, open it, then download the compact language model:

```bash
ollama pull qwen2.5:1.5b
```

Install the local speech service dependencies and start that service in a separate terminal:

```bash
npm run voice-scribe:setup
npm run voice-scribe:local
```

The first speech-service start downloads the multilingual Whisper `base` model. Keep the local speech service and Ollama running, start ClinicOS with `npm run dev`, and open **AI Voice Scribe**. Select a registered patient, choose a language (or enable auto-detect), record, and review/correct the transcript and draft before saving. For safety, AI output is an unsigned draft and must be reviewed by a clinician; this prototype does not generate or approve diagnoses or prescriptions.

### Production Build

```bash
npm run build
npm run start
```
