# Issue Tracker — AWS SAA-C03 Study PWA

Parent PRD: `docs/INITIAL_START_01/PRD.md`

---

## Issue #1 — Project scaffold + PWA shell

**Type:** AFK
**Blocked by:** None — can start immediately

### What to build

Scaffold the Vue 3 + Vite + TypeScript project with all base dependencies installed. Wire up `vite-plugin-pwa` with Workbox (cache-first for assets, network-only for `api.anthropic.com`). Set up Vue Router 4 with hash history and placeholder views for all 8 routes. Implement the `BottomNav` component (Home/Topics/Study/Stats tabs) and `InstallBanner` that captures the `beforeinstallprompt` event. After first load, the app shell must be fully accessible offline.

### Acceptance criteria

- [ ] `npm run dev` starts the app without errors
- [ ] Vue Router with hash history navigates between all placeholder views
- [ ] Bottom tab bar renders and switches between Home, Topics, Study, Stats
- [ ] Install banner appears on first visit and can be dismissed (dismissal persisted to `localStorage`)
- [ ] `npm run build` produces a valid PWA — Lighthouse PWA audit passes
- [ ] App shell loads from cache when offline (verified via DevTools → Network → Offline)

### Blocked by

None — can start immediately

### User stories addressed

- User story 1 (install to home screen)
- User story 2 (works offline)
- User story 26 (bottom nav)
- User story 27 (install banner)

---

## Issue #2a — TypeScript interfaces + Dexie schema

**Type:** AFK
**Blocked by:** #1

### What to build

Define all TypeScript interfaces in `src/types/index.ts` — the canonical source of truth for `Question`, `Topic`, `Session`, `Setting`, `SessionConfig`, `GeneratedQuestion`, and all union types (`QuestionSource`, `SessionMode`, `FeedbackMode`, `SettingKey`). Implement the `ExamDB` Dexie class in `src/db/db.ts` with all four stores (`questions`, `topics`, `sessions`, `settings`) and their indexes. Export a singleton `db` instance.

### Acceptance criteria

- [ ] `src/types/index.ts` exports all interfaces and types with no TypeScript errors
- [ ] `ExamDB` class defines all four stores with correct index signatures
- [ ] Dexie indexes present: `questions` on `topicId`, `errorCount`, `lastSeenAt`; `sessions` on `startedAt`, `completedAt`, `mode`
- [ ] `db` singleton exported and importable from other modules
- [ ] No runtime errors when the DB is initialized in the browser

### Blocked by

- Blocked by #1

### User stories addressed

- Foundation for all other user stories (no direct user-facing behavior)

---

## Issue #2b — Seed question bank

**Type:** AFK
**Blocked by:** #2a

### What to build

Create `src/data/topics.ts` exporting the `TOPIC_DEFINITIONS` constant (17 `Topic` records, all with `rawScore: 0`, `lastReviewedAt: null`, `totalSessions: 0`). Create `src/data/seed-questions.json` containing ~100-200 SAA-C03 questions (only domain fields: `topicId`, `text`, `options`, `correctIndex`, `explanation`). Implement `src/db/seed.ts` with a `seedIfNeeded(db)` function that checks `questions.count() === 0` then bulk-inserts questions (with runtime fields added) and topic definitions in a single transaction. Call `seedIfNeeded` in `main.ts` before `app.mount()`.

Coverage target: skew toward EC2, S3, VPC, IAM, RDS (~10-12 each); lighter coverage for Trusted Advisor, Storage Gateway (~4-6 each).

### Acceptance criteria

- [ ] `seedIfNeeded` runs exactly once on first launch (idempotent — second call is a no-op)
- [ ] After seed: `db.questions.count()` returns 100-200
- [ ] After seed: `db.topics.count()` returns exactly 17
- [ ] Every seeded question has `source: 'seed'`, `errorCount: 0`, `lastSeenAt: null`
- [ ] Every `topicId` in seed questions matches a valid id in `TOPIC_DEFINITIONS`
- [ ] No TypeScript errors in seed JSON import

### Blocked by

- Blocked by #2a

### User stories addressed

- User story 3 (pre-seeded question bank)

---

## Issue #3a — Settings data layer

**Type:** AFK
**Blocked by:** #2a

### What to build

Implement `src/stores/settings.ts` (Pinia). On `loadFromDB()`, read all keys from `db.settings` and populate reactive state (`apiKey`, `defaultQuestionCount`, `defaultMode`). Expose `saveApiKey(key)` and `saveDefaults(count, mode)` actions that write through to `db.settings` and update state. Call `loadFromDB()` in `main.ts` after DB init. The store must expose a computed `hasApiKey` boolean.

### Acceptance criteria

- [ ] `settingsStore.loadFromDB()` populates state from IndexedDB on init
- [ ] `saveApiKey('sk-ant-...')` persists to DB and updates `settingsStore.apiKey` reactively
- [ ] Reloading the app restores the saved API key from DB
- [ ] `hasApiKey` is `false` when no key is stored, `true` after saving
- [ ] `saveDefaults(count, mode)` persists and restores correctly on reload

### Blocked by

- Blocked by #2a

### User stories addressed

- User story 4 (enter API key once)
- User story 5 (key stays on device)

---

## Issue #3b — Settings UI

**Type:** AFK
**Blocked by:** #3a

### What to build

Implement `src/views/SettingsView.vue` accessible at `/#/settings` (reachable via a gear icon on `HomeView`). The view must display a masked API key input field pre-populated from `settingsStore.apiKey`, a save button that calls `saveApiKey()`, a confirmation message on save, and default session preference fields (question count, default mode) wired to `saveDefaults()`.

### Acceptance criteria

- [ ] API key field is masked (type="password") and pre-fills from store on mount
- [ ] Save button calls `settingsStore.saveApiKey()` and shows a confirmation
- [ ] Saving an empty key clears the stored key
- [ ] Default question count and mode fields save and restore on reload
- [ ] Gear icon on `HomeView` navigates to `/#/settings`

### Blocked by

- Blocked by #3a

### User stories addressed

- User story 4 (settings screen)
- User story 5 (key stored on device)

---

## Issue #4 — Spaced repetition engine + unit tests

**Type:** AFK
**Blocked by:** #2a

### What to build

Implement `src/composables/useSpacedRepetition.ts` exporting three pure functions: `effectiveScore(rawScore, lastReviewedAt)`, `updatedRawScore(previousRawScore, sessionCorrectPct)`, and `scoreToColor(effectiveScore)`. Write unit tests covering boundary conditions for all three functions.

Formulas:
- `effectiveScore = rawScore * Math.exp(-0.1 * daysSinceReview)` — returns 0 if `lastReviewedAt` is null
- `updatedRawScore = (previous * 0.7) + (sessionCorrectPct * 100 * 0.3)`
- `scoreToColor`: green ≥70, yellow ≥40, red <40, gray if `lastReviewedAt` is null

### Acceptance criteria

- [ ] `effectiveScore(100, now)` returns ~100; `effectiveScore(100, 7_days_ago)` returns ~50
- [ ] `effectiveScore(anyScore, null)` returns 0
- [ ] `updatedRawScore(0, 1.0)` returns 30; `updatedRawScore(100, 0)` returns 70
- [ ] `scoreToColor` returns correct color at boundaries: 39→red, 40→yellow, 69→yellow, 70→green
- [ ] All unit tests pass with `npm run test`

### Blocked by

- Blocked by #2a

### User stories addressed

- User story 9 (score decay over time)
- User story 29 (scores update after session)

---

## Issue #5 — Topic heatmap view

**Type:** AFK
**Blocked by:** #4

### What to build

Implement `src/stores/topics.ts` (Pinia) that loads all 17 topics from `db.topics` and exposes a `topicsWithEffectiveScore` getter (applies SR decay at read time). Implement `TopicTile.vue`, `HeatmapGrid.vue`, and `TopicsView.vue` (`/#/topics`). Each tile shows the topic name, effective score %, and is colored green/yellow/red/gray based on `scoreToColor`. Add a `refreshTopics()` action for post-session updates.

### Acceptance criteria

- [ ] `/#/topics` renders 17 topic tiles in a grid
- [ ] Each tile color matches `scoreToColor` output for that topic's effective score
- [ ] All tiles show gray on first launch (never reviewed)
- [ ] Tapping a tile navigates to `/#/topics/:id` (placeholder view is fine at this stage)
- [ ] `topicsStore.refreshTopics()` re-queries DB and updates tile colors reactively

### Blocked by

- Blocked by #4

### User stories addressed

- User story 8 (proficiency heatmap)
- User story 9 (score decay reflected in UI)

---

## Issue #6 — Session configurator

**Type:** AFK
**Blocked by:** #2b

### What to build

Implement `src/composables/useNetwork.ts` exposing a reactive `isOnline` ref. Implement `src/stores/session.ts` (Pinia) with `idle` state and a `configure(config: SessionConfig)` action. Implement `StudyView.vue` (`/#/study`) with: topic multi-select (all 17 topics, "All" shortcut), mode selector (Review/Difficult/New/Mixed), question count input (5-65, default 10), feedback mode toggle (Study/Exam), timer toggle + seconds input. "Start Session" button calls `sessionStore.configure()` and navigates to `/#/study/session`. Last-used config persists to `settingsStore`.

### Acceptance criteria

- [ ] All 4 config options (topic, mode, count, feedback mode) render and are selectable
- [ ] Timer toggle shows/hides a time input
- [ ] "Start Session" is disabled if no topic is selected
- [ ] Config is saved to `settingsStore` and pre-fills on next visit
- [ ] `isOnline` ref updates reactively when network status changes (verified by toggling DevTools offline)

### Blocked by

- Blocked by #2b

### User stories addressed

- User story 10 (filter by topic)
- User story 11 (mode selector)
- User story 12 (question count)
- User story 13 (timer toggle)
- User story 15 (study mode option)
- User story 16 (exam mode option)
- User story 28 (offline fallback config)
- User story 30 (remember defaults)

---

## Issue #7 — Offline quiz session (end-to-end)

**Type:** AFK
**Blocked by:** #5, #6

### What to build

Implement `src/composables/useSession.ts` with `buildQuestionQueue(config)` (queries IndexedDB by mode + topicIds, shuffles, slices), `submitAnswer(questionId, selectedIndex, timeMs)` (updates `errorCount` + `lastSeenAt` in DB), and `completeSession()` (writes `Session` record to DB). Implement `QuestionCard.vue` (question text + 4 radio options), `ProgressBar.vue`, and `SessionView.vue` (`/#/study/session`) with the full quiz flow: study mode shows feedback overlay after each answer, exam mode shows nothing. Implement `SessionReviewView.vue` (`/#/study/session/review`) showing all questions, selected answers, correct answers, and explanations. Add nav guard: accessing session without active config redirects to `/#/study`. Write integration tests for `buildQuestionQueue` using `fake-indexeddb`.

### Acceptance criteria

- [ ] Session starts with the correct number of questions for the selected mode/topics
- [ ] Radio buttons are single-select, disabled after answer is submitted
- [ ] In study mode: correct/wrong feedback + explanation shown after each answer before advancing
- [ ] In exam mode: no feedback shown mid-session
- [ ] Timer counts down when enabled; session auto-completes on timeout
- [ ] `SessionReviewView` shows all answers with correct/incorrect indicator and explanations
- [ ] `completeSession()` writes a `Session` record to `db.sessions`
- [ ] Nav guard redirects to `/#/study` if session state is idle
- [ ] Queue build tests pass for all 4 modes with topic filter + count slice

### Blocked by

- Blocked by #5
- Blocked by #6

### User stories addressed

- User story 14 (4-option radio buttons)
- User story 15 (study mode feedback)
- User story 16 (exam mode)
- User story 17 (end-of-session review)
- User story 18 (explanations)
- User story 19 (difficult mode)
- User story 20 (new mode)
- User story 21 (review mode)
- User story 22 (mixed mode)
- User story 28 (offline fallback)

---

## Issue #8 — Post-session SR score updates

**Type:** AFK
**Blocked by:** #7

### What to build

Wire `completeSession()` in `useSession.ts` to call `useSpacedRepetition.updatedRawScore()` for each topic touched in the session, then write updated `rawScore` and `lastReviewedAt` back to `db.topics`. After completion, call `topicsStore.refreshTopics()` so the heatmap reflects the new scores immediately. The session store transitions from `active` → `review` state after this.

### Acceptance criteria

- [ ] After completing a session, affected topic tiles in the heatmap update color without a page reload
- [ ] `db.topics` records show updated `rawScore` and `lastReviewedAt` after session
- [ ] Topics not touched in the session are not modified
- [ ] A 100% correct session raises `rawScore`; a 0% correct session lowers it
- [ ] `sessionStore.status` transitions to `'review'` after `completeSession()`

### Blocked by

- Blocked by #7

### User stories addressed

- User story 9 (score decay + update)
- User story 29 (scores update after session)

---

## Issue #9a — Home dashboard

**Type:** AFK
**Blocked by:** #8

### What to build

Implement `HomeView.vue` (`/#`) showing: app name/header, most recent completed session result (score, date, topics covered), a quick-start button that navigates to `/#/study` with last-used config pre-filled, and a gear icon linking to `/#/settings`. If no session has been completed yet, show an empty state with an intro message.

### Acceptance criteria

- [ ] `/#` renders without errors on first launch (empty state shown)
- [ ] After completing a session, `HomeView` shows the most recent session's score and date
- [ ] Quick-start button navigates to `/#/study` with last config pre-filled
- [ ] Gear icon navigates to `/#/settings`

### Blocked by

- Blocked by #8

### User stories addressed

- User story 25 (home dashboard + quick start)

---

## Issue #9b — Stats view

**Type:** AFK
**Blocked by:** #8

### What to build

Implement `StatsView.vue` (`/#/stats`) showing a chronological list of all completed sessions. Each entry displays: date, mode, topics covered, score (X/N correct), and duration. Show overall stats at the top: total sessions, total questions answered, overall correct %.

### Acceptance criteria

- [ ] `/#/stats` lists all sessions in reverse chronological order
- [ ] Each row shows date, mode, score, and duration
- [ ] Overall stats header updates after each new session
- [ ] Empty state shown if no sessions completed yet

### Blocked by

- Blocked by #8

### User stories addressed

- User story 23 (session history)

---

## Issue #10 — Topic detail view

**Type:** AFK
**Blocked by:** #8

### What to build

Implement `TopicDetailView.vue` (`/#/topics/:id`) showing: topic name, current effective score, score history across past sessions (list of session date + correct % for that topic), total questions available for the topic, and how many are flagged as difficult (errorCount ≥ 2).

### Acceptance criteria

- [ ] Tapping a topic tile in `HeatmapGrid` navigates to `/#/topics/:id`
- [ ] View shows current effective score and raw score
- [ ] Session history list shows only sessions that included this topic
- [ ] Difficult question count is accurate
- [ ] Unknown topic id redirects back to `/#/topics`

### Blocked by

- Blocked by #8

### User stories addressed

- User story 24 (topic detail + score trend)

---

## Issue #11 — Online question generation

**Type:** AFK
**Blocked by:** #3b, #6

### What to build

Implement `src/composables/useQuestionGenerator.ts`: accepts `topicIds`, `count`, `apiKey`; checks `isOnline`; calls `@anthropic-ai/sdk` with streaming (model: `claude-sonnet-4-6`); accumulates full response then parses JSON; validates each item against `GeneratedQuestion`; persists valid questions to `db.questions` with `source: 'generated'`; returns persisted questions with DB ids. On any error, returns empty array. Integrate into `StudyView` → `SessionView` flow: when online + `hasApiKey` + mode is `new` or `mixed`, generate questions before starting the session. Show a loading state in `sessionStore` (`status: 'loading'`) with a spinner while generating. Write integration tests with a mocked Anthropic SDK client.

The generation prompt must be a named constant (not an inline string).

### Acceptance criteria

- [ ] When online with a valid API key, starting a "New" session generates questions via Claude and saves them to DB
- [ ] Generated questions appear in the session and persist to IndexedDB (available offline after)
- [ ] Loading spinner is shown while generation is in progress
- [ ] If offline, session falls back to existing DB questions silently (no error shown)
- [ ] If API call fails (bad key, rate limit), falls back to DB questions gracefully
- [ ] Malformed Claude response (invalid JSON) is handled without crashing
- [ ] Integration tests pass: valid response → persisted; bad JSON → empty; offline → empty

### Blocked by

- Blocked by #3b
- Blocked by #6

### User stories addressed

- User story 6 (generate new questions online)
- User story 7 (generated questions saved offline)
- User story 28 (offline fallback)

---

## Issue #12 — GitHub Pages deployment

**Type:** AFK
**Blocked by:** #1

### What to build

Configure `vite.config.ts` with `base: '/exam-creator/'` for production builds. Create `.github/workflows/deploy.yml` that triggers on push to `main`, runs `npm ci && npm run build`, and deploys `dist/` to GitHub Pages using `actions/deploy-pages`. Verify the deployed app loads correctly at the GitHub Pages URL with all routes working via hash history.

### Acceptance criteria

- [ ] `npm run build` succeeds with correct base path in output asset URLs
- [ ] GitHub Actions workflow runs successfully on push to `main`
- [ ] App is accessible at the GitHub Pages URL
- [ ] Hash routing works on the deployed URL (e.g. `/#/topics` loads correctly)
- [ ] PWA manifest and service worker are served correctly from the deployed URL

### Blocked by

- Blocked by #1

### User stories addressed

- Infrastructure (no direct user story — enables all user stories on mobile)

---

## Dependency Graph

```
#1 (scaffold)
├── #2a (types + schema)
│   ├── #2b (seed data)
│   │   └── #6 (session configurator)
│   │       └── #7 (offline quiz session)
│   │           └── #8 (SR score updates)
│   │               ├── #9a (home dashboard)
│   │               ├── #9b (stats view)
│   │               └── #10 (topic detail)
│   ├── #3a (settings data layer)
│   │   └── #3b (settings UI)
│   │       └── #11 (question generation) ←─ also needs #6
│   └── #4 (SR engine + tests)
│       └── #5 (heatmap view) ──────────── also needed by #7
└── #12 (deployment)
```
