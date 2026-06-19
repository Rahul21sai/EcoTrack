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
import { Leaf, BarChart3, PlusCircle, Lightbulb, History } from 'lucide-react';
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

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', Icon: BarChart3 },
    { id: 'log' as Tab, label: 'Log Entry', Icon: PlusCircle },
    { id: 'recommendations' as Tab, label: 'Tips', Icon: Lightbulb },
    { id: 'history' as Tab, label: 'History', Icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F0D]">
      {/* Skip to main content — Accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-[#0B0F0D] border-b border-[rgba(255,255,255,0.08)] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Leaf className="w-5 h-5 text-[#3DDC97]" />
            <h1 className="text-lg font-bold font-display text-[#F2F5F3] tracking-tight">EcoTrack</h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-xs text-[#8FA098] hidden sm:inline">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={() => void signOut()}
                  className="text-xs font-semibold text-[#8FA098] hover:text-[#F2F5F3] transition-colors"
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
        className="bg-[#0B0F0D] border-b border-[rgba(255,255,255,0.08)]"
        aria-label="Main navigation"
      >
        <div className="max-w-5xl mx-auto px-4 flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap border-b-2 -mb-[2px] ${
                  isActive
                    ? 'text-[#3DDC97] border-[#3DDC97]'
                    : 'text-[#8FA098] border-transparent hover:text-[#F2F5F3] hover:border-[rgba(255,255,255,0.14)]'
                }`}
                aria-label={`Navigate to ${tab.label}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <tab.Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <main id="main-content" className="max-w-5xl mx-auto px-4 py-8">
        {/* Dashboard tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <DashboardSummary entries={entries} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CategoryBreakdownChart data={breakdown} onNavigateToLog={() => setActiveTab('log')} />
              <div className="space-y-6">
                <StreakBadge streak={streak} onNavigateToLog={() => setActiveTab('log')} />
                <ComparisonCard comparison={comparison} />
              </div>
            </div>
            <TrendChart data={trendData} onNavigateToLog={() => setActiveTab('log')} />
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
      <footer className="bg-[#131A16] border-t border-[rgba(255,255,255,0.08)] mt-16">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center text-[#5C6962] text-[11px] uppercase tracking-wider">
          <p>
            EcoTrack — Track, understand, and reduce your carbon footprint.
          </p>
          <p className="mt-2 normal-case tracking-normal text-[#5C6962]/80">
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
