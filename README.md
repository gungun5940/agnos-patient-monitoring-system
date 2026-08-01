# Agnos Patient Registration & Live Monitor (ระบบลงทะเบียนคนไข้และติดตามผลแบบ Real-time)

ระบบลงทะเบียนคนไข้ล่วงหน้าพร้อมหน้าจอติดตามผลแบบ Real-time พัฒนาด้วย Next.js (App Router), Supabase Realtime (Broadcast Channels), Tailwind CSS และ React Hook Form + Zod 

---

## 🇹🇭 Thai Version (ภาษาไทย)

### 1. Technical Overview (ภาพรวมทางเทคนิค)

โปรเจกต์นี้แยกการทำงานออกเป็น 2 หน้าหลัก:
1. **หน้าลงทะเบียนคนไข้ (`/patient`)**: ฟอร์มกรอกข้อมูล 12 ช่อง แบ่งเป็นหมวดหมู่ชัดเจนเพื่อไม่ให้คนไข้รู้สึกซ้อนทับหรือลายตา ใช้ React Hook Form ร่วมกับ Zod ในการตรวจเช็คความถูกต้องของข้อมูล (Validation) และดักจับ Event `onFocus`, `onChange`, `onBlur` เพื่อส่งข้อมูลไปหาเจ้าหน้าที่
2. **หน้าจอติดตามของเจ้าหน้าที่ (`/staff`)**: Dashboard โทนสีเข้ม (Dark Mode) สำหรับเจ้าหน้าที่ ใช้ดูว่าตอนนี้มีคนไข้กำลังกรอกข้อมูลอยู่หรือไม่ (สถานะ `inactive`, `filling`, `submitted`), กำลังพิมพ์อยู่ที่ช่องไหน (Live Field Highlight) และดูรายการฟอร์มที่กดส่งเรียบร้อยแล้ว

**Stack ที่ใช้:**
- **Framework**: Next.js 15 (App Router) + React 19
- **Real-Time Engine**: Supabase Realtime (Broadcast Channel) + ระบบ Fallback เป็น LocalStorage Sync หากเครือข่ายมีปัญหา
- **Form & Validation**: React Hook Form + Zod (`@hookform/resolvers/zod`)
- **Styling**: Tailwind CSS v4 + Lucide React Icons

---

### 2. Project Structure (โครงสร้างไฟล์ในโปรเจกต์)

โปรเจกต์นี้ไม่ได้ใช้โฟลเดอร์ `src` โดยจัดวางไฟล์ตามโครงสร้าง App Router ดังนี้:

```text
.
├── app/
│   ├── globals.css         # ไฟล์ CSS สไตล์หลักและตั้งค่า Tailwind
│   ├── layout.tsx          # Layout หลักของแอป
│   ├── page.tsx            # หน้าแรกสำหรับเลือกบทบาท (คนไข้ / เจ้าหน้าที่)
│   ├── patient/
│   │   └── page.tsx        # หน้าฟอร์มกรอกข้อมูลของคนไข้
│   └── staff/
│       └── page.tsx        # หน้าจอ Dashboard สำหรับเจ้าหน้าที่
├── components/
│   └── ui/
│       ├── Button.tsx      # ปุ่มกด Reusable รองรับ variant และสถานะ loading
│       ├── Input.tsx       # กล่องกรอกข้อมูลพร้อมไอคอนและข้อความแจ้งเตือน error
│       └── StatusBadge.tsx # ป้ายแสดงสถานะ (กำลังกรอก, ไม่อยู่ในหน้าฟอร์ม, ส่งแล้ว)
├── hooks/
│   └── useRealTimeSync.ts  # Custom Hook จัดการ Supabase Broadcast, Debounce และ LocalStorage Sync
├── lib/
│   └── supabase.ts        # ไฟล์ตั้งค่า Supabase Client
├── types/
│   └── patient.ts         # ไฟล์เก็บ Type, Zod Schema และชื่อฟิลด์ภาษาไทย
├── package.json
└── README.md
```

#### เหตุผลในการออกแบบ UI/UX และ Clean Code:
- **แบ่งหมวดหมู่ฟอร์ม 12 ช่อง**: การใส่ฟอร์ม 12 ช่องไว้ในหน้าเดียวอาจทำให้ผู้ใช้รู้สึกเหนื่อยล้า (Cognitive Load) จึงแบ่งเป็น 4 การ์ดย่อย (*ข้อมูลส่วนตัว*, *ช่องทางติดต่อ*, *เชื้อชาติ/ภาษา*, *ผู้ติดต่อฉุกเฉิน*)
- **หน้า Staff เป็น Dark Mode**: เจ้าหน้าที่ต้องเฝ้าหน้าจอนานๆ การใช้สีโทนเข้มเข้ม (`bg-slate-950`) ช่วยลดอาการปวดตาและความเครียดจากแสงจอ (Screen Fatigue)
- **แยก Reusable UI Components**: แยก `Input`, `Button`, `StatusBadge` ออกมาเป็น component กลาง เพื่อลดโค้ดซ้ำซ้อน (DRY Principle) และง่ายต่อการปรับแต่งธีมในอนาคต

---

### 3. Real-Time Data Flow & Sync Workflow (การไหลของข้อมูล)

```text
[ คนไข้คลิก/พิมพ์ในฟอร์ม ]
           │
           ▼
[ React Hook Form Capture ] (Event: Focus / Typing / Blur)
           │
           ▼
[ useRealTimeSync Hook ]
   ├── สลับสถานะเป็น "filling" และแจ้งเตือนชื่อช่องที่กำลังพิมพ์ทันที (Instant)
   └── หน่วงเวลา 3 วินาที (Debounce 3s) ก่อนส่งข้อมูล Draft ทั้งหมด
           │
           ▼
[ Supabase Broadcast Channel ] (ถ้าหลุดจะใช้ LocalStorage Sync แทน)
           │
           ▼
[ หน้าจอเจ้าหน้าที่ (/staff) ]
   ├── ป้ายสถานะเปลี่ยนตามจริง (Filling / Inactive / Submitted)
   ├── กล่องข้อความกรอกข้อมูลของเจ้าหน้าที่กระพริบตามช่องที่คนไข้แตะ
   └── แสดงข้อมูลดราฟต์และประวัติการส่งฟอร์ม
```

- **Debounce Strategy (3 วินาที)**: เพื่อไม่ให้ส่ง Request ถี่เกินไปขณะคนไข้พิมพ์ จะส่งเฉพาะตำแหน่งฟิลด์แบบทันที ส่วนตัวเนื้อหาฟอร์มจะรอให้หยุดพิมพ์ 3 วินาทีก่อนส่ง draft ชุดใหม่
- **การคืนค่าสถานะ Inactive**: เมื่อคนไข้ละความสนใจจากฟอร์ม (Unfocus ทุกช่อง) หรือกดปุ่มย้อนกลับ ระบบจะล้างสถานะและปรับเป็น `inactive` อัตโนมัติ

---

### 4. How to Run / Setup Instructions (วิธีติดตั้งและสั่งรัน)

1. **Clone โปรเจกต์ และเปิดโฟลเดอร์**:
   ```bash
   git clone https://github.com/gungun5940/agnos-patient-monitoring-system.git
   cd agnos-patient-monitoring-system
   ```

2. **ติดตั้ง Dependencies**:
   ```bash
   npm install
   ```

3. **ตั้งค่า Environment Variables (ถ้ามี)**:
   สร้างไฟล์ `.env.local` ไว้ที่ Root ของโปรเจกต์ (ถ้าไม่สร้าง ระบบจะใช้ค่าคีย์สำรองที่มีอยู่ในไฟล์ `lib/supabase.ts` ร่วมกับระบบ LocalStorage Sync ให้โดยอัตโนมัติ):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **สั่งรัน Development Server**:
   ```bash
   npm run dev
   ```
   เปิดเว็บบราวเซอร์ไปที่ [http://localhost:3000](http://localhost:3000)
   - เปิดหน้าต่างแรกไปที่ `/patient` (คนไข้)
   - เปิดอีกหน้าต่างไปที่ `/staff` (เจ้าหน้าที่)
   - ลองพิมพ์ข้อมูลในหน้าคนไข้ แล้วสังเกตผลในหน้าเจ้าหน้าที่แบบ Real-time

---

### 5. Bonus Features Implemented (ฟีเจอร์พิเศษเพิ่มเติม)

1. **Live Field Highlighting (ไฟกระพริบเตือนช่องที่กำลังพิมพ์)**:
   เจ้าหน้าที่สามารถเห็นได้ทันทีว่าคนไข้กำลังแตะหรือพิมพ์อยู่ที่ฟิลด์ไหน โดยจะขึ้นขอบสีฟ้ากระพริบพร้อมชื่อฟิลด์ภาษาไทย (เช่น *"กำลังกรอก: ชื่อจริง"*)
2. **ระบบดักฟอร์มด้วย Zod Validation (ภาษาไทย)**:
   มีการตรวจเช็คความถูกต้องของข้อมูล เช่น เบอร์โทรศัพท์ต้องเป็นรูปแบบเบอร์ไทย (9-10 หลัก), อีเมลถูกต้องตามรูปแบบ, รหัสประจำตัวประชาชน/พาสปอร์ตถูกต้อง พร้อมข้อความแจ้งเตือนภาษาไทยเข้าใจง่าย
3. **ระบบสลับสถานะและล้างค่าเมื่อย้อนกลับ**:
   เมื่อคนไข้กดปุ่ม "ย้อนกลับ" หรือส่งฟอร์มสำเร็จ ระบบจะส่งสัญญาณล้างสถานะดราฟต์ไปยังหน้าเจ้าหน้าที่ทันที ไม่ทิ้งสถานะค้างไว้
4. **Dual-Sync Engine (Supabase + LocalStorage Fallback)**:
   หากเน็ตหลุดหรือไม่ได้ต่อ Supabase ระบบจะสลับไปใช้ `window.addEventListener('storage')` ให้เปิดทดสอบ 2 หน้าต่างในเครื่องเดียวกันได้ราบรื่น 100%

---

## 🇬🇧 English Version

### 1. Technical Overview

This project is a real-time patient intake system designed for clinics and hospitals. It consists of two main views:
1. **Patient Registration Form (`/patient`)**: A 12-field form organized into clear cards to avoid overwhelming the patient. Built using React Hook Form and Zod validation, it tracks field focus, changes, and blur events to stream updates in real time.
2. **Staff Live Monitoring Dashboard (`/staff`)**: A dark-themed dashboard for clinical staff to view active patient draft statuses (`inactive`, `filling`, `submitted`), see live field highlights as the patient types, and inspect submitted patient records.

**Tech Stack:**
- **Framework**: Next.js 15 (App Router) + React 19
- **Real-Time Engine**: Supabase Realtime (Broadcast Channels) with automatic LocalStorage fallback
- **Form Management**: React Hook Form + Zod (`@hookform/resolvers/zod`)
- **Styling**: Tailwind CSS v4 + Lucide React Icons

---

### 2. Project Structure

This project uses the standard Next.js App Router structure without a `src` directory:

```text
.
├── app/
│   ├── globals.css         # Global Tailwind CSS configuration
│   ├── layout.tsx          # Root layout file
│   ├── page.tsx            # Landing page with role selection (Patient / Staff)
│   ├── patient/
│   │   └── page.tsx        # Patient intake form page
│   └── staff/
│       └── page.tsx        # Staff monitoring dashboard
├── components/
│   └── ui/
│       ├── Button.tsx      # Reusable button component
│       ├── Input.tsx       # Reusable input component with icons and error displays
│       └── StatusBadge.tsx # Status badge component (Inactive, Filling, Submitted)
├── hooks/
│   └── useRealTimeSync.ts  # Central custom hook for Supabase Realtime, debouncing, and sync
├── lib/
│   └── supabase.ts        # Supabase client setup with fallback credentials
├── types/
│   └── patient.ts         # TypeScript types, Zod schemas, and Thai label mappings
├── package.json
└── README.md
```

#### Key Architecture & UI/UX Notes:
- **12-Field Card Layout**: Grouping fields into 4 distinct cards (*Personal Info*, *Contact Info*, *Demographics/Language*, and *Emergency Contact*) reduces cognitive load for patients.
- **Dark Mode Staff Dashboard**: Uses dark slate tones (`bg-slate-950`) to reduce screen fatigue for staff members monitoring screens over long shifts.
- **Reusable Components**: Separating `Input`, `Button`, and `StatusBadge` keeps the codebase DRY and easy to maintain.

---

### 3. Real-Time Data Flow & Sync Workflow

```text
[ Patient Focuses / Types in Form ]
           │
           ▼
[ React Hook Form ] (Captures Focus, Change, Blur events)
           │
           ▼
[ useRealTimeSync Hook ]
   ├── Immediately updates status to "filling" and broadcasts active field name
   └── Debounces form data payloads by 3 seconds (3000ms)
           │
           ▼
[ Supabase Broadcast Channel ] (Fallback: Cross-tab LocalStorage Event)
           │
           ▼
[ Staff Dashboard (/staff) ]
   ├── Updates Status Badge (Filling / Inactive / Submitted)
   ├── Highlights the active input field with a pulsing outline
   └── Renders draft values and submitted records live
```

- **3-Second Debounce**: To avoid excessive WebSocket messages while typing, draft text updates are debounced by 3000ms, while active field focus is broadcasted instantly.
- **Automatic Inactive Reset**: When all fields are unfocused or when the patient navigates away, the status resets back to `inactive`.

---

### 4. How to Run / Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/gungun5940/agnos-patient-monitoring-system.git
   cd agnos-patient-monitoring-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional)**:
   Create a `.env.local` file in the root directory (if skipped, fallback credentials and LocalStorage sync will be used):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser:
   - Open `/patient` in one window.
   - Open `/staff` in another window side-by-side to observe real-time updates.

---

### 5. Bonus Features Implemented

1. **Live Field Highlighting**: Staff can see exactly which field the patient is currently editing through a glowing cyan border and a Thai field label indicator.
2. **Zod Validation with Thai Error Messages**: Enforces strict checks for Thai phone numbers, email formatting, and 13-digit Thai ID card / passport numbers.
3. **Clean Reset on Back Navigation**: Navigating away from the patient form or submitting automatically clears active field indicators on the staff monitor.
4. **Dual Sync Engine**: Combines Supabase Realtime Broadcast with cross-tab `window.addEventListener('storage')` fallback for robust offline or demo testing.

---

## License
MIT License
# agnos-patient-monitoring-system
