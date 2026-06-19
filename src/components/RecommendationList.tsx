import type { Recommendation } from '../types';
import RecommendationCard from './RecommendationCard';

interface RecommendationListProps {
  recommendations: Recommendation[];
}

export default function RecommendationList({ recommendations }: RecommendationListProps) {
  if (recommendations.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
        <p className="text-gray-500">
          💡 Keep logging your activities to get personalized recommendations!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <span>💡</span> Personalized Recommendations
      </h3>
      <p className="text-sm text-gray-500 mb-2">
        Sorted by highest impact — follow these to reduce your footprint the most.
      </p>
      {recommendations.map((rec, index) => (
        <RecommendationCard key={`${rec.category}-${index}`} recommendation={rec} />
      ))}
    </div>
  );
}
