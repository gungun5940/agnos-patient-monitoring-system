# Agnos Patient Registration & Live Monitor

Real-time patient intake system and staff live monitoring dashboard built with Next.js 15 (App Router), Supabase Realtime (Broadcast Channels), Tailwind CSS v4, and React Hook Form + Zod.

---

## 🇹🇭 Thai Version (ภาษาไทย)

### 1. Overview of the Project (ภาพรวมระบบ)

ระบบลงทะเบียนคนไข้ล่วงหน้าและติดตามผลแบบ Real-time พัฒนาขึ้นเพื่อแก้ไขปัญหาการจัดเก็บข้อมูลคนไข้ที่ล่าช้า โดยแบ่งการทำงานออกเป็น 2 หน้าหลักในโครงการ Next.js (App Router แบบไม่มีโฟลเดอร์ `src`):

1. **หน้าลงทะเบียนคนไข้ (`/patient`)**: ฟอร์มกรอกข้อมูลคนไข้ที่สมบูรณ์ แบ่งการ์ดออกเป็น 4 หมวดหมู่อย่างเป็นระเบียบ (ข้อมูลส่วนตัว, ข้อมูลการติดต่อ, ข้อมูลทั่วไป, และผู้ติดต่อฉุกเฉิน) พร้อมเพิ่มช่องคำนำหน้าชื่อ (Prefix) และอาการป่วยเบื้องต้น (Chief Complaint / Symptoms) ใช้ React Hook Form ร่วมกับ Zod Schema ในการตรวจสอบความถูกต้องของข้อมูล (Validation) และส่ง Event (`onFocus`, `onChange`, `onBlur`) ไปยังระบบ Real-time
2. **หน้าจอติดตามของเจ้าหน้าที่ (`/staff`)**: Dashboard โทนสีเข้มสำหรับเจ้าหน้าที่โรงพยาบาล แสดงสถานะฟอร์มคนไข้ (`inactive`, `filling`, `submitted`), จุดที่คนไข้กำลังพิมพ์ข้อมูลอยู่แบบกระพริบสด (Live Field Highlighting) พร้อมช่องอาการป่วยสด และรายการฟอร์มที่กดส่งเรียบร้อยแล้วทันทีโดยไม่ต้องกด Refresh

**Tech Stack หลัก:**
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Real-Time Engine**: Supabase Realtime (`@supabase/supabase-js`) ส่งผ่าน Broadcast Channels + LocalStorage Sync Fallback
- **Form & Validation**: React Hook Form + Zod (`@hookform/resolvers/zod`)
- **Styling**: Tailwind CSS v4 + Lucide React Icons

---

### 2. Security & Access Control (ความปลอดภัยและการเข้าถึงระบบเจ้าหน้าที่)

เพื่อยกระดับความปลอดภัยและปกป้องข้อมูลส่วนบุคคลของคนไข้ (Patient Privacy) ทางทีมเราได้เพิ่มเกตล็อกรหัสผ่านหน้าจอเจ้าหน้าที่ **(Simple Password Gate)** ในหน้า `/staff`:

- **Environment Secret Variable Name**: `NEXT_PUBLIC_STAFF_PASSWORD`
- **Default Access Password**: `AgnosStaff2026`

💡 **ข้อแนะนำการทดสอบสำหรับคณะกรรมการ (Agnos Selection Committee):**
ระบบถูกออกแบบให้ใช้ `sessionStorage` ในการจำสิทธิ์การเข้าใช้งานชั่วคราว ดังนั้น กรรมการกรอกรหัสผ่าน `AgnosStaff2026` ผ่านเกตหน้าทางเข้าแค่ครั้งแรกครั้งเดียว ก็สามารถเปิดแท็บสลับไปมาเพื่อดูการซิงค์ข้อมูลเรียลไทม์ 12 ฟิลด์บวกช่องอาการป่วยเบื้องต้นชุดใหม่ได้อย่างราบรื่น โดยไม่ต้องคอยพิมพ์รหัสผ่านซ้ำๆ ตราบใดที่ยังไม่ได้ปิดแท็บบราวเซอร์นั้นครับ

---

### 3. Setup / Local Development Instructions (ขั้นตอนการติดตั้งและสั่งรัน)

ขั้นตอนการติดตั้งและทดสอบระบบบนเครื่องคอมพิวเตอร์ (Local Machine):

#### Step 1: Clone Repository & Install Dependencies
```bash
# Clone โปรเจกต์เข้าเครื่อง
git clone https://github.com/gungun5940/agnos-patient-monitoring-system.git
cd agnos-patient-monitoring-system

# ติดตั้งแพ็กเกจทั้งหมด
npm install
```

#### Step 2: Configure Environment Variables (Optional)
สร้างไฟล์ `.env.local` ที่ Root ของโปรเจกต์ (หากไม่ได้ตั้งค่า ระบบมีค่าสำรอง built-in fallback และรหัสผ่าน `AgnosStaff2026` ทำงานได้ทันที):
```env
NEXT_PUBLIC_SUPABASE_URL="https://snrlhajavxbqdkprqgum.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_AXDZKjcLKVU_dBm2BadQWg_TuHCFVt4"
NEXT_PUBLIC_STAFF_PASSWORD=AgnosStaff2026
```

#### Step 3: Run Development Server
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)
- **หน้าต่างที่ 1**: เข้าไปที่ `/patient` (เปิดหน้าลงทะเบียนคนไข้)
- **หน้าต่างที่ 2**: เข้าไปที่ `/staff` (กรอกรหัสผ่าน `AgnosStaff2026` เพื่อเปิดแดชบอร์ดมอนิเตอร์)
- ทดลองกรอกข้อมูลในหน้า `/patient` และดูการอัปเดตแบบ Real-time บนหน้า `/staff`

#### Step 4: Build & Production Start
```bash
# ตรวจสอบการคอมไพล์และสร้าง Production Build
npm run build

# สั่งรัน Production Server
npm run start
```

---

### 4. Descriptions of Bonus Features Implemented (ฟีเจอร์พิเศษเพิ่มเติม)

1. **Simple Password Gate & Session Memory (ระบบล็อกรหัสผ่านหน้าเจ้าหน้าที่)**:
   - ป้องกันบุคคลภายนอกแอบดูข้อมูลการลงทะเบียนและอาการป่วยของคนไข้
   - จดจำสิทธิ์ผ่าน `sessionStorage` ช่วยให้ใช้งานสะดวกโดยไม่ต้องพิมพ์รหัสซ้ำขณะทดสอบ

2. **Bonus Fields (คำนำหน้าชื่อ และ อาการป่วยเบื้องต้น)**:
   - เพิ่มตัวเลือกคำนำหน้าชื่อ (นาย / นาง / นางสาว / เด็กชาย / เด็กหญิง) เป็นฟิลด์บังคับ
   - เพิ่มช่องพิมพ์อาการป่วยเบื้องต้น (Chief Complaint / Symptoms) เป็นฟิลด์ไม่บังคับกรอก เพื่อช่วยการคัดกรองเบื้องต้น ซิงค์ข้อมูลข้ามระบบแบบ Real-time ทีละตัวอักษร

3. **3-Second Debounce & Smart Inactive Switching (ระบบหน่วงเวลา 3 วินาทีและการสลับสถานะ Inactive)**:
   - ขณะคนไข้พิมพ์ข้อมูล ระบบจะส่งตำแหน่งช่องที่แตะไปหาเจ้าหน้าที่แบบทันที (Instant Focus Broadcast)
   - ข้อมูลตัวอักษรในฟอร์มจะถูกหน่วงเวลาไว้ 3 วินาที (3s Debounce) เพื่อไม่ให้ส่ง Request ถี่เกินไปจนหน่วงเครือข่าย
   - เมื่อคนไข้ละสายตาออกจากฟอร์ม (Unfocus ทุกช่อง) หรือกดปุ่ม "ย้อนกลับ" ระบบจะคำนวณและส่งสัญญาณสลับสถานะกลับเป็น `inactive` หรือล้างสถานะอย่างแม่นยำ

4. **Live Field Highlighting (ไฟกระพริบเตือนช่องที่กำลังพิมพ์)**:
   - ฝั่งเจ้าหน้าที่แสดงการ์ดกรอกข้อมูลที่มีขอบสีฟ้ากระพริบพร้อมระบุชื่อช่องภาษาไทย เช่น *"กำลังกรอก: เบอร์โทรศัพท์"*
   - ช่วยให้เจ้าหน้าที่รู้ความเคลื่อนไหวของคนไข้ได้ในวินาทีจริง

5. **Strict Zod Form Validation (การตรวจสอบข้อมูลอย่างแน่นหนา)**:
   - ตรวจสอบความถูกต้องครบถ้วนทั้งฟอร์ม เช่น เบอร์โทรศัพท์ต้องตรงตามฟอร์แมตเบอร์ไทย (9-12 หลัก), รูปแบบอีเมลถูกต้อง
   - แสดง Error Message ภาษาไทยชัดเจนใต้ช่องกรอกข้อมูลเมื่อป้อนผิดฟอร์แมต

---

## 🇬🇧 English Version

### 1. Overview of the Project

A real-time patient intake system and staff monitoring dashboard built with Next.js 15 (App Router, without a `src` directory), Supabase Realtime, Tailwind CSS, and React Hook Form with Zod validation.

The system is split into two primary views:
1. **Patient Registration Portal (`/patient`)**: An intake registration form grouped into 4 distinct cards. Includes Title/Prefix dropdown and Chief Complaint / Symptoms text fields. It captures field focus, change, and blur events, validates input via Zod schemas, and streams form progress in real time.
2. **Staff Live Monitoring Dashboard (`/staff`)**: A dark-themed monitoring interface for healthcare staff to track active patient form states (`inactive`, `filling`, `submitted`), see live field focus indicators, inspect Chief Complaints, and review submitted intake records without manual page refreshes.

**Core Tech Stack:**
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Real-Time Sync**: Supabase Realtime (`@supabase/supabase-js`) Broadcast Channels with automatic LocalStorage event sync fallback
- **Form Management**: React Hook Form + Zod (`@hookform/resolvers/zod`)
- **Styling**: Tailwind CSS v4 + Lucide React icons

---

### 2. Security & Access Control

To ensure patient privacy and safeguard health data, a **Simple Password Gate** has been integrated into the staff dashboard (`/staff`):

- **Environment Variable Name**: `NEXT_PUBLIC_STAFF_PASSWORD`
- **Default Access Password**: `AgnosStaff2026`

💡 **Tip for the Agnos Selection Committee:**
The authentication state is stored in `sessionStorage`. Reviewers only need to enter the password `AgnosStaff2026` once per session. You can freely switch between `/patient` and `/staff` tabs to test real-time form streaming without re-entering the password, as long as the browser tab remains open.

---

### 3. Setup / Local Development Instructions

Follow these steps to set up and run the project locally:

#### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/gungun5940/agnos-patient-monitoring-system.git
cd agnos-patient-monitoring-system
npm install
```

#### Step 2: Configure Environment Variables (Optional)
Create a `.env.local` file in the root directory. If omitted, the app automatically relies on built-in fallback configurations and the default password `AgnosStaff2026`:
```env
NEXT_PUBLIC_SUPABASE_URL="https://snrlhajavxbqdkprqgum.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_AXDZKjcLKVU_dBm2BadQWg_TuHCFVt4"
NEXT_PUBLIC_STAFF_PASSWORD=AgnosStaff2026
```

#### Step 3: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. For testing:
- Open `/patient` in one window.
- Open `/staff` in another window side-by-side (unlock with password `AgnosStaff2026`).
- Type in the patient form and observe instant real-time updates on the staff dashboard.

#### Step 4: Build & Production Start
```bash
npm run build
npm run start
```

---

### 4. Descriptions of Bonus Features Implemented

1. **Simple Password Gate & Session Memory**:
   - Protects confidential patient registration data and symptom details from unauthorized access.
   - Leverages `sessionStorage` for seamless testing without repetitive password prompts.

2. **Bonus Fields (Title Prefix & Chief Complaint / Symptoms)**:
   - Mandatory Title/Prefix selection (นาย / นาง / นางสาว / เด็กชาย / เด็กหญิง).
   - Optional Chief Complaint / Symptoms field to record preliminary patient symptoms, synced live character-by-character to the staff monitor.

3. **3-Second Debounce & Smart Inactive State Switching**:
   - Focus updates are broadcast instantly so staff can see which field the patient touched.
   - Text payload updates are debounced by 3,000ms (3 seconds) to prevent socket flooding while typing rapidly.
   - When all fields lose focus or the patient leaves the page via the back button, `resetSyncState()` recalculates the state and reverts status to `inactive` cleanly.

4. **Live Field Highlighting**:
   - The staff dashboard highlights the active field currently being edited with a glowing cyan border and animated Thai text indicator (e.g., *"กำลังกรอก: ชื่อจริง"*).

5. **Strict Zod Form Validation**:
   - Validates all form fields before submission, enforcing rules such as Thai mobile patterns (9-12 digits) and valid email syntax with localized Thai error messages.

---

## License
MIT License
