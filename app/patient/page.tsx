'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientFormSchema, PatientFormData } from '@/types/patient';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  ArrowLeft,
  User,
  UserCheck,
  Users,
  Calendar,
  Phone,
  Mail,
  Home,
  Globe,
  Flag,
  Sparkles,
  Heart,
  PhoneCall,
  HeartHandshake,
  Send,
  CheckCircle2,
  Activity,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

const THAI_FIELD_LABELS: Record<keyof PatientFormData, string> = {
  firstName: 'ชื่อจริง',
  middleName: 'ชื่อกลาง',
  lastName: 'นามสกุล',
  dob: 'วันเดือนปีเกิด',
  gender: 'เพศ',
  phone: 'เบอร์โทรศัพท์',
  email: 'อีเมล',
  address: 'ที่อยู่ปัจจุบัน',
  language: 'ภาษาที่ต้องการใช้',
  nationality: 'สัญชาติ',
  emergencyName: 'ชื่อผู้ติดต่อฉุกเฉิน',
  emergencyRelation: 'ความสัมพันธ์ผู้ติดต่อฉุกเฉิน',
  religion: 'ศาสนา',
};

export default function PatientPage() {
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const { updateDraft, clearActiveField, submitPatientForm, resetSyncState, isConnected, status, activeFieldName } = useRealTimeSync();

  // Reset sync state when leaving page or unmounting
  React.useEffect(() => {
    return () => {
      resetSyncState();
    };
  }, [resetSyncState]);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      dob: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      language: 'ไทย',
      nationality: 'ไทย',
      emergencyName: '',
      emergencyRelation: '',
      religion: '',
    },
  });

  const handleFieldChange = (fieldName: keyof PatientFormData) => {
    const values = getValues();
    const label = THAI_FIELD_LABELS[fieldName] || String(fieldName);
    updateDraft(values, fieldName, label);
  };

  const handleFieldFocus = (fieldName: keyof PatientFormData) => {
    const values = getValues();
    const label = THAI_FIELD_LABELS[fieldName] || String(fieldName);
    updateDraft(values, fieldName, label);
  };

  const handleFieldBlur = () => {
    const values = getValues();
    clearActiveField(values);
  };

  const onSubmit = async (data: PatientFormData) => {
    const ok = await submitPatientForm(data);
    if (ok) {
      setSubmittedId(`PAT-${Date.now().toString().slice(-6)}`);
    }
  };

  const handleRegisterNew = () => {
    reset();
    setSubmittedId(null);
    resetSyncState();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Link href="/" onClick={() => resetSyncState()}>
              <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                ย้อนกลับ
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                <span>แบบฟอร์มลงทะเบียนคนไข้ใหม่ (Patient Portal)</span>
              </h1>
              <p className="text-xs text-slate-400">กรอกข้อมูลเพื่อรับการตรวจประวัติ (Agnos Care Standard)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
              <Activity className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{isConnected ? 'Syncing Live' : 'Offline'}</span>
            </div>
            <StatusBadge status={status} activeFieldName={activeFieldName} />
          </div>
        </div>

        {/* Success Modal Banner */}
        {submittedId ? (
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-8 text-center space-y-6 animate-fadeIn shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-white">
                ลงทะเบียนคนไข้สำเร็จแล้ว!
              </h2>
              <p className="text-slate-400 text-sm">
                ข้อมูลของคุณถูกส่งไปยังระบบมอนิเตอร์ของเจ้าหน้าที่แบบเรียลไทม์เรียบร้อยแล้ว
              </p>
              <div className="inline-block bg-slate-950 px-5 py-2.5 rounded-xl border border-emerald-800/60 mt-2">
                <span className="text-xs text-slate-500 block">รหัสประวัติผู้ป่วย (Patient ID)</span>
                <span className="text-2xl font-mono font-bold text-emerald-400">
                  {submittedId}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-center">
              <Button
                variant="staff"
                size="md"
                onClick={handleRegisterNew}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                ลงทะเบียนคนไข้คนถัดไป
              </Button>
            </div>
          </div>
        ) : (
          /* Main Form */
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl space-y-8 shadow-xl"
          >
            {/* Section 1: Personal Info */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-cyan-400 font-semibold text-sm">
                <User className="w-4 h-4" />
                <span>ส่วนที่ 1: ข้อมูลส่วนตัว (Personal Details)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* First Name */}
                <Input
                  label="ชื่อจริง"
                  requiredField
                  icon={<User className="w-4 h-4 text-cyan-400" />}
                  placeholder="เช่น สมชาย"
                  error={errors.firstName?.message}
                  onFocus={() => handleFieldFocus('firstName')}
                  {...register('firstName', {
                    onChange: () => handleFieldChange('firstName'),
                    onBlur: () => handleFieldBlur(),
                  })}
                />

                {/* Middle Name */}
                <Input
                  label="ชื่อกลาง"
                  icon={<UserCheck className="w-4 h-4 text-cyan-400" />}
                  placeholder="ถ้ามี (สามารถเว้นว่างได้)"
                  error={errors.middleName?.message}
                  onFocus={() => handleFieldFocus('middleName')}
                  {...register('middleName', {
                    onChange: () => handleFieldChange('middleName'),
                    onBlur: () => handleFieldBlur(),
                  })}
                />

                {/* Last Name */}
                <Input
                  label="นามสกุล"
                  requiredField
                  icon={<Users className="w-4 h-4 text-cyan-400" />}
                  placeholder="เช่น ใจดี"
                  error={errors.lastName?.message}
                  onFocus={() => handleFieldFocus('lastName')}
                  {...register('lastName', {
                    onChange: () => handleFieldChange('lastName'),
                    onBlur: () => handleFieldBlur(),
                  })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* DOB */}
                <Input
                  label="วันเดือนปีเกิด"
                  requiredField
                  type="date"
                  icon={<Calendar className="w-4 h-4 text-cyan-400" />}
                  error={errors.dob?.message}
                  onFocus={() => handleFieldFocus('dob')}
                  {...register('dob', {
                    onChange: () => handleFieldChange('dob'),
                    onBlur: () => handleFieldBlur(),
                  })}
                />

                {/* Gender */}
                <div className="w-full flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 inline-flex items-center gap-1.5 w-fit">
                    <span>เพศ</span>
                    <span className="text-rose-400 font-bold ml-0.5">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-cyan-400 pointer-events-none" />
                    <select
                      className="w-full pl-10 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all"
                      onFocus={() => handleFieldFocus('gender')}
                      {...register('gender', {
                        onChange: () => handleFieldChange('gender'),
                        onBlur: () => handleFieldBlur(),
                      })}
                    >
                      <option value="">-- โปรดเลือกเพศ --</option>
                      <option value="ชาย">ชาย (Male)</option>
                      <option value="หญิง">หญิง (Female)</option>
                      <option value="ทางเลือก/อื่นๆ">ทางเลือก/อื่นๆ (Other)</option>
                      <option value="ไม่ระบุ">ไม่ต้องการระบุ (Prefer not to say)</option>
                    </select>
                  </div>
                  {errors.gender && (
                    <p className="text-xs text-rose-400">• {errors.gender.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Contact Details */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-teal-400 font-semibold text-sm">
                <Phone className="w-4 h-4" />
                <span>ส่วนที่ 2: ข้อมูลการติดต่อและที่อยู่ (Contact & Address)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Phone */}
                <Input
                  label="เบอร์โทรศัพท์"
                  requiredField
                  type="tel"
                  icon={<Phone className="w-4 h-4 text-cyan-400" />}
                  placeholder="เช่น 0812345678"
                  error={errors.phone?.message}
                  onFocus={() => handleFieldFocus('phone')}
                  {...register('phone', {
                    onChange: () => handleFieldChange('phone'),
                    onBlur: () => handleFieldBlur(),
                  })}
                />

                {/* Email */}
                <Input
                  label="อีเมล"
                  requiredField
                  type="email"
                  icon={<Mail className="w-4 h-4 text-cyan-400" />}
                  placeholder="เช่น patient@example.com"
                  error={errors.email?.message}
                  onFocus={() => handleFieldFocus('email')}
                  {...register('email', {
                    onChange: () => handleFieldChange('email'),
                    onBlur: () => handleFieldBlur(),
                  })}
                />
              </div>

              {/* Address */}
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 inline-flex items-center gap-1.5 w-fit">
                  <span>ที่อยู่ปัจจุบัน</span>
                  <span className="text-rose-400 font-bold ml-0.5">*</span>
                </label>
                <div className="relative flex items-center">
                  <Home className="absolute left-3.5 top-3 w-4 h-4 text-cyan-400 pointer-events-none" />
                  <textarea
                    rows={2}
                    placeholder="กรอกบ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                    className="w-full pl-10 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all resize-none"
                    onFocus={() => handleFieldFocus('address')}
                    {...register('address', {
                      onChange: () => handleFieldChange('address'),
                      onBlur: () => handleFieldBlur(),
                    })}
                  />
                </div>
                {errors.address && (
                  <p className="text-xs text-rose-400">• {errors.address.message}</p>
                )}
              </div>
            </div>

            {/* Section 3: Background Info */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-indigo-400 font-semibold text-sm">
                <Globe className="w-4 h-4" />
                <span>ส่วนที่ 3: ภาษา สัญชาติ และศาสนา (Background Info)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Language */}
                <div className="w-full flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 inline-flex items-center gap-1.5 w-fit">
                    <span>ภาษาที่ต้องการใช้</span>
                    <span className="text-rose-400 font-bold ml-0.5">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Globe className="absolute left-3.5 w-4 h-4 text-cyan-400 pointer-events-none" />
                    <select
                      className="w-full pl-10 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 transition-all"
                      onFocus={() => handleFieldFocus('language')}
                      {...register('language', {
                        onChange: () => handleFieldChange('language'),
                        onBlur: () => handleFieldBlur(),
                      })}
                    >
                      <option value="ไทย">ภาษาไทย (Thai)</option>
                      <option value="อังกฤษ">ภาษาอังกฤษ (English)</option>
                      <option value="จีน">ภาษาจีน (Chinese)</option>
                      <option value="ญี่ปุ่น">ภาษาญี่ปุ่น (Japanese)</option>
                      <option value="อื่นๆ">อื่นๆ (Other)</option>
                    </select>
                  </div>
                  {errors.language && (
                    <p className="text-xs text-rose-400">• {errors.language.message}</p>
                  )}
                </div>

                {/* Nationality */}
                <Input
                  label="สัญชาติ"
                  requiredField
                  icon={<Flag className="w-4 h-4 text-cyan-400" />}
                  placeholder="เช่น ไทย"
                  error={errors.nationality?.message}
                  onFocus={() => handleFieldFocus('nationality')}
                  {...register('nationality', {
                    onChange: () => handleFieldChange('nationality'),
                    onBlur: () => handleFieldBlur(),
                  })}
                />

                {/* Religion */}
                <Input
                  label="ศาสนา"
                  icon={<Sparkles className="w-4 h-4 text-cyan-400" />}
                  placeholder="พุทธ / คริสต์ / อิสลาม (เว้นว่างได้)"
                  error={errors.religion?.message}
                  onFocus={() => handleFieldFocus('religion')}
                  {...register('religion', {
                    onChange: () => handleFieldChange('religion'),
                    onBlur: () => handleFieldBlur(),
                  })}
                />
              </div>
            </div>

            {/* Section 4: Emergency Contact */}
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                  <PhoneCall className="w-4 h-4" />
                  <span>ส่วนที่ 4: ผู้ติดต่อฉุกเฉิน (Emergency Contact)</span>
                </div>
                <span className="text-[11px] text-slate-400 bg-rose-950/40 border border-rose-800/50 px-2.5 py-0.5 rounded-full">
                  ไม่บังคับกรอก แต่หากพิมพ์ต้องกรอกคู่กันทั้งชื่อและความสัมพันธ์
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-rose-950/10 p-5 rounded-2xl border border-rose-900/30">
                {/* Emergency Name */}
                <Input
                  label="ชื่อ-นามสกุล ผู้ติดต่อฉุกเฉิน"
                  icon={<PhoneCall className="w-4 h-4 text-cyan-400" />}
                  placeholder="เช่น นางสมศรี ใจดี"
                  error={errors.emergencyName?.message}
                  onFocus={() => handleFieldFocus('emergencyName')}
                  {...register('emergencyName', {
                    onChange: () => handleFieldChange('emergencyName'),
                    onBlur: () => handleFieldBlur(),
                  })}
                />

                {/* Emergency Relation */}
                <Input
                  label="ความสัมพันธ์"
                  icon={<HeartHandshake className="w-4 h-4 text-cyan-400" />}
                  placeholder="เช่น มารดา / สามี / พี่สาว"
                  error={errors.emergencyRelation?.message}
                  onFocus={() => handleFieldFocus('emergencyRelation')}
                  {...register('emergencyRelation', {
                    onChange: () => handleFieldChange('emergencyRelation'),
                    onBlur: () => handleFieldBlur(),
                  })}
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-6 border-t border-slate-800 flex justify-center items-center">
              <Button
                type="submit"
                variant="patient"
                size="lg"
                isLoading={isSubmitting}
                icon={<Send className="w-4 h-4" />}
              >
                ส่งข้อมูลลงทะเบียนคนไข้ (Submit)
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
