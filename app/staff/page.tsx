'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  ArrowLeft,
  Activity,
  Radio,
  UserCheck,
  RotateCcw,
  Clock,
  Search,
  Users,
  ShieldCheck,
  Eye,
  AlertCircle,
  Sparkles,
  Lock,
  KeyRound,
  ShieldAlert,
  LogOut,
} from 'lucide-react';

export default function StaffPage() {
  const {
    isConnected,
    status,
    draftData,
    activeField,
    activeFieldName,
    submittedRecords,
    lastUpdated,
    resetSyncState,
  } = useRealTimeSync();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authed = sessionStorage.getItem('staff_authed');
      if (authed === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPassword = process.env.NEXT_PUBLIC_STAFF_PASSWORD || 'AgnosStaff2026';
    if (passwordInput === targetPassword) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('staff_authed', 'true');
      }
      setIsAuthenticated(true);
      setPasswordError(null);
    } else {
      setPasswordError('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง (Invalid Password)');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('staff_authed');
    }
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  const filteredRecords = submittedRecords.filter((rec) => {
    const q = searchTerm.toLowerCase();
    return (
      (rec.data.title || '').toLowerCase().includes(q) ||
      (rec.data.firstName || '').toLowerCase().includes(q) ||
      (rec.data.lastName || '').toLowerCase().includes(q) ||
      (rec.data.phone || '').includes(q) ||
      (rec.data.email || '').toLowerCase().includes(q) ||
      (rec.data.symptoms || '').toLowerCase().includes(q)
    );
  });

  const selectedRecord = submittedRecords.find((r) => r.id === selectedRecordId);

  // If not authenticated, render Simple Password Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl space-y-6 relative overflow-hidden">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                <span>Agnos Staff Security Gate</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                ระบบรักษาความปลอดภัยพื้นที่เฉพาะเจ้าหน้าที่ (Staff Authentication)
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>กรอกรหัสผ่านเจ้าหน้าที่ (Staff Password)</span>
                <span className="text-[10px] text-emerald-400 font-mono">(ENV Password)</span>
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="รหัสผ่านเข้าใช้งาน... (Enter password)"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{passwordError}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="staff"
              size="lg"
              className="w-full justify-center"
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              ปลดล็อกเข้าสู่แดชบอร์ด (Unlock Dashboard)
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่หน้าหลัก (Back to Home)</span>
            </Link>
            <span className="text-[11px] text-slate-500 font-mono">
              Default: AgnosStaff2026
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-10 space-y-6">
      {/* Top Staff Navigation Bar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              ย้อนกลับ (Back)
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>แดชบอร์ดเจ้าหน้าที่มอนิเตอร์สด (Staff Real-Time Stream Dashboard)</span>
            </h1>
            <p className="text-xs text-slate-400">
              ติดตามการกรอกข้อมูลสดของคนไข้ผ่าน Supabase Realtime (Live Sync)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>{isConnected ? 'Supabase Live Stream Active' : 'Disconnected'}</span>
          </div>

          <StatusBadge status={status} activeFieldName={activeFieldName} />

          <Button
            variant="outline"
            size="sm"
            onClick={resetSyncState}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            ล้างสถานะ (Reset Status)
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            icon={<LogOut className="w-3.5 h-3.5 text-rose-400" />}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
          >
            ออกจากระบบ (Log Out)
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Active Typing Monitor Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>การกรอกข้อมูลสดขณะนี้ (Live Draft Monitor)</span>
              </div>
              {lastUpdated && (
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </div>

            {status === 'filling' ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800/60 text-amber-300 text-xs flex items-center justify-between">
                  <span>กำลังโฟกัสฟิลด์ (Focusing Field):</span>
                  <span className="font-bold animate-pulse">
                    {activeFieldName || activeField || 'กำลังกรอก...'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2.5 rounded-xl border transition-all ${activeField === 'title' ? 'bg-cyan-950 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/30' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    <span className="text-slate-500 block text-[10px]">คำนำหน้า (Prefix):</span>
                    <span className="font-semibold">{draftData.title || '-'}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border transition-all ${activeField === 'firstName' ? 'bg-cyan-950 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/30' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    <span className="text-slate-500 block text-[10px]">ชื่อจริง (First Name):</span>
                    <span className="font-semibold">{draftData.firstName || '-'}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border transition-all ${activeField === 'middleName' ? 'bg-cyan-950 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/30' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    <span className="text-slate-500 block text-[10px]">ชื่อกลาง (Middle Name):</span>
                    <span className="font-semibold">{draftData.middleName || '-'}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border transition-all ${activeField === 'lastName' ? 'bg-cyan-950 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/30' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    <span className="text-slate-500 block text-[10px]">นามสกุล (Last Name):</span>
                    <span className="font-semibold">{draftData.lastName || '-'}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border transition-all ${activeField === 'dob' ? 'bg-cyan-950 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/30' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    <span className="text-slate-500 block text-[10px]">วันเกิด (DOB):</span>
                    <span className="font-mono">{draftData.dob || '-'}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border transition-all ${activeField === 'gender' ? 'bg-cyan-950 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/30' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    <span className="text-slate-500 block text-[10px]">เพศ (Gender):</span>
                    <span className="font-semibold">{draftData.gender || '-'}</span>
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border transition-all text-xs ${activeField === 'symptoms' ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-2 ring-amber-500/30' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                  <span className="text-slate-500 block text-[10px]">อาการป่วยเบื้องต้น (Initial Symptoms):</span>
                  <span className="font-medium text-amber-300/90">{draftData.symptoms || '-'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2.5 rounded-xl border transition-all ${activeField === 'phone' ? 'bg-cyan-950 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/30' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    <span className="text-slate-500 block text-[10px]">เบอร์โทร (Phone):</span>
                    <span className="font-semibold">{draftData.phone || '-'}</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border transition-all ${activeField === 'email' ? 'bg-cyan-950 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/30' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    <span className="text-slate-500 block text-[10px]">อีเมล (Email):</span>
                    <span className="font-semibold">{draftData.email || '-'}</span>
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border transition-all text-xs ${activeField === 'address' ? 'bg-cyan-950 border-cyan-500 text-cyan-200 ring-2 ring-cyan-500/30' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                  <span className="text-slate-500 block text-[10px]">ที่อยู่ปัจจุบัน (Address):</span>
                  <span>{draftData.address || '-'}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className={`p-2 rounded-xl border transition-all ${activeField === 'language' ? 'bg-cyan-950 border-cyan-500 text-cyan-200' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    <span className="text-slate-500 block text-[10px]">ภาษา (Language):</span>
                    <span>{draftData.language || '-'}</span>
                  </div>
                  <div className={`p-2 rounded-xl border transition-all ${activeField === 'nationality' ? 'bg-cyan-950 border-cyan-500 text-cyan-200' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    <span className="text-slate-500 block text-[10px]">สัญชาติ (Nationality):</span>
                    <span>{draftData.nationality || '-'}</span>
                  </div>
                  <div className={`p-2 rounded-xl border transition-all ${activeField === 'religion' ? 'bg-cyan-950 border-cyan-500 text-cyan-200' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                    <span className="text-slate-500 block text-[10px]">ศาสนา (Religion):</span>
                    <span>{draftData.religion || '-'}</span>
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border transition-all text-xs ${activeField === 'emergencyName' || activeField === 'emergencyRelation' ? 'bg-rose-950/60 border-rose-500 text-rose-200 ring-2 ring-rose-500/30' : 'bg-slate-950 border-slate-800 text-slate-300'}`}>
                  <span className="text-slate-500 block text-[10px]">ผู้ติดต่อฉุกเฉิน (Emergency Contact):</span>
                  <span>{draftData.emergencyName ? `${draftData.emergencyName} (${draftData.emergencyRelation || 'ไม่ระบุความสัมพันธ์'})` : '-'}</span>
                </div>
              </div>
            ) : status === 'submitted' ? (
              <div className="p-8 text-center bg-emerald-950/30 border border-emerald-800/40 rounded-2xl space-y-2">
                <UserCheck className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                <p className="font-semibold text-emerald-300 text-sm">คนไข้ส่งข้อมูลเรียบร้อยแล้ว! (Registration Submitted!)</p>
                <p className="text-xs text-emerald-400/70">ข้อมูลถูกบันทึกลงในตารางฝั่งขวาอัตโนมัติ</p>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
                <p className="text-xs">ยังไม่มีคนไข้เริ่มกรอกข้อมูลในขณะนี้ (No active patient filling form)</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Submitted Patient Table & Details View (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>ตารางประวัติคนไข้ที่ลงทะเบียนแล้ว (Registered Patients List) ({submittedRecords.length})</span>
                </h3>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, อาการ, เบอร์โทร... (Search name, phone...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                ไม่พบประวัติการลงทะเบียน (No registration records found)
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3 rounded-l-xl">รหัส / เวลา (ID / Time)</th>
                      <th className="p-3">ชื่อ-นามสกุล (Full Name)</th>
                      <th className="p-3">เบอร์โทร (Phone)</th>
                      <th className="p-3">ภาษา (Language)</th>
                      <th className="p-3 rounded-r-xl text-right">จัดการ (Action)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono">
                          <span className="text-emerald-400 font-bold">{rec.id}</span>
                          <span className="block text-[10px] text-slate-500">
                            {new Date(rec.submittedAt).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-white">
                          {rec.data.title ? `${rec.data.title} ` : ''}{rec.data.firstName} {rec.data.middleName ? `${rec.data.middleName} ` : ''}{rec.data.lastName}
                        </td>
                        <td className="p-3 text-slate-400">{rec.data.phone}</td>
                        <td className="p-3 text-slate-400">{rec.data.language}</td>
                        <td className="p-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setSelectedRecordId(rec.id)}
                          >
                            ดูรายละเอียด (Details)
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detailed View Modal for Selected Patient */}
          {selectedRecord && (
            <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 space-y-4 animate-fadeIn shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>รายละเอียดคนไข้ (Patient Details): {selectedRecord.data.title || ''} {selectedRecord.data.firstName} {selectedRecord.data.lastName} ({selectedRecord.id})</span>
                </h4>
                <button
                  onClick={() => setSelectedRecordId(null)}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  ปิด [X] (Close)
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">คำนำหน้าชื่อ (Prefix):</span>
                  <span className="font-semibold text-white">{selectedRecord.data.title || '-'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">ชื่อจริง (First Name):</span>
                  <span className="font-semibold text-white">{selectedRecord.data.firstName}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">ชื่อกลาง (Middle Name):</span>
                  <span className="text-white">{selectedRecord.data.middleName || '-'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">นามสกุล (Last Name):</span>
                  <span className="font-semibold text-white">{selectedRecord.data.lastName}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">วันเกิด (Date of Birth):</span>
                  <span className="text-white">{selectedRecord.data.dob}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">เพศ (Gender):</span>
                  <span className="text-white">{selectedRecord.data.gender}</span>
                </div>

                {/* Symptoms highlight box */}
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 col-span-2 sm:col-span-3">
                  <span className="text-amber-400 block text-[10px] font-semibold uppercase tracking-wider mb-0.5">อาการป่วยเบื้องต้น (Initial Symptoms / Chief Complaint):</span>
                  <span className="text-slate-200">{selectedRecord.data.symptoms || 'ไม่ได้ระบุอาการป่วยเบื้องต้น (None provided)'}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">เบอร์โทรศัพท์ (Phone Number):</span>
                  <span className="text-white font-mono">{selectedRecord.data.phone}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 col-span-2">
                  <span className="text-slate-500 block text-[10px]">อีเมล (Email Address):</span>
                  <span className="text-white">{selectedRecord.data.email}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">ภาษาที่ต้องการใช้ (Preferred Language):</span>
                  <span className="text-white">{selectedRecord.data.language}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 col-span-3">
                  <span className="text-slate-500 block text-[10px]">ที่อยู่ปัจจุบัน (Current Address):</span>
                  <span className="text-slate-200">{selectedRecord.data.address}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">สัญชาติ (Nationality):</span>
                  <span className="text-white">{selectedRecord.data.nationality}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">ศาสนา (Religion):</span>
                  <span className="text-white">{selectedRecord.data.religion || '-'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 col-span-2">
                  <span className="text-slate-500 block text-[10px]">ผู้ติดต่อฉุกเฉิน & ความสัมพันธ์ (Emergency Contact):</span>
                  <span className="text-rose-300 font-medium">
                    {selectedRecord.data.emergencyName
                      ? `${selectedRecord.data.emergencyName} (${selectedRecord.data.emergencyRelation})`
                      : 'ไม่ได้ระบุ (None)'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
