import React from 'react';
import { FormStatus } from '@/types/patient';

export interface StatusBadgeProps {
  status: FormStatus;
  activeFieldName?: string | null;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  activeFieldName,
  className = '',
}) => {
  const configs = {
    inactive: {
      bg: 'bg-slate-900 text-slate-400 border-slate-800',
      dot: 'bg-slate-500',
      label: 'ยังไม่มีการใช้งาน',
    },
    filling: {
      bg: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
      dot: 'bg-amber-400 animate-ping',
      label: activeFieldName ? `กำลังกรอก: ${activeFieldName}` : 'กำลังกรอกข้อมูลสด...',
    },
    submitted: {
      bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
      dot: 'bg-emerald-400',
      label: 'ส่งข้อมูลเรียบร้อยแล้ว',
    },
  };

  const current = configs[status] || configs.inactive;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-medium tracking-wide shadow-sm backdrop-blur-md transition-all duration-300 ${current.bg} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {status === 'filling' && (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dot}`} />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            status === 'filling' ? 'bg-amber-400' : current.dot
          }`}
        />
      </span>
      <span>{current.label}</span>
    </div>
  );
};
