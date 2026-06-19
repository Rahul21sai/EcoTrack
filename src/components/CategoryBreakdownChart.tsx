import { memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { CategoryBreakdown } from '../types';
import { CATEGORIES } from '../utils/constants';
import { formatCarbonValue } from '../utils/carbonEngine';

interface CategoryBreakdownChartProps {
  data: CategoryBreakdown;
}

function CategoryBreakdownChartInner({ data }: CategoryBreakdownChartProps) {
  const chartData = CATEGORIES.map((cat) => ({
    name: cat.label,
    value: Number(data[cat.id].toFixed(2)),
    color: cat.color,
    icon: cat.icon,
  })).filter((item) => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
        <p className="text-gray-500">No data to display yet. Log some entries to see your breakdown!</p>
      </div>
    );
  }

  const ariaDescription = chartData
    .map((d) => `${d.name}: ${formatCarbonValue(d.value)}`)
    .join(', ');

  return (
    <div
      className="bg-gray-900 rounded-xl p-6 border border-gray-800"
      aria-label={`Pie chart showing carbon emissions by category: ${ariaDescription}`}
    >
      <h3 className="text-lg font-semibold text-white mb-4">Category Breakdown</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(val: unknown) => [formatCarbonValue(Number(val as number) || 0), 'Emissions']}
          />
          <Legend
            formatter={(value: string) => <span style={{ color: '#d1d5db' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

const CategoryBreakdownChart = memo(CategoryBreakdownChartInner);
export default CategoryBreakdownChart;
