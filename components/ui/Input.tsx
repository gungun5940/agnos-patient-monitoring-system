import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
  requiredField?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helperText, requiredField, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 inline-flex items-center gap-1.5 w-fit">
            <span>{label}</span>
            {requiredField && <span className="text-rose-400 font-bold ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center group">
          {icon && (
            <div className="absolute left-3.5 text-cyan-400 [&_svg]:text-cyan-400 [&_svg]:stroke-cyan-400 shrink-0 pointer-events-none transition-colors duration-200 flex items-center justify-center z-10">
              {React.isValidElement<{ className?: string }>(icon)
                ? React.cloneElement(icon, {
                    className: `w-4 h-4 text-cyan-400 stroke-cyan-400 ${
                      (icon.props.className || '').replace(/text-slate-\d+/g, '').replace(/text-gray-\d+/g, '')
                    }`.trim(),
                  })
                : icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full rounded-xl border bg-slate-900/90 backdrop-blur-sm px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500
              transition-all duration-200 ease-in-out
              outline-none
              ${icon ? 'pl-10' : 'pl-4'}
              ${
                error
                  ? 'border-rose-500/80 bg-rose-950/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20'
                  : 'border-slate-800 hover:border-slate-700 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 focus:bg-slate-900'
              }
              shadow-sm disabled:cursor-not-allowed disabled:bg-slate-950 disabled:text-slate-600
              ${className}
            `}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs font-medium text-rose-400 flex items-center gap-1 animate-fadeIn">
            <span>•</span> {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
