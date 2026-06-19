/**
 * EcoTrack — Carbon Footprint Awareness Platform
 *
 * Main application component that wires together all features:
 * logging, dashboard, charts, recommendations, and history.
 */

import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import type { LogEntry } from './types';
import AuthGate from './components/AuthGate';
import LogEntryForm from './components/LogEntryForm';
import DashboardSummary from './components/DashboardSummary';
import CategoryBreakdownChart from './components/CategoryBreakdownChart';
import TrendChart from './components/TrendChart';
import StreakBadge from './components/StreakBadge';
import ComparisonCard from './components/ComparisonCard';
import RecommendationList from './components/RecommendationList';
import { useAuth } from './hooks/useAuth';
import { useEntries } from './hooks/useEntries';
import { useRecommendations } from './hooks/useRecommendations';
import {
  getCategoryBreakdown,
  calculateStreak,
  calculateDailyTotal,
  compareToNationalAverage,
} from './utils/carbonEngine';
import type { TrendDataPoint } from './types';

// Lazy load HistoryLog — only loads when "History" tab is clicked
const HistoryLog = lazy(() => import('./components/HistoryLog'));

type Tab = 'dashboard' | 'log' | 'recommendations' | 'history';

/** Inner application content, rendered only when authenticated */
function AppContent() {
  const { user, signOut } = useAuth();
  const { entries, addEntry, removeEntry } = useEntries();
  const recommendations = useRecommendations(entries);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const today = new Date().toISOString().split('T')[0];

  // Calculate today's entry count for rate limiting
  const todayEntryCount = useMemo(
    () => entries.filter((e) => e.date === today).length,
    [entries, today]
  );

  // Category breakdown for charts
  const breakdown = useMemo(
    () => getCategoryBreakdown(entries),
    [entries]
  );

  // Calculate streak
  const streak = useMemo(
    () => calculateStreak(entries.map((e) => e.date).filter(Boolean) as string[]),
    [entries]
  );

  // Trend data: group by date and calculate daily totals
  const trendData: TrendDataPoint[] = useMemo(() => {
    const dateMap = new Map<string, LogEntry[]>();
    for (const entry of entries) {
      if (entry.date) {
        const existing = dateMap.get(entry.date) || [];
        existing.push(entry);
        dateMap.set(entry.date, existing);
      }
    }

    return Array.from(dateMap.entries())
      .map(([date, dateEntries]) => ({
        date,
        total: Number(calculateDailyTotal(dateEntries).toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 days
  }, [entries]);

  // Comparison to national average
  const comparison = useMemo(() => {
    const todayEntries = entries.filter((e) => e.date === today);
    const todayTotal = calculateDailyTotal(todayEntries);
    return compareToNationalAverage(todayTotal, 'Global');
  }, [entries, today]);

  const handleAddEntry = useCallback(
    async (entry: Omit<LogEntry, 'id' | 'userId' | 'createdAt'>): Promise<void> => {
      await addEntry(entry);
    },
    [addEntry]
  );

  const handleDeleteEntry = useCallback(
    async (entryId: string): Promise<void> => {
      await removeEntry(entryId);
    },
    [removeEntry]
  );

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'log', label: 'Log Entry', icon: '📝' },
    { id: 'recommendations', label: 'Tips', icon: '💡' },
    { id: 'history', label: 'History', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Skip to main content — Accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌍</span>
            <h1 className="text-xl font-bold text-white">EcoTrack</h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-sm text-gray-400 hidden sm:inline">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={() => void signOut()}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                  aria-label="Sign out"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <nav
        className="bg-gray-900/50 border-b border-gray-800"
        aria-label="Main navigation"
      >
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
              aria-label={`Navigate to ${tab.label}`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main id="main-content" className="max-w-5xl mx-auto px-4 py-6">
        {/* Dashboard tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <DashboardSummary entries={entries} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CategoryBreakdownChart data={breakdown} />
              <div className="space-y-4">
                <StreakBadge streak={streak} />
                <ComparisonCard comparison={comparison} />
              </div>
            </div>
            <TrendChart data={trendData} />
          </div>
        )}

        {/* Log Entry tab */}
        {activeTab === 'log' && (
          <div className="max-w-lg mx-auto">
            <LogEntryForm
              onSubmit={handleAddEntry}
              todayEntryCount={todayEntryCount}
            />
          </div>
        )}

        {/* Recommendations tab */}
        {activeTab === 'recommendations' && (
          <RecommendationList recommendations={recommendations} />
        )}

        {/* History tab — lazy loaded */}
        {activeTab === 'history' && (
          <Suspense
            fallback={
              <div className="text-center py-10 text-gray-500">
                Loading history...
              </div>
            }
          >
            <HistoryLog entries={entries} onDelete={handleDeleteEntry} />
          </Suspense>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>
            EcoTrack — Track, understand, and reduce your carbon footprint.
          </p>
          <p className="mt-1">
            Built for the Google PromptWars Hackathon • Emission factors sourced from
            DEFRA, EPA, and peer-reviewed research.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <AppContent />
    </AuthGate>
  );
}
