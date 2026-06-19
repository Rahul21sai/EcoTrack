import { memo } from 'react';
import {
  AreaChart,
  Area,
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
import { useEntries } from '../hooks/useEntries';
import { CATEGORIES } from '../utils/constants';

interface TrendChartProps {
  data: TrendDataPoint[];
  onNavigateToLog?: () => void;
}

function TrendChartInner({ data, onNavigateToLog }: TrendChartProps) {
  const { entries } = useEntries();
  const isSparse = data.length < 3;

  const getSinglePointColor = () => {
    if (entries.length === 0) return '#3DDC97';
    const singleDate = data[0]?.date;
    const dayEntries = entries.filter((e) => e.date === singleDate);
    if (dayEntries.length === 0) return '#3DDC97';
    const primaryCatId = dayEntries[0]?.category;
    const catMeta = CATEGORIES.find((c) => c.id === primaryCatId);
    return catMeta ? catMeta.color : '#3DDC97';
  };

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
      <div className="relative">
        {isSparse && (
          <div className="absolute inset-0 flex items-center justify-center bg-transparent pointer-events-none z-10">
            <div className="text-center bg-[#131A16]/90 px-4 py-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] shadow-2xl">
              <p className="text-xs font-semibold text-[#8FA098] tracking-wide">
                Log a few more days to see your trend
              </p>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3DDC97" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#3DDC97" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isSparse ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.06)"}
            />
            <XAxis
              dataKey="date"
              stroke="#5C6962"
              tick={{ fill: '#8FA098', fontSize: 11, fontFamily: 'Space Grotesk' }}
              tickLine={!isSparse}
              axisLine={{ stroke: isSparse ? 'rgba(92, 105, 98, 0.2)' : '#5C6962' }}
              opacity={isSparse ? 0.3 : 1}
            />
            <YAxis
              stroke="#5C6962"
              tick={{ fill: '#8FA098', fontSize: 11, fontFamily: 'Space Grotesk' }}
              tickFormatter={(val: number) => `${val}kg`}
              tickLine={!isSparse}
              axisLine={{ stroke: isSparse ? 'rgba(92, 105, 98, 0.2)' : '#5C6962' }}
              opacity={isSparse ? 0.3 : 1}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)',
              }}
              formatter={(val: unknown) => [formatCarbonValue(Number(val as number) || 0), 'CO2e']}
            />
            {data.length >= 2 && (
              <Area
                type="monotone"
                dataKey="total"
                stroke="none"
                fill="url(#trendGradient)"
                activeDot={false}
              />
            )}
            <Line
              type="monotone"
              dataKey="total"
              stroke="#3DDC97"
              strokeWidth={2}
              opacity={isSparse ? 0.4 : 1}
              dot={
                data.length === 1
                  ? {
                      r: 6,
                      stroke: '#F2F5F3',
                      strokeWidth: 2,
                      fill: getSinglePointColor(),
                    }
                  : {
                      fill: '#3DDC97',
                      strokeWidth: 2,
                      r: 4
                    }
              }
              activeDot={
                data.length === 1
                  ? {
                      r: 8,
                      stroke: '#F2F5F3',
                      strokeWidth: 2,
                      fill: getSinglePointColor(),
                    }
                  : {
                      r: 6,
                      fill: '#3DDC97'
                    }
              }
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const TrendChart = memo(TrendChartInner);
export default TrendChart;
