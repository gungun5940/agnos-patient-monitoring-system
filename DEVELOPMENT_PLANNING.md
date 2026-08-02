# Development Planning & Architecture Documentation

เอกสารอธิบายสถาปัตยกรรม การออกแบบ และโครงสร้างการทำงานของโปรเจกต์ (Developer Documentation) สำหรับระบบ Agnos Patient Registration & Live Monitor

---

## 🇹🇭 Thai Version (ภาษาไทย)

### 1. Project Structure (โครงสร้างโปรเจกต์)

โปรเจกต์นี้ใช้โครงสร้าง Next.js 15 (App Router) แบบมาตรฐานโดยไม่มีโฟลเดอร์ `src` คั่นกลาง จัดเก็บโค้ดตามหน้าที่ของแต่ละไฟล์อย่างชัดเจนดังนี้:

```text
.
├── app/
│   ├── globals.css         # ไฟล์กำหนดสไตล์หลัก (Tailwind CSS v4 + Custom Utilities)
│   ├── layout.tsx          # Root Layout ครอบส่วนหัว ฟอนต์ Sarabun/Plus Jakarta Sans และโครงสร้างเว็บ
│   ├── page.tsx            # หน้าเลือกบทบาทเริ่มต้น (Patient Portal หรือ Staff Dashboard)
│   ├── patient/
│   │   └── page.tsx        # หน้าลงทะเบียนคนไข้ (ฟอร์ม 12 ช่อง + Hook ดัก Event + Realtime Session)
│   └── staff/
│       └── page.tsx        # หน้าจอ Dashboard ติดตามผลแบบ Real-time + ระบบ Staff Password Gate
├── components/
│   └── ui/
│       ├── Button.tsx      # Reusable Button Component สไตล์ Clean Code รองรับ Variant
│       ├── Input.tsx       # Reusable Input Component พร้อม Error Display และ Focus Wrapper
│       └── StatusBadge.tsx # Component แสดงป้ายสถานะ (Inactive, Filling, Submitted)
├── hooks/
│   └── useRealTimeSync.ts  # Custom Hook ศูนย์กลางจัดการ Realtime Engine (Multi-Session, Supabase Broadcast, BroadcastChannel, LocalStorage Sync)
├── lib/
│   └── supabase.ts        # ไฟล์สร้าง Supabase Client พร้อมค่า credentials และระบบ fallback
├── types/
│   └── patient.ts         # ไฟล์นิยาม TypeScript Interfaces (PatientFormData, PatientRecord, PatientSession), Zod Schema และ Thai Field Map
├── package.json            # ไฟล์จัดการ Dependencies และ Scripts
└── README.md               # เอกสารคำแนะนำการติดตั้งและฟีเจอร์ของโปรเจกต์
```

---

### 2. Key Architectural Updates & Features (คุณสมบัติและสถาปัตยกรรมที่อัปเดตล่าสุด)

1. **ระบบติดตามคนไข้หลายคนพร้อมกันแบบ Concurrency (Multi-Patient Live Grid)**:
   - เพิ่มระบบสร้าง `sessionId` เฉพาะของแต่ละแท็บคนไข้ (`SES-XXXXXX`)
   - หน้า Staff Dashboard แสดงผลเป็น Live Grid Cards ติดตามคนไข้หลายคนที่กำลังเปิดกรอกฟอร์มพร้อมกันได้เรียลไทม์ โดยแต่ละการ์ดจะแสดง Focus Field, Draft Values และสถานะการกรอกของคนไข้คนนั้นๆ โดยเฉพาะ

2. **ระบบล้างสถานะอัตโนมัติเมื่อกดปุ่มย้อนกลับหรือปิดหน้าจอ (Session Leave & Automatic Cleanup)**:
   - ปรับปรุง `useRealTimeSync` และ `app/patient/page.tsx` เมื่อคนไข้กดปุ่มย้อนกลับ (Back Button) ล้างฟอร์ม หรือ Unmount หน้าจอ
   - ระบบจะส่งสัญญาณ `session_leave` หรือ `reset` ไปยังเจ้าหน้าที่ทันที และทำการลบการ์ดเซสชันนั้นออกจากหน้าจอเจ้าหน้าที่ (`delete copy[sessionId]`) ทำให้ไม่มีการ์ดค้างบนแดชบอร์ด

3. **ระบบรักษาความปลอดภัยด่านหน้าเจ้าหน้าที่ (Staff Security Password Gate)**:
   - หน้า `/staff` เพิ่มหน้าจอปลดล็อกด้วยรหัสผ่านเจ้าหน้าที่ (อ่านจาก `process.env.NEXT_PUBLIC_STAFF_PASSWORD` หรือ Default: `AgnosStaff2026`)
   - จัดเก็บสถานะยืนยันตัวตนใน `sessionStorage` เพื่อป้องกันผู้ไม่เกี่ยวข้องเข้าถึงข้อมูลสุขภาพส่วนบุคคลของคนไข้

4. **ระบบ Multi-Channel Sync Engine (Supabase + BroadcastChannel + LocalStorage)**:
   - รองรับการเชื่อมต่อข้ามเบราว์เซอร์ผ่าน Supabase Realtime Broadcast & Presence
   - รองรับการเชื่อมต่อข้ามแท็บภายในเครื่องเดียวกันผ่าน `BroadcastChannel` และ `storage` Event Fallback เพื่อความเสถียรและเร็วสูงสุดระดับมิลลิวินาที

---

### 3. Design Decisions (แนวคิดการออกแบบ UI/UX)

1. **ลดภาระทางสมองของคนไข้ (Reduced Cognitive Load)**:
   - ฟอร์มเก็บข้อมูลคนไข้มีทั้งหมด 12 ช่อง การวางทอดยาวติดกันในหน้าเดียวจะทำให้ผู้ใช้รู้สึกอึดอัดและสับสน
   - จัดกลุ่มฟอร์มแบ่งออกเป็น 4 การ์ดหลัก ได้แก่:
     1. *ข้อมูลส่วนตัว* (คำนำหน้า, ชื่อ, นามสกุล, วันเกิด)
     2. *ข้อมูลติดต่อ* (เบอร์โทรศัพท์, อีเมล, ที่อยู่)
     3. *ข้อมูลทั่วไป* (เชื้อชาติ, สัญชาติ, ภาษาที่ใช้)
     4. *ข้อมูลผู้ติดต่อฉุกเฉิน* (ชื่อผู้ติดต่อฉุกเฉิน, เบอร์โทรผู้ติดต่อฉุกเฉิน)
   - การแบ่งหมวดช่วยให้คนไข้โฟกัสการกรอกทีละส่วนได้อย่างราบรื่น

2. **ลดความเมื่อยล้าสายตาของเจ้าหน้าที่ (Reduced Screen Fatigue - Dark Mode)**:
   - เจ้าหน้าที่โรงพยาบาลต้องจ้องหน้าจอติดตามผลตลอดทั้งวัน
   - ออกแบบหน้า `/staff` ให้เป็น Dark Mode โทนสีน้ำเงินเข้มข้น (`bg-slate-950`) เพื่อช่วยถนอมสายตา ลดแสงสะท้อน และแยกแยะสถานะที่มีสีสว่างสดใส (เช่น สีเขียว Emerald สำหรับ Submitted, สีฟ้า Cyan สำหรับ Filling) ได้ง่ายขึ้น

3. **รองรับทุกขนาดหน้าจอ (Responsive Layout)**:
   - ฝั่งคนไข้รองรับการใช้งานผ่านโทรศัพท์มือถือและแท็บเล็ต ด้วย Layout แบบ Single-column และ Touch Target ที่มีขนาดใหญ่กว่า 44px
   - ฝั่งเจ้าหน้าที่รองรับหน้าจอคอมพิวเตอร์และมอนิเตอร์กว้าง ด้วยระบบ Live Patient Grid Cards แสดงข้อมูลคนไข้แต่ละคนที่กำลังลงทะเบียนพร้อมกัน

---

### 4. Component Architecture (สถาปัตยกรรมคอมโพเนนต์)

เลือกใช้หลักการ Clean Code และ Atomic Design ในการแยกคอมโพเนนต์เพื่อไม่ให้เกิดโค้ดซ้ำซ้อน (DRY Principle):

- **`Input.tsx`**:
  - รับ props สำหรับการจัดการฟอร์ม (`register`, `error`, `icon`, `onFocus`, `onBlur`)
  - ซ่อนการจัดการขอบสีแดงเตือน Error และการแสดงไอคอนไว้ภายในตัวเอง ทำให้โค้ดในหน้า `patient/page.tsx` อ่านง่ายและกระชับ
- **`Button.tsx`**:
  - รองรับ variants เช่น `primary`, `secondary`, `ghost`, `danger`, `staff` พร้อมจัดการสถานะ `isLoading` และไอคอน
- **`StatusBadge.tsx`**:
  - แสดงผลไฟแสดงสถานะกระพริบ (Pulsing dot) พร้อมข้อความภาษาไทยและสีประจำสถานะอย่างเป็นเอกภาพ
- **`useRealTimeSync.ts` (Network & State Encapsulation)**:
  - แยก logic ทางด้านเน็ตเวิร์กออกจาก UI Component อย่างเด็ดขาด
  - บริหารจัดการ multi-patient sessions, Broadcast Events, ล้างค่าเมื่อ unmount / leave และซิงค์ข้อมูลผ่านหลายช่องทาง

---

### 5. Real-Time Synchronization Flow (การไหลของข้อมูล)

```text
+------------------------------------+             +------------------------------------+
|  Patient View (/patient)           |             |  Staff Dashboard (/staff)          |
+------------------------------------+             +------------------------------------+
                  |                                                  ^
   (1) User Opens Form (New Session)                                 |
                  |                                                  |
                  v                                                  |
     Presence & Session Register     ────── Broadcast/Presence ──────┤ (2) Creates Live Patient Card
     payload: { sessionId: 'SES-1234' }                              |     in Multi-Patient Grid
                  |                                                  |
   (3) User Focuses Input Field                                      |
                  |                                                  |
                  v                                                  |
     Instant Active Field Broadcast  ────── Broadcast/Channel ───────┤ (4) Highlights Active Field
     payload: { fieldName: 'firstName' }                             |     & Status -> "filling"
                  |                                                  |
   (5) User Types Data (Debounced 3s)                                |
                  |                                                  |
                  v                                                  |
     Debounced Draft Payload Broadcast ───── Broadcast/Channel ──────┤ (6) Live Updates Draft Values
     payload: { draft: { firstName: 'สมชาย' } }                     |     in Patient's Specific Card
                  |                                                  |
   (7) User Clicks Back / Leaves Page                                |
                  |                                                  |
                  v                                                  |
     Session Leave Broadcast         ────── Broadcast/Channel ───────┘ (8) Removes Card Immediately
     payload: { type: 'session_leave' }                                    (No Stale Inactive Cards Left)
```

---

## 🇬🇧 English Version

### 1. Project Structure

This project follows the Next.js 15 (App Router) convention without a `src` folder, structuring codebase responsibilities cleanly:

```text
.
├── app/
│   ├── globals.css         # Global styling with Tailwind CSS v4
│   ├── layout.tsx          # Root layout defining fonts and HTML wrapper
│   ├── page.tsx            # Role selection portal (Patient vs. Staff)
│   ├── patient/
│   │   └── page.tsx        # Patient intake form page with realtime session sync
│   └── staff/
│       └── page.tsx        # Staff live monitoring dashboard with Security Gate
├── components/
│   └── ui/
│       ├── Button.tsx      # Reusable button component with variant support
│       ├── Input.tsx       # Reusable input component handling errors and focus
│       └── StatusBadge.tsx # Status badge component (Inactive, Filling, Submitted)
├── hooks/
│   └── useRealTimeSync.ts  # Custom hook encapsulating Supabase Realtime, BroadcastChannel, and Multi-Session state
├── lib/
│   └── supabase.ts        # Supabase client initializer with fallback credentials
├── types/
│   └── patient.ts         # TypeScript interfaces (PatientFormData, PatientRecord, PatientSession), Zod schema, and Thai field mappings
├── package.json            # Project dependencies and script declarations
└── README.md               # Setup guide and project documentation
```

---

### 2. Key Architectural Updates & Features

1. **Multi-Patient Concurrency Support**:
   - Generates unique `sessionId` strings (`SES-XXXXXX`) for each patient browser tab.
   - The Staff Dashboard renders a Live Patient Grid displaying multiple active patient sessions simultaneously in real time.

2. **Automatic Session Cleanup on Back Navigation**:
   - Enhanced `useRealTimeSync` and `app/patient/page.tsx` so that when a patient clicks the Back button or unmounts the form, a `session_leave` event is dispatched.
   - The Staff Dashboard immediately removes the corresponding patient session card (`delete copy[sessionId]`), preventing stale cards from cluttering the dashboard.

3. **Staff Security Gate Authentication**:
   - Added a password protection gate to `/staff` (verifying against `process.env.NEXT_PUBLIC_STAFF_PASSWORD` or fallback `AgnosStaff2026`).
   - Stores auth status in `sessionStorage` to secure sensitive patient healthcare information.

4. **Multi-Channel Transport Fallback**:
   - Syncs across devices via Supabase Realtime Broadcast & Presence.
   - Syncs across tabs locally using browser `BroadcastChannel` and `storage` event triggers for sub-millisecond responsiveness.

---

### 3. Design Decisions

1. **Reduced Cognitive Load for Patients**:
   - Collecting 12 form fields on a single long page causes user fatigue.
   - Grouped into 4 distinct cards (*Personal Details*, *Contact Information*, *Demographics*, and *Emergency Contact*) for progressive step-by-step entry.

2. **Dark Mode for Staff Dashboard**:
   - Healthcare workers spend long hours monitoring registration feeds.
   - A dark theme (`bg-slate-950`) reduces eye strain while making status badges (Emerald for Submitted, Amber for Filling) stand out clearly.

3. **Responsive Mobile & Desktop Layouts**:
   - Mobile-friendly touch targets (44px+) for patients.
   - Multi-column live grid layout for hospital staff on desktop monitors.

---

### 4. Component Architecture

Adheres to Clean Code and DRY principles:

- **`Input.tsx`**: Encapsulates labels, icons, error messages, and focus rings.
- **`Button.tsx`**: Standardizes button variants (`primary`, `secondary`, `ghost`, `danger`, `staff`) and loading state indicators.
- **`StatusBadge.tsx`**: Visual status indicator with pulsing animation and Thai status text.
- **`useRealTimeSync.ts`**: Encapsulates multi-patient state, WebSocket channels, fallback events, and leave cleanups.

---

### 5. Real-Time Synchronization Flow

```text
[ Patient View (/patient) ]                             [ Staff Dashboard (/staff) ]
          │                                                         ▲
 (1) Open Form (New Session)                                        │
          │                                                         │
   Presence / Register ──────────────── Broadcast/Presence ─────────┼── (2) Render Live Patient Card
   { sessionId: 'SES-1234' }                                        │    in Staff Multi-Patient Grid
          │                                                         │
 (3) Focus Input Field                                              │
          │                                                         │
   Active Field Event  ──────────────── Broadcast/Channel ──────────┼── (4) Highlight active field
   { fieldName: 'firstName' }                                       │    & update status to "filling"
          │                                                         │
 (5) Type Text (Debounced 3s)                                       │
          │                                                         │
   Debounced Draft Event ────────────── Broadcast/Channel ──────────┼── (6) Update live draft values
   { draft: { firstName: '...' } }                                  │    on patient's card
          │                                                         │
 (7) Click Back / Leave Page                                        │
          │                                                         │
   Session Leave Event ──────────────── Broadcast/Channel ──────────└── (8) Remove patient card immediately
   { type: 'session_leave' }                                             from staff grid
```
