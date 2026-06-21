/**
 * RecommendationCard Component
 *
 * Displays a single personalized carbon reduction recommendation.
 * Each card shows the category icon, action title, description,
 * difficulty badge, estimated CO2e savings, and a "Mark as tried" button
 * that lets users track which recommendations they have acted on.
 *
 * The "Mark as tried" state is persisted to localStorage so it survives
 * page reloads, and tried recommendations are visually deprioritized
 * to keep the list fresh and actionable.
 */
import { useState, useCallback } from 'react';
import type { ReactElement } from 'react';
import type { Recommendation, DifficultyLevel } from '../types';
import { Leaf, CheckCircle2 } from 'lucide-react';
import { getCategoryIcon } from '../utils/categoryIcons';

/** Props for the RecommendationCard component */
interface RecommendationCardProps {
  /** The recommendation data to render */
  recommendation: Recommendation;
}

/** Difficulty badge styling configuration keyed by {@link DifficultyLevel} */
const DIFFICULTY_CONFIG: Record<DifficultyLevel, { color: string; bg: string; border: string }> = {
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

/**
 * Generates a stable localStorage key for tracking tried recommendations.
 *
 * @param title - The recommendation title to key on
 * @returns A localStorage-safe key string
 */
function getTriedKey(title: string): string {
  return `ecotrack_tried_${title.toLowerCase().replace(/\s+/g, '_').slice(0, 50)}`;
}

/**
 * Renders a single personalized recommendation card with a "Mark as tried" button.
 */
export default function RecommendationCard({ recommendation }: RecommendationCardProps): ReactElement {
  const triedKey = getTriedKey(recommendation.title);
  const [tried, setTried] = useState<boolean>(
    () => localStorage.getItem(triedKey) === 'true'
  );

  const handleMarkTried = useCallback((): void => {
    const next = !tried;
    setTried(next);
    if (next) {
      localStorage.setItem(triedKey, 'true');
    } else {
      localStorage.removeItem(triedKey);
    }
  }, [tried, triedKey]);

  const difficulty = DIFFICULTY_CONFIG[recommendation.difficulty];

  return (
    <div
      className={`rounded-xl p-5 border transition-all duration-150 ease-in-out ${
        tried
          ? 'bg-[#0F1F18] border-[#3DDC97]/20 opacity-70'
          : 'bg-[#131A16] border-[rgba(255,255,255,0.08)] hover:bg-[#1A2420] hover:border-[rgba(255,255,255,0.14)]'
      }`}
      aria-label={`Recommendation: ${recommendation.title}${tried ? ' (marked as tried)' : ''}`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] flex-shrink-0">
            {getCategoryIcon(recommendation.category)}
          </div>
          <h4 className={`text-sm font-bold font-display leading-tight ${tried ? 'text-[#8FA098] line-through' : 'text-[#F2F5F3]'}`}>
            {recommendation.title}
          </h4>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider whitespace-nowrap ${difficulty.bg} ${difficulty.color} ${difficulty.border}`}
          aria-label={`Difficulty: ${recommendation.difficulty}`}
        >
          {recommendation.difficulty}
        </span>
      </div>

      <p className="text-[#8FA098] text-xs mb-3 leading-relaxed">
        {recommendation.description}
      </p>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[rgba(255,255,255,0.06)]">
        {/* Savings estimate */}
        <div className="flex items-center gap-2 text-[#3DDC97] text-xs font-semibold">
          <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="tabular-nums">
            Save ~{recommendation.estimatedSavingsKg.toFixed(1)} kg CO2e
          </span>
        </div>

        {/* Mark as tried button */}
        <button
          onClick={handleMarkTried}
          aria-pressed={tried}
          aria-label={tried ? `Unmark "${recommendation.title}" as tried` : `Mark "${recommendation.title}" as tried`}
          className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
            tried
              ? 'text-[#3DDC97] border-[#3DDC97]/30 bg-[#3DDC97]/10'
              : 'text-[#8FA098] border-[rgba(255,255,255,0.08)] hover:text-[#3DDC97] hover:border-[#3DDC97]/30 hover:bg-[#3DDC97]/5'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
          <span>{tried ? 'Tried ✓' : 'Mark tried'}</span>
        </button>
      </div>
    </div>
  );
}
