import { memo } from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { CategoryBreakdown } from '../types';
import { CATEGORIES } from '../utils/constants';
import { formatCarbonValue } from '../utils/carbonEngine';

interface CategoryBreakdownChartProps {
  data: CategoryBreakdown;
  onNavigateToLog?: () => void;
}

function CategoryBreakdownChartInner({ data, onNavigateToLog }: CategoryBreakdownChartProps) {
  const chartData = CATEGORIES.map((cat) => ({
    name: cat.label,
    value: Number(data[cat.id].toFixed(2)),
    color: cat.color,
    icon: cat.icon,
  })).filter((item) => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="bg-[#131A16] rounded-xl p-8 border border-[rgba(255,255,255,0.08)] border-top-[1px] border-top-[rgba(255,255,255,0.06)] min-h-[340px] flex flex-col items-center justify-center text-center">
        <PieChartIcon className="w-8 h-8 text-[#5C6962] mb-4" />
        <h4 className="text-sm font-bold font-display text-[#F2F5F3] mb-1">No entries yet</h4>
        <p className="text-xs text-[#8FA098] max-w-[240px] mb-4 leading-relaxed">
          Log your first action to see your breakdown.
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

  const ariaDescription = chartData
    .map((item) => `${item.name}: ${formatCarbonValue(item.value)}`)
    .join(', ');

  return (
    <div
      className="bg-[#131A16] rounded-xl p-5 border border-[rgba(255,255,255,0.08)] border-top-[1px] border-top-[rgba(255,255,255,0.06)] hover:bg-[#1A2420] hover:border-[rgba(255,255,255,0.14)] transition-all duration-150 ease-in-out flex flex-col justify-between h-full"
      aria-label={`Pie chart showing carbon emissions by category: ${ariaDescription}`}
    >
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA098] mb-4">Emissions by Category</h3>
      <div className="flex-1 min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={chartData.length > 1 ? 3 : 0}
              dataKey="value"
              stroke="none"
              label={({ cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent = 0, name = '' }) => {
                const RADIAN = Math.PI / 180;
                const radius = outerRadius + 14;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                const textAnchor = x > cx ? 'start' : 'end';
                
                if (percent < 0.01) return null;
                
                return (
                  <text
                    x={x}
                    y={y}
                    fill="#8FA098"
                    textAnchor={textAnchor}
                    dominantBaseline="central"
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      fontFamily: '"Space Grotesk", sans-serif'
                    }}
                  >
                    {`${name} (${(percent * 100).toFixed(0)}%)`}
                  </text>
                );
              }}
              labelLine={{ stroke: 'rgba(255, 255, 255, 0.12)', strokeWidth: 1 }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <text
              x="50%"
              y="46%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#F2F5F3"
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                fontFamily: '"Space Grotesk", sans-serif'
              }}
            >
              {formatCarbonValue(total)}
            </text>
            <text
              x="50%"
              y="56%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#8FA098"
              style={{
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: '"Inter", sans-serif'
              }}
            >
              Total
            </text>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)',
              }}
              formatter={(val: unknown) => [formatCarbonValue(Number(val as number) || 0), 'Emissions']}
            />
            <Legend
              formatter={(value: string) => <span style={{ color: '#8FA098', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' }}>{value}</span>}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const CategoryBreakdownChart = memo(CategoryBreakdownChartInner);
export default CategoryBreakdownChart;
