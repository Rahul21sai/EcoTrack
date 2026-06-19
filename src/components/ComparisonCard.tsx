import type { ComparisonResult } from '../types';

interface ComparisonCardProps {
  comparison: ComparisonResult;
}

const STATUS_CONFIG: Record<string, { color: string; icon: string; message: string }> = {
  below: {
    color: 'text-emerald-400',
    icon: '✅',
    message: 'Below average — great job!',
  },
  average: {
    color: 'text-yellow-400',
    icon: '➡️',
    message: 'Around the national average',
  },
  above: {
    color: 'text-red-400',
    icon: '⚠️',
    message: 'Above average — room to improve',
  },
};

/**
 * Card component comparing the user's daily carbon output
 * against a national average. Color-codes the result as
 * below, average, or above, and shows the percentage difference.
 */
export default function ComparisonCard({ comparison }: ComparisonCardProps) {
  const config = STATUS_CONFIG[comparison.status];

  return (
    <div
      className="bg-gray-900 rounded-xl p-4 border border-gray-800"
      aria-label={`Comparison to ${comparison.country} average: ${comparison.status}`}
    >
      <h3 className="text-sm font-medium text-gray-400 mb-2">vs {comparison.country} Average</h3>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{config.icon}</span>
        <span className={`text-lg font-bold ${config.color}`}>{config.message}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-500">
        <span>You: {comparison.userDaily.toFixed(1)} kg</span>
        <span>Avg: {comparison.nationalAverage.toFixed(1)} kg</span>
      </div>
      <div className="mt-2 text-xs text-gray-600">
        {comparison.percentageDifference > 0 ? '+' : ''}
        {comparison.percentageDifference.toFixed(1)}% vs national average
      </div>
    </div>
  );
}
