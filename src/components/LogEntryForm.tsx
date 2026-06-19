import { useState, useCallback, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { LogEntry, EmissionCategory, EntryMode } from '../types';
import { validateLogEntry, sanitizeNumericInput } from '../utils/carbonEngine';
import { stripHTML } from '../utils/sanitize';
import {
  CATEGORIES,
  TRANSPORT_MODE_LABELS,
  ENERGY_TYPE_LABELS,
  MEAL_TYPE_LABELS,
  WASTE_TYPE_LABELS,
  SUBMIT_COOLDOWN_MS,
  MAX_ENTRIES_PER_DAY,
} from '../utils/constants';

interface LogEntryFormProps {
  onSubmit: (entry: Omit<LogEntry, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  todayEntryCount?: number;
}

const MODE_LABELS: Record<string, Record<string, string>> = {
  transport: TRANSPORT_MODE_LABELS,
  energy: ENERGY_TYPE_LABELS,
  food: MEAL_TYPE_LABELS,
  waste: WASTE_TYPE_LABELS,
};

const UNITS: Record<string, string> = {
  transport: 'km',
  energy: 'kWh',
  food: 'meals',
  waste: 'kg',
};

/**
 * Form component for logging carbon footprint entries.
 * Includes input validation, HTML sanitization, numeric sanitization,
 * a 2-second submit cooldown, and daily entry limit enforcement.
 */
export default function LogEntryForm({ onSubmit, todayEntryCount = 0 }: LogEntryFormProps) {
  const [category, setCategory] = useState<EmissionCategory | ''>('');
  const [mode, setMode] = useState<EntryMode | ''>('');
  const [value, setValue] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<string[]>([]);
  const [valueWarning, setValueWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const cooldownRef = useRef<boolean>(false);

  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up validation timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  const handleValueChange = useCallback((val: string) => {
    setValue(val);

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    if (!val) {
      setValueWarning(null);
      return;
    }

    validationTimeoutRef.current = setTimeout(() => {
      const sanitized = sanitizeNumericInput(stripHTML(val));
      if (sanitized === null) {
        setValueWarning('Invalid value — please enter a valid positive number');
      } else if (sanitized < 0) {
        setValueWarning('Value must be a positive number');
      } else if (sanitized >= 100000) {
        setValueWarning('Value is unusually high. Maximum allowed is 100,000');
      } else {
        setValueWarning(null);
      }
    }, 300);
  }, []);

  const availableModes = category ? MODE_LABELS[category] || {} : {};

  const handleCategoryChange = useCallback((newCategory: string): void => {
    setCategory(newCategory as EmissionCategory);
    setMode('');
    setErrors([]);
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent): Promise<void> => {
      e.preventDefault();

      // Rate limiting: 2-second cooldown
      if (cooldownRef.current) {
        setErrors(['Please wait before submitting again']);
        return;
      }

      // Daily limit check (abuse prevention)
      if (todayEntryCount >= MAX_ENTRIES_PER_DAY) {
        setErrors([`Maximum ${MAX_ENTRIES_PER_DAY} entries per day reached`]);
        return;
      }

      // Sanitize inputs
      const sanitizedValue = sanitizeNumericInput(stripHTML(value));

      if (sanitizedValue === null) {
        setErrors(['Invalid value — please enter a valid positive number']);
        return;
      }

      const entry: LogEntry = {
        category: category as EmissionCategory,
        mode: mode as EntryMode,
        value: sanitizedValue,
        unit: category ? UNITS[category] || '' : '',
        date,
      };

      const validation = validateLogEntry(entry);
      if (!validation.valid) {
        setErrors(validation.errors);
        return;
      }

      setIsSubmitting(true);
      cooldownRef.current = true;

      try {
        await onSubmit(entry);
        // Reset form on success
        setCategory('');
        setMode('');
        setValue('');
        setDate(new Date().toISOString().split('T')[0]);
        setErrors([]);
      } catch (err) {
        setErrors([err instanceof Error ? err.message : 'Failed to save entry']);
      } finally {
        setIsSubmitting(false);
        setTimeout(() => {
          cooldownRef.current = false;
        }, SUBMIT_COOLDOWN_MS);
      }
    },
    [category, mode, value, date, onSubmit, todayEntryCount]
  );

  return (
    <form
      role="form"
      aria-label="Log carbon footprint entry"
      onSubmit={(e) => void handleSubmit(e)}
      className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl"
    >
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>📝</span> Log Entry
      </h2>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div
          className="bg-red-900/30 border border-red-700 text-red-400 p-3 rounded-lg mb-4"
          role="alert"
          aria-live="polite"
        >
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      {/* Category selector */}
      <div className="mb-4">
        <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          aria-label="Select emission category"
          required
        >
          <option value="">Select a category...</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.label} — {cat.description}
            </option>
          ))}
        </select>
      </div>

      {/* Mode selector */}
      {category && (
        <div className="mb-4">
          <label htmlFor="mode" className="block text-sm font-medium text-gray-300 mb-1">
            Type
          </label>
          <select
            id="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as EntryMode)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            aria-label="Select specific type"
            required
          >
            <option value="">Select type...</option>
            {Object.entries(availableModes).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Value input */}
      <div className="mb-4">
        <label htmlFor="value" className="block text-sm font-medium text-gray-300 mb-1">
          Value {category ? `(${UNITS[category] || ''})` : ''}
        </label>
        <input
          id="value"
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={category ? `Enter ${UNITS[category] || 'amount'}...` : 'Enter amount...'}
          className={`w-full bg-gray-800 border text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all ${
            valueWarning ? 'border-red-500 focus:ring-red-500' : 'border-gray-700'
          }`}
          aria-label="Enter value"
          required
        />
        {valueWarning && (
          <p className="text-red-400 text-xs mt-1" role="alert" aria-live="polite">
            {valueWarning}
          </p>
        )}
      </div>

      {/* Date input */}
      <div className="mb-6">
        <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          aria-label="Select date"
          required
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-emerald-500/20"
        aria-label="Log entry"
      >
        {isSubmitting ? 'Saving...' : 'Log Entry'}
      </button>
    </form>
  );
}
