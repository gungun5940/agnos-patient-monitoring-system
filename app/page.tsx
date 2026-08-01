import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  User,
  Activity,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden">
      {/* Glow Orbs background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pb-8 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>AGNOS HEALTHCARE</span>
            </h1>
            <p className="text-xs text-slate-400">ระบบลงทะเบียนผู้ป่วยและมอนิเตอร์เจ้าหน้าที่แบบเรียลไทม์</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Real-Time Sync Online</span>
          </span>
        </div>
      </header>

      {/* Main Content / 2 Cards */}
      <main className="max-w-5xl mx-auto w-full my-auto py-12 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Agnos Health Smart Registration System</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            ลงทะเบียนและติดตามสถานะผู้ป่วย
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            บริการข้อมูลการลงทะเบียนสำหรับผู้ป่วย และศูนย์มอนิเตอร์ติดตามสถานะการเข้ารับบริการของเจ้าหน้าที่แบบเรียลไทม์
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Patient Portal */}
          <div className="group relative bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-3xl p-8 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                <User className="w-7 h-7" />
              </div>

              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                  PATIENT PORTAL
                </span>
                <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                  1. แบบฟอร์มลงทะเบียนคนไข้
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  สำหรับผู้ป่วยกรอกข้อมูลประวัติส่วนตัวและรายละเอียดการติดต่อเพื่อรับการเปิดประวัติการรักษา
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>บันทึกประวัติผู้ป่วยอย่างครบถ้วนและแม่นยำ</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>รองรับการระบุข้อมูลผู้ติดต่อฉุกเฉิน</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>ตรวจสอบความถูกต้องของข้อมูลโดยอัตโนมัติ</span>
                </li>
              </ul>
            </div>

            <Link href="/patient" className="w-full">
              <Button
                variant="patient"
                size="lg"
                className="w-full"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                เข้าสู่หน้าฟอร์มคนไข้
              </Button>
            </Link>
          </div>

          {/* Card 2: Staff Monitor Portal */}
          <div className="group relative bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-8 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-7 h-7" />
              </div>

              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest block mb-1">
                  STAFF DASHBOARD
                </span>
                <h3 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                  2. หน้าจอมอนิเตอร์เจ้าหน้าที่
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  สำหรับเจ้าหน้าที่และพยาบาลในการตรวจสอบข้อมูลและติดตามสถานะการเข้ารับบริการของผู้ป่วย
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ติดตามสถานะการกรอกข้อมูลของผู้ป่วย</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>รับข้อมูลการลงทะเบียนเพื่อนำไปคัดกรองต่อ</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ค้นหาและจัดการประวัติผู้ป่วยย้อนหลัง</span>
                </li>
              </ul>
            </div>

            <Link href="/staff" className="w-full">
              <Button
                variant="staff"
                size="lg"
                className="w-full"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                เข้าสู่หน้าจอเจ้าหน้าที่
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 Agnos Health Real-Time Portal. Built with Next.js App Router.</p>
        <div className="flex items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>ระบบตรวจสอบข้อมูลอัตโนมัติ</span>
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Real-Time Broadcast Engine</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
