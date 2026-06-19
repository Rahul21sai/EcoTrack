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
import type { TrendDataPoint } from '../types';
import { formatCarbonValue } from '../utils/carbonEngine';

interface TrendChartProps {
  data: TrendDataPoint[];
}

function TrendChartInner({ data }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
        <p className="text-gray-500">No trend data yet. Keep logging to see your progress!</p>
      </div>
    );
  }

  const ariaDescription = data
    .map((d) => `${d.date}: ${formatCarbonValue(d.total)}`)
    .join(', ');

  return (
    <div
      className="bg-gray-900 rounded-xl p-6 border border-gray-800"
      aria-label={`Line chart showing emission trends: ${ariaDescription}`}
    >
      <h3 className="text-lg font-semibold text-white mb-4">Emission Trends</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickFormatter={(val: number) => `${val}kg`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(val: unknown) => [formatCarbonValue(Number(val as number) || 0), 'CO2e']}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#34d399' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const TrendChart = memo(TrendChartInner);
export default TrendChart;
