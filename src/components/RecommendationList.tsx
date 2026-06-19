import type { Recommendation } from '../types';
import RecommendationCard from './RecommendationCard';
import { Lightbulb } from 'lucide-react';

interface RecommendationListProps {
  recommendations: Recommendation[];
}

export default function RecommendationList({ recommendations }: RecommendationListProps) {
  if (recommendations.length === 0) {
    return (
      <div className="bg-[#131A16] rounded-xl p-8 border border-[rgba(255,255,255,0.08)] border-top-[1px] border-top-[rgba(255,255,255,0.06)] text-center flex flex-col items-center justify-center min-h-[200px]">
        <Lightbulb className="w-8 h-8 text-[#5C6962] mb-3" />
        <h4 className="text-sm font-bold font-display text-[#F2F5F3] mb-1">No recommendations</h4>
        <p className="text-xs text-[#8FA098] max-w-[240px] leading-relaxed">
          Keep logging your activities to get personalized recommendations!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8FA098] flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-[#E8B84B]" /> Personalized Recommendations
        </h3>
        <p className="text-xs text-[#5C6962]">
          Sorted by highest impact — follow these to reduce your footprint the most.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, index) => (
          <RecommendationCard key={`${rec.category}-${index}`} recommendation={rec} />
        ))}
      </div>
    </div>
  );
}
