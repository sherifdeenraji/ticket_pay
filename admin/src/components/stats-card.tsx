import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: ReactNode;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan';
}

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'bg-indigo-500',
    text: 'text-indigo-600',
    change: 'text-emerald-600 bg-emerald-50',
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-500',
    text: 'text-emerald-600',
    change: 'text-emerald-600 bg-emerald-50',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-500',
    text: 'text-amber-600',
    change: 'text-emerald-600 bg-emerald-50',
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'bg-rose-500',
    text: 'text-rose-600',
    change: 'text-emerald-600 bg-emerald-50',
  },
  cyan: {
    bg: 'bg-cyan-50',
    icon: 'bg-cyan-500',
    text: 'text-cyan-600',
    change: 'text-emerald-600 bg-emerald-50',
  },
};

export default function StatsCard({ title, value, change, icon, color }: StatsCardProps) {
  const colors = colorMap[color];
  return (
    <div className="stat-card bg-white border border-slate-100 animate-fadeIn">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{value}</p>
          <div className="mt-3">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${colors.change}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 9V3M6 3L3 6M6 3L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {change}
            </span>
          </div>
        </div>
        <div className={`w-12 h-12 ${colors.icon} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
