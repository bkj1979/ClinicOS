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
- Node.js 18+ (tested on Node v24.16.0)
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

Open [http://localhost:3000](http://localhost:3000) in your browser. The app will automatically redirect to the interactive ClinicOS Dashboard (`/dashboard`).

### Production Build

```bash
npm run build
npm run start
```
