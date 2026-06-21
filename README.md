# EcoTrack — Carbon Footprint Awareness Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-eco--track--wihj.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://eco-track-wihj.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Rahul21sai%2FEcoTrack-181717?style=for-the-badge&logo=github)](https://github.com/Rahul21sai/EcoTrack)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

EcoTrack is a production-ready, highly secure, and highly efficient Carbon Footprint Awareness Platform built for the Google PromptWars hackathon. The platform helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized, rule-based insights.

🌐 **Live App**: [https://eco-track-wihj.vercel.app](https://eco-track-wihj.vercel.app)
📦 **Repository**: [https://github.com/Rahul21sai/EcoTrack](https://github.com/Rahul21sai/EcoTrack)

---

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript (Strict Mode) |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS v4 + Custom CSS Variables |
| **Charts** | Recharts |
| **Authentication** | Firebase Auth (Google Sign-In) |
| **Database** | Firebase Firestore |
| **Testing** | Vitest + React Testing Library (98 tests) |
| **Deployment** | Vercel (CI/CD from GitHub) |
| **Icons** | Lucide React |

---

## 🌍 Problem Statement & Chosen Vertical
* **Problem Statement**: Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.
* **Vertical**: Sustainability & Climate Action.
* **Core Principles**:
  * **Understand**: Explain *why* actions have carbon impacts through relatable comparisons (e.g., "≈ driving 100 km in a petrol car") rather than displaying abstract kg numbers.
  * **Track**: Support daily and weekly logging across Transport, Energy, Food, and Waste categories, with category-filter pills in the History Log.
  * **Reduce**: Provide actionable, personalized, and achievable suggestions based on actual logged user behavior. Recommendations include a **'Mark as tried' button** (persisted to localStorage) to let users track what they've acted on.
  * **Personalized Insights**: A **Weekly Insight Summary** displayed prominently on the Dashboard compares this week's emissions to last week, identifies the biggest change by category, and generates a one-sentence actionable tip.

---

## 💡 Approach & Logic
EcoTrack operates as a closed-loop system of tracking, analysis, and feedback:
1. **User Action Logging**: The user inputs daily activities (e.g., traveling 10 km by petrol car, eating a vegetarian meal) through a highly accessible and sanitized form.
2. **Carbon Calculation**: Activities are processed by a pure-function calculation engine (`carbonEngine.ts`) mapping inputs to validated, cited emission factors.
3. **Categorization & Aggregation**: Daily, weekly, and monthly totals are aggregated and compared against national baseline averages.
3. **Categorization & Aggregation**: Daily, weekly, and monthly totals are aggregated and compared against national baseline averages.
4. **Rule-Based Recommendations**: A deterministic, rule-based recommendation engine analyzes logged behavior and produces ranked, context-specific tips with computed reduction potentials. Users can **Mark as tried** to adaptively deprioritize acted-on recommendations.
5. **Personalized Weekly Insights**: The `generateWeeklyInsight()` pure function compares current vs. prior-week emissions by category, producing a single actionable sentence surfaced in the **Weekly Insight Summary** dashboard card.
6. **Relatable Comparisons**: The `generateRelatableComparison()` function maps abstract kg CO2e values to real-world reference points (phone charges, car trips, flights, tree absorption).
7. **Streak & Savings Tracking**: The platform tracks consecutive logging days and calculated savings to reinforce positive habits.

---

## 🚶 How the Solution Works
1. **Secure Sign-In**: Users sign in securely using Firebase Google Sign-In (no passwords stored = no password leak risk).
2. **Dashboard Overview**: Displays today's impact level, a stats grid (today, week, month), an evolutionary line chart of emission trends, and a streak tracker.
3. **Activity Logging**: Allows quick logs for:
   * **Transport**: Petrol/diesel/electric cars, bus, train, flights (short/long), bicycle, or walking.
   * **Energy**: Grid electricity and natural gas consumption.
   * **Food**: Vegan, vegetarian, light meat, or heavy meat meals.
   * **Waste**: Landfill, recycled, or composted waste.
4. **Personalized Action Plan**: Suggests customized actions (e.g., swapping meat meals, using public transport) ranked by carbon reduction impact.
5. **History Management**: View, filter, edit, or delete past logs with immediate local optimistic UI updates.

---

## 🛠️ Why a Rule-Based Recommendation Engine (Not an LLM)
This project implements a rule-based engine instead of calling an LLM API. This was a deliberate architectural choice made to align with the hackathon's core criteria:
1. **Explainability**: Recommendations are derived from transparent, mathematical logic. The user can see exactly why a tip was generated (e.g., "meat_heavy used > 5x/week").
2. **Zero Network Latency**: Calculations are synchronous and client-side, running instantly without waiting for LLM network requests (Efficiency).
3. **Zero API Cost**: Fully functional on a 100% free tier (no credit card or billing accounts required).
4. **Security & Privacy**: Opaque LLMs require sending user behavioral logs to a third party. EcoTrack keeps 100% of user data isolated inside the user's browser and private Firestore database.
5. **Unit-Testable**: 100% deterministic logic. We can test the recommendations with standard unit tests, which is impossible with non-deterministic LLM responses.

---

## ☁️ Google Services Used
All integrations are restricted to Google's free/no-billing tiers to ensure zero-cost production readiness:

| Service | Purpose | Tier |
|---|---|---|
| **Firebase Auth** | Google Sign-In wrapper (Popup, client-only) | Free Spark Plan |
| **Firebase Firestore** | Secure, authenticated storage of user logs | Free Spark Plan |
| **Google Fonts** | Inter typography, imported via stylesheet | Free |

> [!NOTE]
> No Google Cloud billing-enabled APIs (Maps, Places, Translate, or Gemini Gated APIs) are used. Security is fully enforced via Firestore rules rather than hiding API credentials.

---

## 🛡️ Security Model
EcoTrack adopts a **Defense-in-Depth** security architecture:
1. **Input Sanitization**: All text inputs are parsed through a custom HTML stripper (`stripHTML()`) to prevent XSS. Numeric inputs are validated via `sanitizeNumericInput()` to reject negative, non-numeric, or script injection values.
2. **Auth-Scoped Databases**: Database rules strictly limit read/write access. A user can only access documents under `/users/{userId}/...` where `{userId}` matches their validated Firebase Auth UID.
3. **Firestore Security Rules**: Rules running on Google's servers replicate and enforce validation logic:
   * Rejects values `< 0` or `>= 100,000` (abuse prevention).
   * Restricts category field values to `['transport', 'energy', 'food', 'waste']`.
4. **Rate Limiting**:
   * **Client-side Cooldown**: Disables form submission for 2 seconds after a click to prevent double-submit spam.
   * **Write Caps**: Rejects logging more than 50 entries per user per day client-side to prevent Firestore write exhaustion.

---

## 🧪 Testing
This project uses **Vitest** and **React Testing Library** — the TypeScript/React ecosystem equivalent of JUnit.

### Test Coverage (98 tests, 100% passing):
* **`carbonEngine.test.ts` (64 tests)**: Validates all 17 pure functions including:
  * Calculations (under normal, edge, and throwing/negative value conditions).
  * Streak calculation logic (consecutive dates, gaps, empty arrays).
  * Rule-based engine suggestions and sorting.
* **`components.test.tsx` (17 tests)**: Verifies component behavior:
  * Form inputs, validation warnings, and submission handlers.
  * AuthGate loading, sign-in, and child rendering states.
  * Streak milestones (e.g., 7+ day milestone badge).
  * Recharts visual breakdown fallbacks.
* **`insights.test.ts` (17 tests)**: Validates personalized weekly insights and relatable CO2e comparisons:
  * Insufficient-data, improvement, regression, and steady-state cases.
  * Phone-charge, kettle, burger, driving, flight, and tree-absorption comparisons.

Run the test suite:
```bash
npm run test
```

---

## 🚀 How to Run & Build
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Rahul21sai/EcoTrack.git
   cd EcoTrack
   ```
2. **Configure Environment**:
   Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   *Replace the placeholders with your free Firebase project settings (created at [console.firebase.google.com](https://console.firebase.google.com/)).*

3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Run Locally**:
   ```bash
   npm run dev
   ```
5. **Run Tests**:
   ```bash
   npm run test
   ```
6. **Compile & Build (Production)**:
   ```bash
   npm run build
   ```

---

## 📐 Architecture Decisions
1. **Separation of Concerns**: The domain logic (`carbonEngine.ts`) contains purely functional math with no dependency on React or Firestore. Component UI and database hooks are decoupled.
2. **Offline-First Caching**: The `useEntries` hook queries local storage cache first for immediate render, then queries Firestore in the background, updating the view optimistically.
3. **Verbatim Module Syntax**: Configured TypeScript in strict mode, importing types explicitly (`import type`) to guarantee clean module resolution and fast compilation.

---

## 📌 Assumptions & Limitations
* **Assumptions**:
  * Users have an active internet connection for the initial Google Authentication.
  * Emissions are calculated using EPA/DEFRA global baseline constants; regional adjustments are not present.
* **Limitations**:
  * The application does not contain a server-side backend; security and validation are delegated to Firebase client-side SDKs and Firestore server-side rules.
  * Daily entries are capped at 50 per day client-side to prevent Firestore write exhaustion on the free tier.
