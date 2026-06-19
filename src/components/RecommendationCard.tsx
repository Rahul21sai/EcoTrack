import type { Recommendation } from '../types';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-emerald-900/30 text-emerald-400 border-emerald-700',
  moderate: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
  challenging: 'bg-red-900/30 text-red-400 border-red-700',
};

const CATEGORY_ICONS: Record<string, string> = {
  transport: '🚗',
  energy: '⚡',
  food: '🍽️',
  waste: '🗑️',
};

export default function RecommendationCard({ recommendation }: RecommendationCardProps) {
  return (
    <div
      className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-all duration-200"
      aria-label={`Recommendation: ${recommendation.title}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{CATEGORY_ICONS[recommendation.category] || '💡'}</span>
          <h4 className="text-white font-semibold">{recommendation.title}</h4>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full border capitalize ${DIFFICULTY_COLORS[recommendation.difficulty]}`}
        >
          {recommendation.difficulty}
        </span>
      </div>
      <p className="text-gray-400 text-sm mb-3 leading-relaxed">
        {recommendation.description}
      </p>
      <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
        <span>🌱</span>
        <span>Save ~{recommendation.estimatedSavingsKg.toFixed(1)} kg CO2e</span>
      </div>
    </div>
  );
}
