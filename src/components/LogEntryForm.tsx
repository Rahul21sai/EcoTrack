import { useState, useCallback, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { PlusCircle } from 'lucide-react';
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
  MAX_INPUT_VALUE,
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
  const [date, setDate] = useState<string>(
    // Non-null assertion safe: ISO strings always contain 'T'
    new Date().toISOString().split('T')[0]!
  );
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
      } else if (sanitized >= MAX_INPUT_VALUE) {
        setValueWarning(`Value is unusually high. Maximum allowed is ${MAX_INPUT_VALUE.toLocaleString()}`);
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
        // Non-null assertion safe: ISO strings always contain 'T'
        setDate(new Date().toISOString().split('T')[0]!);
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
      className="bg-[#131A16] rounded-xl p-5 border border-[rgba(255,255,255,0.08)] border-top-[1px] border-top-[rgba(255,255,255,0.06)]"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8FA098] mb-4 flex items-center gap-2 font-display">
        <PlusCircle className="w-4 h-4 text-[#3DDC97]" /> Log Entry
      </h2>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div
          className="bg-[#E8634B]/10 border border-[#E8634B]/20 text-[#E8634B] p-3 rounded-lg mb-4 text-xs"
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
        <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-[#8FA098] mb-1.5">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full bg-[#0B0F0D] border border-[rgba(255,255,255,0.08)] text-[#F2F5F3] rounded-lg px-4 py-2.5 focus:border-[#3DDC97] focus:ring-1 focus:ring-[#3DDC97] outline-none transition-all text-sm"
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
          <label htmlFor="mode" className="block text-xs font-semibold uppercase tracking-wider text-[#8FA098] mb-1.5">
            Type
          </label>
          <select
            id="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as EntryMode)}
            className="w-full bg-[#0B0F0D] border border-[rgba(255,255,255,0.08)] text-[#F2F5F3] rounded-lg px-4 py-2.5 focus:border-[#3DDC97] focus:ring-1 focus:ring-[#3DDC97] outline-none transition-all text-sm"
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
        <label htmlFor="value" className="block text-xs font-semibold uppercase tracking-wider text-[#8FA098] mb-1.5">
          Value {category ? `(${UNITS[category] || ''})` : ''}
        </label>
        <input
          id="value"
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={category ? `Enter ${UNITS[category] || 'amount'}...` : 'Enter amount...'}
          className={`w-full bg-[#0B0F0D] border text-[#F2F5F3] rounded-lg px-4 py-2.5 focus:ring-1 outline-none transition-all text-sm ${
            valueWarning 
              ? 'border-[#E8634B] focus:border-[#E8634B] focus:ring-[#E8634B]' 
              : 'border-[rgba(255,255,255,0.08)] focus:border-[#3DDC97] focus:ring-[#3DDC97]'
          }`}
          aria-label="Enter value"
          required
        />
        {valueWarning && (
          <p className="text-[#E8634B] text-xs mt-1" role="alert" aria-live="polite">
            {valueWarning}
          </p>
        )}
      </div>

      {/* Date input */}
      <div className="mb-6">
        <label htmlFor="date" className="block text-xs font-semibold uppercase tracking-wider text-[#8FA098] mb-1.5">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          // Non-null assertion safe: ISO strings always contain 'T'
          max={new Date().toISOString().split('T')[0]!}
          className="w-full bg-[#0B0F0D] border border-[rgba(255,255,255,0.08)] text-[#F2F5F3] rounded-lg px-4 py-2.5 focus:border-[#3DDC97] focus:ring-1 focus:ring-[#3DDC97] outline-none transition-all text-sm"
          aria-label="Select date"
          required
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#3DDC97] hover:bg-[#2cb27a] disabled:bg-[#1A2420] disabled:text-[#5C6962] disabled:cursor-not-allowed text-[#0B0F0D] font-bold py-2.5 px-4 rounded-lg transition-colors font-display text-sm"
        aria-label="Log entry"
      >
        {isSubmitting ? 'Saving...' : 'Log Entry'}
      </button>
    </form>
  );
}
