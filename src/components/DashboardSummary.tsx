import { useMemo } from 'react';
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
  low: 'text-emerald-400',
  moderate: 'text-yellow-400',
  high: 'text-orange-400',
  'very-high': 'text-red-400',
};

const IMPACT_BG: Record<string, string> = {
  low: 'bg-emerald-900/30 border-emerald-700',
  moderate: 'bg-yellow-900/30 border-yellow-700',
  high: 'bg-orange-900/30 border-orange-700',
  'very-high': 'bg-red-900/30 border-red-700',
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
    { label: 'Today', value: formatCarbonValue(todayTotal), icon: '📊' },
    { label: 'This Week', value: formatCarbonValue(weekTotal), icon: '📅' },
    { label: 'This Month', value: formatCarbonValue(monthTotal), icon: '🗓️' },
  ];

  return (
    <div className="space-y-4">
      {/* Impact badge */}
      <div
        className={`p-4 rounded-xl border ${IMPACT_BG[impact]}`}
        aria-label={`Your daily impact level is ${impact}`}
      >
        <p className="text-sm text-gray-400">Today's Impact Level</p>
        <p className={`text-2xl font-bold capitalize ${IMPACT_COLORS[impact]}`}>
          {impact.replace('-', ' ')}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-900 rounded-xl p-4 border border-gray-800"
            aria-label={`${stat.label}: ${stat.value}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span>{stat.icon}</span>
              <span className="text-sm text-gray-400">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
