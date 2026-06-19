import { useMemo } from 'react';
import { CalendarDays, TrendingDown, BarChart3 } from 'lucide-react';
import type { LogEntry } from '../types';
import {
  calculateDailyTotal,
  formatCarbonValue,
  categorizeImpact,
} from '../utils/carbonEngine';

interface DashboardSummaryProps {
  entries: LogEntry[];
}

const IMPACT_COLORS: Record<string, string> = {
  low: 'text-[#3DDC97]',
  moderate: 'text-[#E8B84B]',
  high: 'text-[#E8634B]',
  'very-high': 'text-[#E8634B]',
};

const IMPACT_DOT_BG: Record<string, string> = {
  low: 'bg-[#3DDC97]',
  moderate: 'bg-[#E8B84B]',
  high: 'bg-[#E8634B]',
  'very-high': 'bg-[#E8634B]',
};

const IMPACT_RADIAL_BG: Record<string, string> = {
  low: 'rgba(61, 220, 151, 0.05)',
  moderate: 'rgba(232, 184, 75, 0.05)',
  high: 'rgba(232, 99, 75, 0.05)',
  'very-high': 'rgba(232, 99, 75, 0.05)',
};

/**
 * Dashboard summary component that displays aggregated carbon footprint
 * totals for today, this week, and this month, along with an impact
 * level badge color-coded by severity.
 */
export default function DashboardSummary({ entries }: DashboardSummaryProps) {
  const today = new Date().toISOString().split('T')[0];

  const { todayTotal, weekTotal, monthTotal, impact } = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const todayEntries = entries.filter((e) => e.date === today);
    const weekEntries = entries.filter(
      (e) => e.date && new Date(e.date) >= weekAgo
    );
    const monthEntries = entries.filter(
      (e) => e.date && new Date(e.date) >= monthAgo
    );

    const tTotal = calculateDailyTotal(todayEntries);
    return {
      todayTotal: tTotal,
      weekTotal: calculateDailyTotal(weekEntries),
      monthTotal: calculateDailyTotal(monthEntries),
      impact: categorizeImpact(tTotal),
    };
  }, [entries, today]);

  const stats = [
    { label: 'Today', value: formatCarbonValue(todayTotal), Icon: TrendingDown },
    { label: 'This Week', value: formatCarbonValue(weekTotal), Icon: CalendarDays },
    { label: 'This Month', value: formatCarbonValue(monthTotal), Icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Impact badge Hero Card */}
      <div
        className="relative overflow-hidden p-8 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#131A16] transition-all duration-200"
        style={{
          background: `radial-gradient(circle at top right, ${IMPACT_RADIAL_BG[impact]} 0%, #131A16 70%)`
        }}
        aria-label={`Your daily impact level is ${impact}`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA098] mb-2">Today's Impact Level</p>
        <div className="flex items-center gap-4">
          <span className={`w-3.5 h-3.5 rounded-full ${IMPACT_DOT_BG[impact]}`} />
          <h2 className={`text-5xl font-bold font-display tracking-tight capitalize ${IMPACT_COLORS[impact]}`}>
            {impact.replace('-', ' ')}
          </h2>
        </div>
      </div>

      {/* Stats grid (responsive under 640px, 640px-1024px, above 1024px) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#131A16] rounded-xl p-5 border border-[rgba(255,255,255,0.08)] border-top-[1px] border-top-[rgba(255,255,255,0.06)] hover:bg-[#1A2420] hover:border-[rgba(255,255,255,0.14)] transition-all duration-150 ease-in-out"
            aria-label={`${stat.label}: ${stat.value}`}
          >
            <div className="flex items-center gap-2 text-[#8FA098] mb-3">
              <stat.Icon className="w-4 h-4 text-[#8FA098]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold font-display text-[#F2F5F3] tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
