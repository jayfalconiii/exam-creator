# AWS SAA-C03 Study PWA

## Problem Statement

As a developer studying for the AWS Solutions Architect Associate (SAA-C03) exam, I need a focused, offline-capable study tool that simulates the real exam format. My current workflow relies on Claude chat for study, but it lacks multiple-choice question simulation and is difficult to use on slow or no internet connections. I need a way to test my knowledge with realistic exam-style questions, track which topics I'm weak on, and continue studying even when offline.

## Solution

A Progressive Web App (PWA) installable to a phone's home screen that:
- Works fully offline using a local question bank stored in IndexedDB
- Generates new exam-style questions via the Anthropic Claude API when online
- Tracks proficiency per AWS topic using a spaced repetition algorithm that decays scores over time
- Presents multiple-choice questions with radio buttons to simulate the real exam experience
- Lets the user choose between study mode (immediate feedback) and exam mode (review at end)
- Provides a visual heatmap of topic proficiency across all 17 SAA-C03 domains

## User Stories

1. As a student, I want to install the app to my phone's home screen, so that I can access it like a native app without opening a browser.
2. As a student, I want the app to work offline after the first load, so that I can study on the subway or during travel with no internet.
3. As a student, I want the app to ship with a pre-seeded question bank of ~100-200 SAA-C03 questions, so that it is immediately useful before I generate any new questions.
4. As a student, I want to enter my Anthropic API key once in a settings screen, so that the app can generate new questions without me re-entering the key each session.
5. As a student, I want my API key to be stored only on my device in IndexedDB, so that it never leaves my phone.
6. As a student, I want to generate new questions for specific topics when I am online, so that I can expand my question bank beyond the seed data.
7. As a student, I want newly generated questions to be saved permanently to my offline bank, so that they are available in future offline sessions.
8. As a student, I want to see a heatmap of my proficiency across all 17 AWS SAA-C03 service domains, so that I can quickly identify which areas need the most attention.
9. As a student, I want topic proficiency scores to decay over time if I haven't reviewed them, so that the heatmap reflects what I'm currently retaining, not just historical performance.
10. As a student, I want to start a study session filtered to specific topics, so that I can focus on weak areas.
11. As a student, I want to choose a session mode (Review / Difficult / New / Mixed) before starting, so that I can control whether I see familiar, hard, or fresh questions.
12. As a student, I want to choose how many questions per session (5–65), so that I can do a quick 5-minute drill or a full 65-question mock exam.
13. As a student, I want to optionally enable a countdown timer for a session, so that I can practice under time pressure when I'm ready.
14. As a student, I want questions presented as 4-option radio button multiple choice, so that the experience mirrors the real SAA-C03 exam format.
15. As a student, I want to choose "study mode" per session to see immediate feedback after each answer, so that I can learn from mistakes as I go.
16. As a student, I want to choose "exam mode" per session to answer all questions without feedback, so that I can practice under real exam conditions.
17. As a student, I want to see a full answer review at the end of every session (in both modes), so that I can understand all correct answers and explanations.
18. As a student, I want explanations for every answer, so that I understand the AWS reasoning behind each correct option.
19. As a student, I want the "Difficult" session mode to surface questions I've answered wrong 2 or more times, so that the app automatically identifies and drills my weak spots.
20. As a student, I want the "New" session mode to show only questions I've never seen before, so that I always have fresh material to work through.
21. As a student, I want the "Review" session mode to show questions I've previously seen, so that I can reinforce recently studied material.
22. As a student, I want the "Mixed" session mode to combine new, difficult, and review questions, so that I get a balanced session.
23. As a student, I want a session history in the Stats tab, so that I can see how I've been performing over time.
24. As a student, I want to tap a topic tile in the heatmap to see that topic's question history and score trend, so that I can understand my trajectory on each domain.
25. As a student, I want a Home dashboard showing my most recent session result and a quick-start button, so that I can jump into studying with one tap.
26. As a student, I want a bottom navigation bar with Home, Topics, Study, and Stats tabs, so that I can navigate the app with one thumb.
27. As a student, I want the app to show a custom "Add to Home Screen" install banner on first visit, so that I remember to install it.
28. As a student, I want the app to detect when I'm offline and fall back to existing questions automatically, so that I never hit a broken loading state.
29. As a student, I want topic proficiency scores to update after every completed session based on my performance, so that the heatmap is always current.
30. As a student, I want the session configurator to remember my last-used defaults (topic, mode, count), so that repeated sessions require fewer taps.

## Implementation Decisions

### Modules

**Data Layer**
- `ExamDB` (Dexie) — four IndexedDB stores: `questions`, `topics`, `sessions`, `settings`. Indexes on `topicId`, `errorCount`, `lastSeenAt` for efficient query building. `settings` is a key-value store (singleton record per key).
- `seed.ts` — runs once on first launch: checks `questions.count() === 0`, bulk-inserts seed questions and the 17 hardcoded topic definitions. Called in `main.ts` before `app.mount()`.

**Spaced Repetition (`useSpacedRepetition`)**
- Pure functions only, no side effects. Inputs: `rawScore`, `lastReviewedAt`.
- Effective score: `rawScore * Math.exp(-0.1 * daysSinceReview)` (half-life ~7 days)
- Score update after session: 70% weight to history, 30% weight to session correct %.
- Color thresholds: green ≥70, yellow ≥40, red <40, gray (never reviewed).
- Raw score stored in DB; effective score computed at read time.

**Question Generator (`useQuestionGenerator`)**
- Accepts `topicIds`, `count`, `apiKey`.
- Checks `isOnline` first; returns empty if offline.
- Calls Anthropic SDK directly from the browser with user-provided key.
- Accumulates full streamed response before parsing JSON (no incremental parsing).
- Validates each generated item against the `GeneratedQuestion` interface before persisting.
- Saves valid questions to `db.questions` with `source: 'generated'`.
- Returns persisted questions with assigned DB ids.
- On any error (network, bad key, bad JSON), falls back gracefully and returns empty.

**Session Orchestration (`useSession`)**
- `buildQuestionQueue(config)` — queries IndexedDB by mode and topicIds, shuffles, slices to count.
- `submitAnswer(questionId, selectedIndex, timeMs)` — records answer, updates `errorCount` and `lastSeenAt` in DB.
- `completeSession()` — writes `Session` record to DB, triggers SR score update for all affected topics.

**State (Pinia)**
- `settingsStore` — loads from DB on init, exposes `apiKey`, `defaultQuestionCount`, `defaultMode`. Writes through to DB on change.
- `topicsStore` — loads topic list with raw scores from DB. Computes effective scores in a getter. Refreshes after each session.
- `sessionStore` — active session state machine: `idle → loading → active → review`. Holds current question queue, index, and answers.

**Routing (Vue Router 4)**
- Hash history (`createWebHashHistory`) for GitHub Pages compatibility.
- Nav guard: accessing `/study/session` without active session state redirects to `/study`.

**PWA (vite-plugin-pwa + Workbox)**
- `registerType: 'autoUpdate'` — silent background updates.
- Cache-first for all static assets.
- Network-only for `api.anthropic.com` — API key must never be cached.
- `InstallBanner.vue` captures `beforeinstallprompt` event; dismissal stored in `localStorage`.

**Network Detection (`useNetwork`)**
- Reactive `isOnline` ref driven by `window` online/offline events. No third-party library.

### Architecture Decisions
- No backend — all data stays on-device.
- Direct browser calls to Anthropic API with user-owned key.
- SR raw score stored; effective score derived — avoids re-writing decayed values to DB on every read.
- Hash history routing — zero server config, works on GitHub Pages as-is.
- Seed JSON contains only question-domain fields; runtime fields (`source`, `errorCount`, `lastSeenAt`, `createdAt`) added by `seed.ts` at import time.

### Deployment
- GitHub Pages via GitHub Actions.
- Vite base path set to the repo name for production builds.

## Testing Decisions

A good test only tests external behavior visible through the module's public interface — not internal implementation details. Tests should not reach into private state or mock internal functions. Prefer testing real IndexedDB interactions using `fake-indexeddb` over mocking the DB layer entirely.

**`useSpacedRepetition`**
- Unit tests for `effectiveScore` — verify score decay over N days matches formula.
- Unit tests for `updatedRawScore` — verify weighted average at boundary values (0%, 50%, 100% session correct).
- Unit tests for `scoreToColor` — verify threshold mapping at boundary values (39, 40, 69, 70).

**`useQuestionGenerator`**
- Integration tests with a mocked Anthropic SDK client.
- Test: valid response → questions persisted to test DB, returned with IDs.
- Test: malformed JSON response → empty array returned, no DB writes.
- Test: offline state → returns empty without calling SDK.
- Test: API error → falls back gracefully, no crash.

**`useSession` (queue build)**
- Integration tests against a seeded in-memory Dexie instance (`fake-indexeddb`).
- Test `new` mode — returns only questions with `lastSeenAt = null`.
- Test `difficult` mode — returns only questions with `errorCount >= 2`.
- Test `review` mode — returns only questions with `lastSeenAt > 0`.
- Test topic filter — combined with each mode, only returns questions matching topicIds.
- Test count slice — queue length does not exceed requested count.
- Test shuffle — results are not always in insertion order (probabilistic assertion).

## Out of Scope

- User accounts, cloud sync, or any backend infrastructure.
- Multi-user support.
- Other AWS certifications (SAA-C03 only for now).
- Push notifications or reminders.
- Social features (sharing scores, leaderboards).
- Multi-select questions (the real exam has some — deferred to post-MVP).
- Explanation editing or custom question authoring UI.
- Dark/light theme toggle.
- Internationalization.
- Analytics or telemetry.

## Further Notes

- The Anthropic model used for question generation defaults to `claude-sonnet-4-6`. Hardcoded initially; can be made configurable later.
- The spaced repetition decay rate (half-life ~7 days) is a reasonable starting default but may need tuning. It should be a named constant for easy adjustment.
- The seed question bank should skew coverage toward high-weight SAA-C03 domains: EC2, S3, VPC, IAM, and RDS warrant more questions than low-weight domains like Trusted Advisor.
- The question generation prompt should be versioned as a named constant (not an inline string) to make future prompt engineering changes easy to track.
- The app directory name (`exam-creator`) should match the GitHub repo name so the Vite production base path works correctly with GitHub Pages.
