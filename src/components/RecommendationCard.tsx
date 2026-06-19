import type { Recommendation } from '../types';
import { Car, Zap, Utensils, Trash2, Leaf, Lightbulb } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

const DIFFICULTY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  easy: {
    color: 'text-[#3DDC97]',
    bg: 'bg-[#3DDC97]/10',
    border: 'border-[#3DDC97]/20',
  },
  moderate: {
    color: 'text-[#E8B84B]',
    bg: 'bg-[#E8B84B]/10',
    border: 'border-[#E8B84B]/20',
  },
  challenging: {
    color: 'text-[#E8634B]',
    bg: 'bg-[#E8634B]/10',
    border: 'border-[#E8634B]/20',
  },
};

export default function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transport':
        return <Car className="w-4 h-4 text-[#3B82F6]" />;
      case 'energy':
        return <Zap className="w-4 h-4 text-[#F59E0B]" />;
      case 'food':
        return <Utensils className="w-4 h-4 text-[#10B981]" />;
      case 'waste':
        return <Trash2 className="w-4 h-4 text-[#EF4444]" />;
      default:
        return <Lightbulb className="w-4 h-4 text-[#3DDC97]" />;
    }
  };

  const difficulty = DIFFICULTY_CONFIG[recommendation.difficulty] || DIFFICULTY_CONFIG.easy;

  return (
    <div
      className="bg-[#131A16] rounded-xl p-5 border border-[rgba(255,255,255,0.08)] border-top-[1px] border-top-[rgba(255,255,255,0.06)] hover:bg-[#1A2420] hover:border-[rgba(255,255,255,0.14)] transition-all duration-150 ease-in-out"
      aria-label={`Recommendation: ${recommendation.title}`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex-shrink-0">
            {getCategoryIcon(recommendation.category)}
          </div>
          <h4 className="text-[#F2F5F3] text-sm font-bold font-display leading-tight">{recommendation.title}</h4>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${difficulty.bg} ${difficulty.color} ${difficulty.border}`}
        >
          {recommendation.difficulty}
        </span>
      </div>
      <p className="text-[#8FA098] text-xs mb-4 leading-relaxed">
        {recommendation.description}
      </p>
      <div className="flex items-center gap-2 text-[#3DDC97] text-xs font-semibold">
        <Leaf className="w-3.5 h-3.5" />
        <span className="tabular-nums">Save ~{recommendation.estimatedSavingsKg.toFixed(1)} kg CO2e</span>
      </div>
    </div>
  );
}
