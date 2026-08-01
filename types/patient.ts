import { z } from 'zod';

export const patientFormSchema = z
  .object({
    firstName: z.string().min(1, 'กรุณากรอกชื่อจริง (บังคับ)'),
    middleName: z.string().optional().or(z.literal('')),
    lastName: z.string().min(1, 'กรุณากรอกนามสกุล (บังคับ)'),
    dob: z.string().min(1, 'กรุณาระบุวันเดือนปีเกิด (บังคับ)'),
    gender: z.string().min(1, 'กรุณาเลือกเพศ (บังคับ)'),
    phone: z
      .string()
      .min(1, 'กรุณากรอกเบอร์โทรศัพท์ (บังคับ)')
      .regex(/^[0-9\-\+\s]{9,12}$/, 'กรุณากรอกเบอร์โทรศัพท์ 9-12 หลักให้ถูกต้อง'),
    email: z
      .string()
      .min(1, 'กรุณากรอกอีเมล (บังคับ)')
      .email('รูปแบบอีเมลไม่ถูกต้อง'),
    address: z.string().min(1, 'กรุณากรอกที่อยู่ปัจจุบัน (บังคับ)'),
    language: z.string().min(1, 'กรุณาระบุภาษาที่ถนัด (บังคับ)'),
    nationality: z.string().min(1, 'กรุณาระบุสัญชาติ (บังคับ)'),
    emergencyName: z.string().optional().or(z.literal('')),
    emergencyRelation: z.string().optional().or(z.literal('')),
    religion: z.string().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    const hasName = Boolean(data.emergencyName && data.emergencyName.trim().length > 0);
    const hasRelation = Boolean(
      data.emergencyRelation && data.emergencyRelation.trim().length > 0
    );

    if (hasName || hasRelation) {
      if (!hasName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'หากเริ่มพิมพ์ผู้ติดต่อฉุกเฉิน กรุณากรอกชื่อ-นามสกุลให้ครบถ้วน',
          path: ['emergencyName'],
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
