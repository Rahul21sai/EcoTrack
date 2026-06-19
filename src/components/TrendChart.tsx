import { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp as TrendingIcon } from 'lucide-react';
import type { TrendDataPoint } from '../types';
import { formatCarbonValue } from '../utils/carbonEngine';

interface TrendChartProps {
  data: TrendDataPoint[];
  onNavigateToLog?: () => void;
}

function TrendChartInner({ data, onNavigateToLog }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-[#131A16] rounded-xl p-8 border border-[rgba(255,255,255,0.08)] border-top-[1px] border-top-[rgba(255,255,255,0.06)] min-h-[340px] flex flex-col items-center justify-center text-center">
        <TrendingIcon className="w-8 h-8 text-[#5C6962] mb-4" />
        <h4 className="text-sm font-bold font-display text-[#F2F5F3] mb-1">No trend data yet</h4>
        <p className="text-xs text-[#8FA098] max-w-[240px] mb-4 leading-relaxed">
          Log your first action to see your progress over time.
        </p>
        {onNavigateToLog && (
          <button
            onClick={onNavigateToLog}
            className="text-xs font-semibold text-[#3DDC97] hover:underline flex items-center gap-1 transition-all"
          >
            Log entry <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    );
  }

  const ariaDescription = data
    .map((d) => `${d.date}: ${formatCarbonValue(d.total)}`)
    .join(', ');

  return (
    <div
      className="bg-[#131A16] rounded-xl p-5 border border-[rgba(255,255,255,0.08)] border-top-[1px] border-top-[rgba(255,255,255,0.06)] hover:bg-[#1A2420] hover:border-[rgba(255,255,255,0.14)] transition-all duration-150 ease-in-out"
      aria-label={`Line chart showing emission trends: ${ariaDescription}`}
    >
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA098] mb-4">Emission Trends</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis
            dataKey="date"
            stroke="#5C6962"
            tick={{ fill: '#8FA098', fontSize: 11, fontFamily: 'Space Grotesk' }}
          />
          <YAxis
            stroke="#5C6962"
            tick={{ fill: '#8FA098', fontSize: 11, fontFamily: 'Space Grotesk' }}
            tickFormatter={(val: number) => `${val}kg`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#131A16',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: '#F2F5F3',
            }}
            formatter={(val: unknown) => [formatCarbonValue(Number(val as number) || 0), 'CO2e']}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#3DDC97"
            strokeWidth={2}
            dot={{ fill: '#3DDC97', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#3DDC97' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const TrendChart = memo(TrendChartInner);
export default TrendChart;
