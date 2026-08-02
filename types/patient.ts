import { z } from 'zod';

export const patientFormSchema = z
  .object({
    title: z.string().min(1, 'กรุณาเลือกคำนำหน้าชื่อ (บังคับ)'),
    firstName: z.string().min(1, 'กรุณากรอกชื่อจริง (บังคับ)'),
    middleName: z.string().optional().or(z.literal('')),
    lastName: z.string().min(1, 'กรุณากรอกนามสกุล (บังคับ)'),
    dob: z.string().min(1, 'กรุณาระบุวันเดือนปีเกิด (บังคับ)'),
    gender: z.string().min(1, 'กรุณาเลือกเพศ (บังคับ)'),
    symptoms: z.string().optional().or(z.literal('')),
    phone: z
      .string()
      .min(1, 'กรุณากรอกเบอร์โทรศัพท์ (บังคับ)')
      .regex(/^[0-9\-\+\s]{9,12}$/, 'กรุณากรอกเบอร์โทรศัพท์ 9-12 หลักให้ถูกต้อง'),
    email: z
      .string()
      .min(1, 'กรุณากรอกอีเมล (บังคับ)')
      .email('รูปแบบอีเมลไม่ถูกต้อง'),
    address: z.string().min(1, 'กรุณากรอกที่อยู่ปัจจุบัน (บังคับ)'),
    language: z.string().min(1, 'กรุณาระบุภาษาที่ต้องการใช้ (บังคับ)'),
    nationality: z.string().min(1, 'กรุณาระบุสัญชาติ (บังคับ)'),
    emergencyName: z.string().optional().or(z.literal('')),
    emergencyPhone: z.string().optional().or(z.literal('')),
    emergencyRelation: z.string().optional().or(z.literal('')),
    religion: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    const hasName = Boolean(data.emergencyName && data.emergencyName.trim().length > 0);
    const hasPhone = Boolean(data.emergencyPhone && data.emergencyPhone.trim().length > 0);
    const hasRelation = Boolean(
      data.emergencyRelation && data.emergencyRelation.trim().length > 0
    );

    if (hasName || hasPhone || hasRelation) {
      if (!hasName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'หากเริ่มพิมพ์ผู้ติดต่อฉุกเฉิน กรุณากรอกชื่อ-นามสกุลให้ครบถ้วน',
          path: ['emergencyName'],
        });
      }
      if (!hasPhone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'หากเริ่มพิมพ์ผู้ติดต่อฉุกเฉิน กรุณากรอกเบอร์โทรให้ครบถ้วน',
          path: ['emergencyPhone'],
        });
      }
      if (!hasRelation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'หากเริ่มพิมพ์ผู้ติดต่อฉุกเฉิน กรุณากรอกความสัมพันธ์ให้ครบถ้วน',
          path: ['emergencyRelation'],
        });
      }
    }
    if (hasPhone && data.emergencyPhone) {
      if (!/^[0-9\-\+\s]{9,12}$/.test(data.emergencyPhone.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'กรุณากรอกเบอร์โทรผู้ติดต่อฉุกเฉิน 9-12 หลักให้ถูกต้อง',
          path: ['emergencyPhone'],
        });
      }
    }
  });

export type PatientFormData = z.infer<typeof patientFormSchema>;

export type FormStatus = 'inactive' | 'filling' | 'submitted';

export interface SyncMessage {
  type: 'draft_update' | 'submit' | 'reset' | 'initial_state';
  status: FormStatus;
  formData: Partial<PatientFormData>;
  submittedRecords?: PatientRecord[];
  activeField?: string | null;
  activeFieldName?: string | null;
  updatedAt: string;
}

export interface PatientRecord {
  id: string;
  data: PatientFormData;
  submittedAt: string;
}

export interface PatientSession {
  sessionId: string;
  status: FormStatus;
  draftData: Partial<PatientFormData>;
  activeField: string | null;
  activeFieldName: string | null;
  lastUpdated: string;
}

