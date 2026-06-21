/**
 * EcoTrack Category Icon Utility
 *
 * Single source of truth for mapping emission categories to their
 * visual icon representation. Shared across all components that
 * display category icons (HistoryLog, RecommendationCard, etc.).
 *
 * @module categoryIcons
 */

import type { ReactElement } from 'react';
import { Car, Zap, Utensils, Trash2, Lightbulb } from 'lucide-react';

/**
 * Returns the themed icon element for a given emission category.
 *
 * Each icon uses a category-specific color that matches the chart palette
 * defined in {@link constants.ts CATEGORIES}.
 *
 * @param category - The emission category identifier (e.g. 'transport', 'energy')
 * @returns A colored Lucide icon element, or a default lightbulb for unknown categories
 *
 * @example
 * getCategoryIcon('transport') // → <Car className="w-4 h-4 text-[#3D8BFF]" />
 * getCategoryIcon('unknown')   // → <Lightbulb className="w-4 h-4 text-[#3DDC97]" />
 */
export function getCategoryIcon(category: string): ReactElement {
  switch (category) {
    case 'transport':
      return <Car className="w-4 h-4 text-[#3D8BFF]" />;
    case 'energy':
      return <Zap className="w-4 h-4 text-[#E8B84B]" />;
    case 'food':
      return <Utensils className="w-4 h-4 text-[#3DDC97]" />;
    case 'waste':
      return <Trash2 className="w-4 h-4 text-[#8FA098]" />;
    default:
      return <Lightbulb className="w-4 h-4 text-[#3DDC97]" />;
  }
}
