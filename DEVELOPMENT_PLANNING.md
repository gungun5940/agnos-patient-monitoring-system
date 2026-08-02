# Development Planning & Architecture Documentation

เอกสารอธิบายสถาปัตยกรรม การออกแบบ และโครงสร้างการทำงานของโปรเจกต์ (Developer Documentation) สำหรับระบบ Agnos Patient Registration & Live Monitor

---

## 🇹🇭 Thai Version (ภาษาไทย)

### 1. Project Structure (โครงสร้างโปรเจกต์)

โปรเจกต์นี้ใช้โครงสร้าง Next.js 15 (App Router) จัดเก็บโค้ดตามหน้าที่ของแต่ละไฟล์อย่างชัดเจนดังนี้:

```text
.
├── app/
│   ├── globals.css         # ไฟล์กำหนดสไตล์หลัก (Tailwind CSS v4 + Custom Utilities)
│   ├── layout.tsx          # Root Layout ครอบส่วนหัว ฟอนต์ Sarabun/Plus Jakarta Sans และโครงสร้างเว็บ
│   ├── page.tsx            # หน้าเลือกบทบาทเริ่มต้น (Patient Portal หรือ Staff Dashboard)
│   ├── patient/
│   │   └── page.tsx        # หน้าลงทะเบียนคนไข้ (ฟอร์ม 12 ช่อง + Hook ดัก Event)
│   └── staff/
│       └── page.tsx        # หน้าจอ Dashboard ติดตามผลแบบ Real-time ของเจ้าหน้าที่
├── components/
│   └── ui/
│       ├── Button.tsx      # Reusable Button Component สไตล์ Clean Code รองรับ Variant
│       ├── Input.tsx       # Reusable Input Component พร้อม Error Display และ Focus Wrapper
│       └── StatusBadge.tsx # Component แสดงป้ายสถานะ (Inactive, Filling, Submitted)
├── hooks/
│   └── useRealTimeSync.ts  # Custom Hook ศูนย์กลางจัดการ Realtime Engine (Broadcast, Debounce, Fallback)
├── lib/
│   └── supabase.ts        # ไฟล์สร้าง Supabase Client พร้อมค่า credentials และระบบ fallback
├── types/
│   └── patient.ts         # ไฟล์นิยาม TypeScript Interfaces, Zod Schema และ Thai Field Map
├── package.json            # ไฟล์จัดการ Dependencies และ Scripts
└── README.md               # เอกสารคำแนะนำการติดตั้งและฟีเจอร์ของโปรเจกต์
```

---

### 2. Design Decisions (แนวคิดการออกแบบ UI/UX)

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
   - ฝั่งเจ้าหน้าที่รองรับหน้าจอคอมพิวเตอร์และมอนิเตอร์กว้าง ด้วยระบบ Bento-grid / Split-screen แสดงสถานะสดฝั่งซ้ายและรายละเอียดดราฟต์ฝั่งขวา

---

### 3. Component Architecture (สถาปัตยกรรมคอมโพเนนต์)

เลือกใช้หลักการ Clean Code และ Atomic Design ในการแยกคอมโพเนนต์เพื่อไม่ให้เกิดโค้ดซ้ำซ้อน (DRY Principle):

- **`Input.tsx`**:
  - รับ props สำหรับการจัดการฟอร์ม (`register`, `error`, `icon`, `onFocus`, `onBlur`)
  - ซ่อนการจัดการขอบสีแดงเตือน Error และการแสดงไอคอนไว้ภายในตัวเอง ทำให้โค้ดในหน้า `patient/page.tsx` อ่านง่ายและกระชับ
- **`Button.tsx`**:
  - รองรับ variants เช่น `primary`, `secondary`, `ghost`, `danger` พร้อมจัดการสถานะ `isLoading` และไอคอน
- **`StatusBadge.tsx`**:
  - แสดงผลไฟแสดงสถานะกระพริบ (Pulsing dot) พร้อมข้อความภาษาไทยและสีประจำสถานะอย่างเป็นเอกภาพ
- **`useRealTimeSync.ts` (Network & State Encapsulation)**:
  - แยก logic ทางด้านเน็ตเวิร์กออกจาก UI Component อย่างเด็ดขาด
  - ทำหน้าที่คุม WebSocket Channel, คำนวณ Debounce Timer 3 วินาที, ล้างค่าเมื่อ unmount และสลับไปใช้ LocalStorage Fallback เมื่อไม่ได้เชื่อมต่อ Supabase

---

### 4. Real-Time Synchronization Flow (การไหลของข้อมูล)

```text
+------------------------------------+             +------------------------------------+
|  Patient View (/patient)           |             |  Staff Dashboard (/staff)          |
+------------------------------------+             +------------------------------------+
                  |                                                  ^
   (1) User Focuses Input Field                                      |
                  |                                                  |
                  v                                                  |
     Instant Active Field Broadcast  ─────── Broadcast ──────────────┤ (2) Highlights Field Box
     payload: { fieldName: 'firstName' }                               |     & Status -> "filling"
                  |                                                  |
   (3) User Types Data                                               |
                  |                                                  |
            Debounce Timer (3s)                                      |
                  |                                                  |
                  v                                                  |
     Debounced Draft Payload Broadcast ────── Broadcast ──────────────┤ (4) Live Updates Form Draft
     payload: { draft: { firstName: 'สมชาย' } }                       |     Values in Real-Time
                  |                                                  |
   (5) User Clicks Submit (Zod Pass)                                 |
                  |                                                  |
                  v                                                  |
     Submit Event Broadcast         ─────── Broadcast ───────────────┘ (6) Updates Status -> "submitted"
     payload: { type: 'submit' }                                           & Saves to Completed List
```

**คำอธิบายขั้นตอน:**
1. **การจับ Focus**: เมื่อคนไข้แตะช่องกรอกข้อมูล ฟังก์ชัน `handleFieldFocus` จะส่ง Event บอกชื่อช่องทันที เจ้าหน้าที่เห็นขอบเรืองแสงพร้อมข้อความเตือนทันที
2. **การ Debounce 3 วินาที**: ข้อมูลตัวอักษรที่กรอกจะถูกเก็บใน Buffer และจะส่งออกไปหาเจ้าหน้าที่หลังจากหยุดพิมพ์ 3 วินาที เพื่อประหยัดแบนด์วิธเครือข่าย
3. **การส่งฟอร์มสำเร็จ**: เมื่อผ่านการตรวจ Zod Validation และกด Submit ระบบจะเปลี่ยนสถานะเป็น `submitted` และบันทึกประวัติลงตารางฝั่งเจ้าหน้าที่
4. **การล้างสถานะ**: เมื่อคนไข้กดปุ่มย้อนกลับหรือปิดหน้าจอ ฟังก์ชัน `resetSyncState()` จะส่งสัญญาณล้างค่า ทำให้หน้าจอเจ้าหน้าที่กลับสู่สถานะ `inactive` โดยไม่ค้าง

---

## 🇬🇧 English Version

### 1. Project Structure

This project follows the Next.js 15 (App Router) , structuring codebase responsibilities cleanly:

```text
.
├── app/
│   ├── globals.css         # Global styling with Tailwind CSS v4
│   ├── layout.tsx          # Root layout defining fonts and HTML wrapper
│   ├── page.tsx            # Role selection portal (Patient vs. Staff)
│   ├── patient/
│   │   └── page.tsx        # Patient intake form page
│   └── staff/
│       └── page.tsx        # Staff live monitoring dashboard
├── components/
│   └── ui/
│       ├── Button.tsx      # Reusable button component with variant support
│       ├── Input.tsx       # Reusable input component handling errors and focus
│       └── StatusBadge.tsx # Status badge component (Inactive, Filling, Submitted)
├── hooks/
│   └── useRealTimeSync.ts  # Custom hook encapsulating Supabase Realtime & Debounce logic
├── lib/
│   └── supabase.ts        # Supabase client initializer with fallback credentials
├── types/
│   └── patient.ts         # TypeScript interfaces, Zod schema, and Thai field mappings
├── package.json            # Project dependencies and script declarations
└── README.md               # Setup guide and project documentation
```

---

### 2. Design Decisions

1. **Reduced Cognitive Load for Patients**:
   - Collecting 12 form fields on a single long page causes user fatigue and errors.
   - The form is grouped into 4 distinct cards (*Personal Details*, *Contact Information*, *Demographics*, and *Emergency Contact*) so patients can complete registration step-by-step.

2. **Dark Mode for Staff Dashboard**:
   - Healthcare workers spend hours staring at monitoring displays.
   - A dark theme (`bg-slate-950`) reduces screen glare and eye strain while making vibrant status indicators (e.g., Emerald for Submitted, Cyan for Filling) easy to spot.

3. **Responsive Mobile & Desktop Layouts**:
   - The patient portal is optimized for mobile touch targets (44px+ height).
   - The staff dashboard utilizes a multi-column desktop grid with real-time indicators on the left and live draft previews on the right.

---

### 3. Component Architecture

The codebase adheres to Clean Code and DRY principles by isolating UI elements and business logic:

- **`Input.tsx`**: Encapsulates label styling, icons, error messages, and focus borders.
- **`Button.tsx`**: Standardizes button variants (`primary`, `secondary`, `ghost`, `danger`) and loading spinners.
- **`StatusBadge.tsx`**: Provides a visual status indicator with pulsing dots and localized Thai labels.
- **`useRealTimeSync.ts`**: Encapsulates network channels, 3-second debounce timers, fallback syncing, and state cleanup away from UI rendering logic.

---

### 4. Real-Time Synchronization Flow

```text
[ Patient View (/patient) ]                             [ Staff Dashboard (/staff) ]
          │                                                         ▲
 (1) Touch/Focus Field                                              │
          │                                                         │
   Instant Active Field Event ───────── Broadcast Channel ──────────┼── (2) Highlight field border
   { fieldName: 'phone' }                                           │    & set status to "filling"
          │                                                         │
 (3) User Types Text                                                │
          │                                                         │
    Debounce Timer (3s)                                             │
          │                                                         │
   Debounced Draft Event      ───────── Broadcast Channel ──────────┼── (4) Update live draft preview
   { draft: { phone: '081...' } }                                   │
          │                                                         │
 (5) Click Submit & Pass Zod                                        │
          │                                                         │
   Submit Form Event          ───────── Broadcast Channel ──────────└── (6) Set status to "submitted"
   { type: 'submit' }                                                    & add to submitted table
```

1. **Instant Focus Sync**: Active field focus is broadcasted immediately upon touch.
2. **3-Second Debounce**: Draft text changes are debounced by 3 seconds before being transmitted across WebSockets to reduce bandwidth.
3. **Submission & Cleanup**: Form submission pushes records to the completed table, while back navigation triggers `resetSyncState()` to gracefully return the system to `inactive`.
