# Agnos Patient Registration & Live Monitor

Real-time patient intake system and staff live monitoring dashboard built with Next.js 15 (App Router), Supabase Realtime (Broadcast Channels), Tailwind CSS v4, and React Hook Form + Zod.

---

## 🇹🇭 Thai Version (ภาษาไทย)

### 1. Overview of the Project (ภาพรวมระบบ)

ระบบลงทะเบียนคนไข้ล่วงหน้าและติดตามผลแบบ Real-time พัฒนาขึ้นเพื่อแก้ไขปัญหาการจัดเก็บข้อมูลคนไข้ที่ล่าช้า โดยแบ่งการทำงานออกเป็น 2 หน้าหลักในโครงการ Next.js (App Router แบบไม่มีโฟลเดอร์ `src`):

1. **หน้าลงทะเบียนคนไข้ (`/patient`)**: ฟอร์มกรอกข้อมูล 12 ช่องทางฝั่งคนไข้ แบ่งการ์ดออกเป็น 4 หมวดหมู่อย่างเป็นระเบียบ ใช้ React Hook Form ร่วมกับ Zod Schema ในการตรวจสอบความถูกต้องของข้อมูล (Validation) และส่ง Event (`onFocus`, `onChange`, `onBlur`) ไปยังระบบ Real-time
2. **หน้าจอติดตามของเจ้าหน้าที่ (`/staff`)**: Dashboard โทนสีเข้มสำหรับเจ้าหน้าที่โรงพยาบาล แสดงสถานะฟอร์มคนไข้ (`inactive`, `filling`, `submitted`), จุดที่คนไข้กำลังพิมพ์ข้อมูลอยู่แบบกระพริบสด (Live Field Highlighting) และรายการฟอร์มที่กดส่งเรียบร้อยแล้วทันทีโดยไม่ต้องกด Refresh

**Tech Stack หลัก:**
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Real-Time Engine**: Supabase Realtime (`@supabase/supabase-js`) ส่งผ่าน Broadcast Channels + LocalStorage Sync Fallback
- **Form & Validation**: React Hook Form + Zod (`@hookform/resolvers/zod`)
- **Styling**: Tailwind CSS v4 + Lucide React Icons

---

### 2. Setup / Local Development Instructions (ขั้นตอนการติดตั้งและสั่งรัน)

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
สร้างไฟล์ `.env.local` ที่ Root ของโปรเจกต์ (หากไม่ได้ตั้งค่า ระบบมีค่าสำรอง built-in fallback และรองรับการเชื่อมต่อผ่าน LocalStorage Sync ข้ามหน้าต่างโดยอัตโนมัติ):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Step 3: Run Development Server
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)
- **หน้าต่างที่ 1**: เข้าไปที่ `/patient` (เปิดหน้าลงทะเบียนคนไข้)
- **หน้าต่างที่ 2**: เข้าไปที่ `/staff` (เปิดหน้าจอติดตามของเจ้าหน้าที่)
- ทดลองกรอกข้อมูลในหน้า `/patient` และดูการอัปเดตแบบ Real-time บนหน้า `/staff`

#### Step 4: Build & Production Start
```bash
# ตรวจสอบการคอมไพล์และสร้าง Production Build
npm run build

# สั่งรัน Production Server
npm run start
```

---

### 3. Descriptions of Bonus Features Implemented (ฟีเจอร์พิเศษเพิ่มเติม)

1. **3-Second Debounce & Smart Inactive Switching (ระบบหน่วงเวลา 3 วินาทีและการสลับสถานะ Inactive)**:
   - ขณะคนไข้พิมพ์ข้อมูล ระบบจะส่งตำแหน่งช่องที่แตะไปหาเจ้าหน้าที่แบบทันที (Instant Focus Broadcast)
   - ข้อมูลตัวอักษรในฟอร์มจะถูกหน่วงเวลาไว้ 3 วินาที (3s Debounce) เพื่อไม่ให้ส่ง Request ถี่เกินไปจนหน่วงเครือข่าย
   - เมื่อคนไข้ละสายตาออกจากฟอร์ม (Unfocus ทุกช่อง) หรือกดปุ่ม "ย้อนกลับ" ระบบจะคำนวณและส่งสัญญาณสลับสถานะกลับเป็น `inactive` หรือล้างสถานะอย่างแม่นยำ

2. **Live Field Highlighting (ไฟกระพริบเตือนช่องที่กำลังพิมพ์)**:
   - ฝั่งเจ้าหน้าที่แสดงการ์ดกรอกข้อมูลที่มีขอบสีฟ้ากระพริบพร้อมระบุชื่อช่องภาษาไทย เช่น *"กำลังกรอก: เบอร์โทรศัพท์"*
   - ช่วยให้เจ้าหน้าที่รู้ความเคลื่อนไหวของคนไข้ได้ในวินาทีจริง

3. **Strict Zod Form Validation (การตรวจสอบข้อมูลอย่างแน่นหนา)**:
   - ตรวจสอบความถูกต้องครบถ้วนทั้ง 12 ช่อง เช่น เบอร์โทรศัพท์ต้องตรงตามฟอร์แมตเบอร์ไทย (9-10 หลัก ขึ้นต้นด้วย 08, 09, 06, 02 ฯลฯ), รูปแบบอีเมล, และรหัสประจำตัวประชาชน/พาสปอร์ตไทย 13 หลัก
   - แสดง Error Message ภาษาไทยชัดเจนใต้ช่องกรอกข้อมูลเมื่อป้อนผิดฟอร์แมต

---

## 🇬🇧 English Version

### 1. Overview of the Project

A real-time patient intake system and staff monitoring dashboard built with Next.js 15 (App Router, without a `src` directory), Supabase Realtime, Tailwind CSS, and React Hook Form with Zod validation.

The system is split into two primary views:
1. **Patient Registration Portal (`/patient`)**: A 12-field registration form grouped into 4 distinct cards. It captures field focus, change, and blur events, validates input via Zod schemas, and streams form progress in real time.
2. **Staff Live Monitoring Dashboard (`/staff`)**: A dark-themed monitoring interface for healthcare staff to track active patient form states (`inactive`, `filling`, `submitted`), see live field focus indicators, and inspect submitted intake records without manual page refreshes.

**Core Tech Stack:**
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Real-Time Sync**: Supabase Realtime (`@supabase/supabase-js`) Broadcast Channels with automatic LocalStorage event sync fallback
- **Form Management**: React Hook Form + Zod (`@hookform/resolvers/zod`)
- **Styling**: Tailwind CSS v4 + Lucide React icons

---

### 2. Setup / Local Development Instructions

Follow these steps to set up and run the project locally:

#### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/gungun5940/agnos-patient-monitoring-system.git
cd agnos-patient-monitoring-system
npm install
```

#### Step 2: Configure Environment Variables (Optional)
Create a `.env.local` file in the root directory. If omitted, the app automatically relies on built-in fallback configurations and cross-tab LocalStorage sync:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Step 3: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. For testing:
- Open `/patient` in one window.
- Open `/staff` in another window side-by-side.
- Type in the patient form and observe instant real-time updates on the staff dashboard.

#### Step 4: Build & Production Start
```bash
npm run build
npm run start
```

---

### 3. Descriptions of Bonus Features Implemented

1. **3-Second Debounce & Smart Inactive State Switching**:
   - Focus updates are broadcast instantly so staff can see which field the patient touched.
   - Text payload updates are debounced by 3,000ms (3 seconds) to prevent socket flooding while typing rapidly.
   - When all fields lose focus or the patient leaves the page via the back button, `resetSyncState()` recalculates the state and reverts status to `inactive` cleanly.

2. **Live Field Highlighting**:
   - The staff dashboard highlights the active field currently being edited with a glowing cyan border and animated Thai text indicator (e.g., *"กำลังกรอก: ชื่อจริง"*).

3. **Strict Zod Form Validation**:
   - Validates all 12 form fields before submission, enforcing rules such as Thai mobile/landline phone patterns (9-10 digits), 13-digit Thai National ID/passport formats, and valid email syntax with localized Thai error messages.

---

## License
MIT License
