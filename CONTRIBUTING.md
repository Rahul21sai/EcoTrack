# Contributing to EcoTrack

Thank you for your interest in contributing to EcoTrack. This document defines the code standards, architecture conventions, and workflow guidelines that all contributors must follow.

---

## Project Structure

```
src/
├── __tests__/          # Vitest unit tests (carbonEngine + components)
├── components/         # React UI components (presentation layer only)
├── hooks/              # Custom React hooks (state management)
├── services/           # Data persistence layer (Firebase / localStorage)
├── types/              # TypeScript type definitions (shared across layers)
└── utils/
    ├── carbonEngine.ts  # Pure calculation functions (zero React/Firebase imports)
    ├── cache.ts         # LocalStorage cache with TTL
    ├── constants.ts     # Emission factors, thresholds, category metadata
    ├── errors.ts        # Typed error class hierarchy
    └── insights.ts      # Pure insight generation functions
```

---

## Naming Conventions

| Construct | Convention | Example |
|---|---|---|
| React Components | `PascalCase` | `CategoryBreakdownChart` |
| Hooks | `camelCase`, prefixed with `use` | `useEntries` |
| Service functions | `camelCase` verbs | `saveEntry`, `getEntries` |
| Pure utility functions | `camelCase` verbs | `calculateTransportEmission` |
| Constants | `UPPER_SNAKE_CASE` | `TRANSPORT_EMISSION_FACTORS` |
| TypeScript interfaces | `PascalCase` | `LogEntry`, `UserProfile` |
| TypeScript types | `PascalCase` | `EmissionCategory`, `ImpactLevel` |
| Files | `camelCase` (utils/hooks/services), `PascalCase` (components) | — |

---

## Code Style Rules

### TypeScript
- **Always use `strict: true`** — the project has `noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals`, and `noUnusedParameters` enabled
- **Explicit return types on all functions** — do not rely on inference; explicit types are a documentation signal
- **Use `import type { ... }` for type-only imports** — the project uses `verbatimModuleSyntax`
- **No `any` types** — use `unknown` + type guards, generics, or proper interfaces
- **No `@ts-ignore`** — fix the root cause of every TypeScript error

### Error Handling
- Always throw from `src/utils/errors.ts` typed error classes:
  - `CarbonCalculationError` — for invalid inputs to calculation functions
  - `ValidationError` — for user input validation failures
  - `FirestoreServiceError` — for persistence layer failures
- Service functions must `catch` raw Firebase errors and re-throw as `FirestoreServiceError`
- **Never let raw Firebase errors reach the UI layer**

### JSDoc
Every exported function in `src/utils/`, `src/services/`, and `src/hooks/` **must** have a JSDoc block with:
```typescript
/**
 * One sentence describing WHY this function exists (not just what it does).
 *
 * @param paramName - Type and purpose of the parameter
 * @returns Description of the return value
 * @throws {ErrorClassName} When and why this function throws
 *
 * @example
 * functionName(arg1, arg2) // → expected output
 */
```

### Component Conventions
- Props must use an explicit named `interface` (not inline type literals)
- Add a JSDoc comment above the interface describing each prop
- Props must be destructured in the function signature, not accessed via `props.x`
- Components that can throw must have an error boundary above them in the tree

### Separation of Concerns — CRITICAL
- **`carbonEngine.ts` must have zero imports from React, Firebase, or any UI library** — it is a pure calculation module
- **No component may import directly from Firebase SDK** — all persistence goes through `src/services/`
- **No component may contain inline calculation logic** that duplicates `carbonEngine.ts` — import the shared function instead

---

## Testing

All tests live in `src/__tests__/`. Run them with:
```bash
npm run test        # single run
npm run test:watch  # watch mode
```

### Test Requirements
- Every new pure function in `src/utils/` must have corresponding unit tests
- Test normal cases, edge cases (zero, empty arrays), and error-throwing cases
- Tests for functions that throw must use `expect(...).toThrow(SpecificErrorClass)`
- **Never comment out a failing test** — fix the root cause

### Coverage Expectations
- `carbonEngine.ts` and `insights.ts`: 100% function coverage
- `services/`: auth and persistence flows tested via mocking
- `components/`: behavior tests (form submission, state changes, accessibility)

---

## Commit Message Format

```
type(scope): short description

Optional longer body.
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

Examples:
- `feat(insights): add generateWeeklyInsight pure function`
- `fix(carbonEngine): replace raw Error with CarbonCalculationError`
- `docs: add CONTRIBUTING.md with code style standards`
- `test(insights): add 8 unit tests for generateRelatableComparison`

---

## Pre-Commit Checklist

Before opening a PR or pushing to `main`:
- [ ] `npm run test` — all tests passing, zero regressions
- [ ] `npm run build` — zero TypeScript errors, zero ESLint warnings
- [ ] `grep -r "any" src/` — returns zero untyped usages
- [ ] `grep -r "@ts-ignore" src/` — returns zero results
- [ ] Every new exported function has a complete JSDoc block
- [ ] No inline `throw new Error(...)` — use typed error classes
