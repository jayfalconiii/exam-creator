# RUNBOOK: Issue Wave Execution

Drives all 15 GitHub issues via dependency-ordered waves. Each wave spawns
isolated agents that implement features using `/tdd`, then open PRs for review.

**Rule:** Merge all PRs in wave N before starting wave N+1.

---

## Dependency Wave Map

| Wave | Issues | Parallel | Blocked by |
|------|--------|----------|------------|
| 1 | #1 | — | — |
| 2 | #2 | — | #1 |
| 3 | #3, #4, #5 | ✓ | #2 |
| 4 | #6, #7, #8 | ✓ | wave 3 |
| 5 | #9, #14 | ✓ | wave 4 |
| 6 | #10 | — | #9 |
| 7 | #11, #12, #13 | ✓ | #10 |
| 8 | #15 | — | wave 7 |

---

## How to use

1. Copy a prompt block below
2. Paste into your Claude Code session and press Enter
3. Claude spawns an isolated agent with its own git worktree
4. The agent runs `/tdd` in a ralph-loop until tests pass, then opens a PR
5. Review and merge the PR, then move to the next wave

---

## Wave 1 — #1: Project scaffold + PWA shell

**Prerequisite:** None

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #1.

Branch: issue/1  |  PR target: main

== ISSUE: feat(scaffold): project scaffold + PWA shell ==

What to build:
Scaffold the Vue 3 + Vite + TypeScript project with all base dependencies
installed. Wire up `vite-plugin-pwa` with Workbox (cache-first for assets,
network-only for `api.anthropic.com`). Set up Vue Router 4 with hash history
and placeholder views for all 8 routes. Implement `BottomNav` component
(Home/Topics/Study/Stats tabs) and `InstallBanner` that captures the
`beforeinstallprompt` event. After first load the app shell must be fully
accessible offline.

Acceptance criteria:
- `npm run dev` starts without errors
- Vue Router hash history navigates between all placeholder views
- Bottom tab bar renders and switches tabs
- Install banner appears on first visit, dismissal persisted to localStorage
- `npm run build` produces a valid PWA — Lighthouse PWA audit passes
- App shell loads from cache when offline

PRD context: docs/INITIAL_START_01/PRD.md

Instructions:
1. Create branch issue/1 from main
2. Run `/ralph-loop` driving `/tdd` — stop when /tdd exits cleanly with all
   tests and build passing
3. Open a PR to main titled: feat(scaffold): project scaffold + PWA shell
4. Include "Closes #1" in the PR body
```

---

## Wave 2 — #2: TypeScript interfaces + Dexie schema

**Prerequisite:** #1 merged

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #2.

Branch: issue/2  |  PR target: main

== ISSUE: feat(db): TypeScript interfaces + Dexie schema ==

What to build:
Define all TypeScript interfaces in `src/types/index.ts` — the canonical
source of truth for Question, Topic, Session, Setting, SessionConfig,
GeneratedQuestion, and all union types (QuestionSource, SessionMode,
FeedbackMode, SettingKey). Implement the ExamDB Dexie class in `src/db/db.ts`
with all four stores (questions, topics, sessions, settings) and their indexes.
Export a singleton `db` instance.

Acceptance criteria:
- src/types/index.ts exports all interfaces with no TypeScript errors
- ExamDB defines all four stores with correct index signatures
- Dexie indexes: questions on topicId, errorCount, lastSeenAt; sessions on
  startedAt, completedAt, mode
- db singleton exported and importable
- No runtime errors when DB initializes in the browser

PRD context: docs/INITIAL_START_01/PRD.md

Instructions:
1. Create branch issue/2 from main (ensure #1 is merged first)
2. Run `/ralph-loop` driving `/tdd` — stop when /tdd exits cleanly
3. Open a PR to main titled: feat(db): TypeScript interfaces + Dexie schema
4. Include "Closes #2" in the PR body
```

---

## Wave 3 — #3, #4, #5 (run in parallel)

**Prerequisite:** #2 merged

### #3: Seed question bank + topic definitions

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #3.

Branch: issue/3  |  PR target: main

== ISSUE: feat(db): seed question bank + topic definitions ==

What to build:
Create `src/data/topics.ts` exporting TOPIC_DEFINITIONS (17 Topic records, all
with rawScore: 0, lastReviewedAt: null, totalSessions: 0). Create
`src/data/seed-questions.json` with ~100-200 SAA-C03 questions (fields:
topicId, text, options, correctIndex, explanation). Implement `src/db/seed.ts`
with seedIfNeeded(db) that checks questions.count() === 0 then bulk-inserts
questions (with runtime fields added) and topic definitions in one transaction.
Call seedIfNeeded in main.ts before app.mount().

Coverage: skew toward EC2, S3, VPC, IAM, RDS (~10-12 each); lighter for
Trusted Advisor, Storage Gateway (~4-6 each).

Acceptance criteria:
- seedIfNeeded is idempotent — second call is a no-op
- After seed: db.questions.count() returns 100-200
- After seed: db.topics.count() returns exactly 17
- Every seeded question has source: 'seed', errorCount: 0, lastSeenAt: null
- Every topicId in seed questions matches a valid id in TOPIC_DEFINITIONS
- No TypeScript errors in seed JSON import

PRD context: docs/INITIAL_START_01/PRD.md

Instructions:
1. Create branch issue/3 from main (ensure #2 is merged first)
2. Run `/ralph-loop` driving `/tdd` — stop when /tdd exits cleanly
3. Open a PR to main titled: feat(db): seed question bank + topic definitions
4. Include "Closes #3" in the PR body
```

### #4: Settings data layer (Pinia + IndexedDB)

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #4.

Branch: issue/4  |  PR target: main

== ISSUE: feat(settings): settings data layer (Pinia + IndexedDB) ==

What to build:
Implement src/stores/settings.ts (Pinia). On loadFromDB(), read all keys from
db.settings and populate reactive state (apiKey, defaultQuestionCount,
defaultMode). Expose saveApiKey(key) and saveDefaults(count, mode) actions that
write through to db.settings and update state. Call loadFromDB() in main.ts
after DB init. The store must expose a computed hasApiKey boolean.

Acceptance criteria:
- settingsStore.loadFromDB() populates state from IndexedDB on init
- saveApiKey('sk-ant-...') persists to DB and updates settingsStore.apiKey
- Reloading the app restores the saved API key from DB
- hasApiKey is false when no key stored, true after saving
- saveDefaults(count, mode) persists and restores correctly on reload

PRD context: docs/INITIAL_START_01/PRD.md

Instructions:
1. Create branch issue/4 from main (ensure #2 is merged first)
2. Run `/ralph-loop` driving `/tdd` — stop when /tdd exits cleanly
3. Open a PR to main titled: feat(settings): settings data layer (Pinia + IndexedDB)
4. Include "Closes #4" in the PR body
```

### #5: Spaced repetition engine + unit tests

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #5.

Branch: issue/5  |  PR target: main

== ISSUE: feat(sr): spaced repetition engine + unit tests ==

What to build:
Implement src/composables/useSpacedRepetition.ts exporting three pure
functions: effectiveScore(rawScore, lastReviewedAt), updatedRawScore
(previousRawScore, sessionCorrectPct), and scoreToColor(effectiveScore).
Write unit tests covering all boundary conditions.

Formulas:
- effectiveScore = rawScore * Math.exp(-0.1 * daysSinceReview); returns 0 if
  lastReviewedAt is null
- updatedRawScore = (previous * 0.7) + (sessionCorrectPct * 100 * 0.3)
- scoreToColor: green ≥70, yellow ≥40, red <40, gray if lastReviewedAt null

Acceptance criteria:
- effectiveScore(100, now) ≈ 100; effectiveScore(100, 7_days_ago) ≈ 50
- effectiveScore(anyScore, null) returns 0
- updatedRawScore(0, 1.0) returns 30; updatedRawScore(100, 0) returns 70
- scoreToColor boundaries: 39→red, 40→yellow, 69→yellow, 70→green
- All unit tests pass with `npm run test`

PRD context: docs/INITIAL_START_01/PRD.md

Instructions:
1. Create branch issue/5 from main (ensure #2 is merged first)
2. Run `/ralph-loop` driving `/tdd` — stop when /tdd exits cleanly with all
   unit tests passing
3. Open a PR to main titled: feat(sr): spaced repetition engine + unit tests
4. Include "Closes #5" in the PR body
```

---

## Wave 4 — #6, #7, #8 (run in parallel)

**Prerequisite:** #3, #4, #5 all merged

### #6: Settings UI (SettingsView)

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #6.

Branch: issue/6  |  PR target: main

== ISSUE: feat(settings): settings UI (SettingsView) ==

What to build:
Implement src/views/SettingsView.vue at /#/settings. Display a masked API key
input field pre-populated from settingsStore.apiKey, a save button calling
saveApiKey(), a confirmation message on save, and default session preference
fields (question count, default mode) wired to saveDefaults(). Add a gear icon
on HomeView navigating to /#/settings.

Acceptance criteria:
- API key field is masked (type="password") and pre-fills from store on mount
- Save button calls settingsStore.saveApiKey() and shows confirmation
- Saving an empty key clears the stored key
- Default question count and mode save and restore on reload
- Gear icon on HomeView navigates to /#/settings

PRD context: docs/INITIAL_START_01/PRD.md

Instructions:
1. Create branch issue/6 from main (ensure #4 is merged first)
2. Run `/ralph-loop` driving `/tdd` — stop when /tdd exits cleanly
3. Open a PR to main titled: feat(settings): settings UI (SettingsView)
4. Include "Closes #6" in the PR body
5. Don't forget to remove the worktree once PR is successfully created
```

### #7: Topic heatmap view

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #7.

Branch: issue/7  |  PR target: main

== ISSUE: feat(topics): topic heatmap view ==

What to build:
Implement src/stores/topics.ts (Pinia) that loads all 17 topics from db.topics
and exposes a topicsWithEffectiveScore getter (applies SR decay at read time).
Implement TopicTile.vue, HeatmapGrid.vue, and TopicsView.vue (/#/topics). Each
tile shows topic name, effective score %, colored by scoreToColor. Add a
refreshTopics() action for post-session updates.

Acceptance criteria:
- /#/topics renders 17 topic tiles in a grid
- Each tile color matches scoreToColor output for that topic's effective score
- All tiles show gray on first launch (never reviewed)
- Tapping a tile navigates to /#/topics/:id (placeholder view is fine)
- topicsStore.refreshTopics() re-queries DB and updates tile colors reactively

PRD context: docs/INITIAL_START_01/PRD.md

Instructions:
1. Create branch issue/7 from main (ensure #5 is merged first)
2. Run `/ralph-loop` driving `/tdd` — stop when /tdd exits cleanly
3. Open a PR to main titled: feat(topics): topic heatmap view
4. Include "Closes #7" in the PR body
5. Don't forget to remove the worktree once PR is successfully created
```

### #8: Session configurator

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #8.

Branch: issue/8  |  PR target: main

== ISSUE: feat(study): session configurator ==

What to build:
Implement src/composables/useNetwork.ts exposing a reactive isOnline ref.
Implement src/stores/session.ts (Pinia) with idle state and a configure(config:
SessionConfig) action. Implement StudyView.vue (/#/study) with: topic
multi-select (all 17 topics, "All" shortcut), mode selector (Review/Difficult/
New/Mixed), question count input (5-65, default 10), feedback mode toggle
(Study/Exam), timer toggle + seconds input. "Start Session" button calls
sessionStore.configure() and navigates to /#/study/session. Last-used config
persists to settingsStore.

Acceptance criteria:
- All 4 config options render and are selectable
- Timer toggle shows/hides a time input
- "Start Session" is disabled if no topic is selected
- Config saves to settingsStore and pre-fills on next visit
- isOnline ref updates reactively when network status changes

PRD context: docs/INITIAL_START_01/PRD.md

Instructions:
1. Create branch issue/8 from main (ensure #3 is merged first)
2. Run `/ralph-loop` driving `/tdd` — stop when /tdd exits cleanly
3. Open a PR to main titled: feat(study): session configurator
4. Include "Closes #8" in the PR body
5. Don't forget to remove the worktree once PR is successfully created
```

---

## Wave 5 — #9, #14 (run in parallel)

**Prerequisite:** #6, #7, #8 all merged

### #9: Offline quiz session end-to-end

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #9.

Branch: issue/9  |  PR target: main

== ISSUE: feat(session): offline quiz session end-to-end ==

What to build:
Implement src/composables/useSession.ts with:
- buildQuestionQueue(config): queries IndexedDB by mode + topicIds, shuffles, slices
- submitAnswer(questionId, selectedIndex, timeMs): updates errorCount +
  lastSeenAt in DB
- completeSession(): writes Session record to DB

Implement QuestionCard.vue (question text + 4 radio options), ProgressBar.vue,
and SessionView.vue (/#/study/session) with full quiz flow: study mode shows
feedback overlay after each answer, exam mode shows nothing. Implement
SessionReviewView.vue (/#/study/session/review) showing all questions, selected
answers, correct answers, explanations. Add nav guard: accessing session without
active config redirects to /#/study. Write integration tests for
buildQuestionQueue using fake-indexeddb.

Acceptance criteria:
- Session starts with correct number of questions for selected mode/topics
- Radio buttons are single-select, disabled after answer submitted
- Study mode: feedback + explanation shown after each answer before advancing
- Exam mode: no feedback shown mid-session
- Timer counts down when enabled; auto-completes on timeout
- SessionReviewView shows all answers with correct/incorrect + explanations
- completeSession() writes a Session record to db.sessions
- Nav guard redirects to /#/study if session state is idle
- Queue build tests pass for all 4 modes with topic filter + count slice

PRD context: docs/INITIAL_START_01/PRD.md

Instructions:
1. Create branch issue/9 from main (ensure #7 and #8 are merged first)
2. Run `/ralph-loop` driving `/tdd` — stop when /tdd exits cleanly with
   integration tests passing
3. Open a PR to main titled: feat(session): offline quiz session end-to-end
4. Include "Closes #9" in the PR body
```

### #14: Online question generation (Claude API)

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #14.

Branch: issue/14  |  PR target: main

== ISSUE: feat(ai): online question generation (Claude API) ==

What to build:
Implement src/composables/useQuestionGenerator.ts: accepts topicIds, count,
apiKey; checks isOnline; calls @anthropic-ai/sdk with streaming (model:
claude-sonnet-4-6); accumulates full response then parses JSON; validates each
item against GeneratedQuestion; persists valid questions to db.questions with
source: 'generated'; returns persisted questions with DB ids. On any error,
returns empty array.

Integrate into StudyView → SessionView flow: when online + hasApiKey + mode is
'new' or 'mixed', generate questions before starting the session. Show a loading
state (sessionStore status: 'loading') with a spinner while generating.

The generation prompt must be a named constant (not an inline string).

Write integration tests with a mocked Anthropic SDK client.

Acceptance criteria:
- When online with valid API key, starting a "New" session generates questions
  via Claude and saves them to DB
- Generated questions appear in the session and persist to IndexedDB
- Loading spinner shown while generation is in progress
- If offline, session falls back to existing DB questions silently
- If API call fails (bad key, rate limit), falls back to DB questions gracefully
- Malformed Claude response (invalid JSON) handled without crashing
- Integration tests pass: valid response → persisted; bad JSON → empty;
  offline → empty

PRD context: docs/INITIAL_START_01/PRD.md

Instructions:
1. Create branch issue/14 from main (ensure #6 and #8 are merged first)
2. Run `/ralph-loop` driving `/tdd` — stop when /tdd exits cleanly with
   integration tests passing
3. Open a PR to main titled: feat(ai): online question generation (Claude API)
4. Include "Closes #14" in the PR body
```

---

## Wave 6 — #10: Post-session SR score updates

**Prerequisite:** #9 merged

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #10.

Branch: issue/10  |  PR target: main

== ISSUE: feat(sr): post-session SR score updates ==

What to build:
Wire completeSession() in useSession.ts to call
useSpacedRepetition.updatedRawScore() for each topic touched in the session,
then write updated rawScore and lastReviewedAt back to db.topics. After
completion, call topicsStore.refreshTopics() so the heatmap reflects new scores
immediately. The session store transitions from active → review state.

Acceptance criteria:
- After completing a session, affected topic tiles update color without page reload
- db.topics records show updated rawScore and lastReviewedAt after session
- Topics not touched in the session are not modified
- A 100% correct session raises rawScore; a 0% correct session lowers it
- sessionStore.status transitions to 'review' after completeSession()

PRD context: docs/INITIAL_START_01/PRD.md

Instructions:
1. Create branch issue/10 from main (ensure #9 is merged first)
2. Run `/ralph-loop` driving `/tdd` — stop when /tdd exits cleanly
3. Open a PR to main titled: feat(sr): post-session SR score updates
4. Include "Closes #10" in the PR body
```

---

## Wave 7 — #11, #12, #13 (run in parallel)

**Prerequisite:** #10 merged

### #11: Home dashboard

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #11.

Branch: issue/11  |  PR target: main

== ISSUE: feat(home): home dashboard ==

What to build:
Implement HomeView.vue (/#) showing: app name/header, most recent completed
session result (score, date, topics covered), a quick-start button navigating
to /#/study with last-used config pre-filled, and a gear icon linking to
/#/settings. If no session completed yet, show empty state with intro message.

Acceptance criteria:
- /# renders without errors on first launch (empty state shown)
- After completing a session, HomeView shows most recent session score and date
- Quick-start button navigates to /#/study with last config pre-filled
- Gear icon navigates to /#/settings

PRD context: docs/INITIAL_START_01/PRD.md

Instructions:
1. Create branch issue/11 from main (ensure #10 is merged first)
2. Run `/ralph-loop` driving `/tdd` — stop when /tdd exits cleanly
3. Open a PR to main titled: feat(home): home dashboard
4. Include "Closes #11" in the PR body
```

### #12: Stats view (session history)

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #12.

Branch: issue/12  |  PR target: main

== ISSUE: feat(stats): stats view (session history) ==

What to build:
Implement StatsView.vue (/#/stats) showing a reverse-chronological list of all
completed sessions. Each entry: date, mode, topics covered, score (X/N correct),
duration. Show overall stats at top: total sessions, total questions answered,
overall correct %.

Acceptance criteria:
- /#/stats lists all sessions in reverse chronological order
- Each row shows date, mode, score, and duration
- Overall stats header updates after each new session
- Empty state shown if no sessions completed yet

PRD context: docs/INITIAL_START_01/PRD.md

Instructions:
1. Create branch issue/12 from main (ensure #10 is merged first)
2. Run `/ralph-loop` driving `/tdd` — stop when /tdd exits cleanly
3. Open a PR to main titled: feat(stats): stats view (session history)
4. Include "Closes #12" in the PR body
```

### #13: Topic detail view

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #13.

Branch: issue/13  |  PR target: main

== ISSUE: feat(topics): topic detail view ==

What to build:
Implement TopicDetailView.vue (/#/topics/:id) showing: topic name, current
effective score, score history across past sessions (list of session date +
correct % for that topic), total questions available for the topic, and how many
are flagged as difficult (errorCount ≥ 2).

Acceptance criteria:
- Tapping a topic tile in HeatmapGrid navigates to /#/topics/:id
- View shows current effective score and raw score
- Session history list shows only sessions that included this topic
- Difficult question count is accurate
- Unknown topic id redirects back to /#/topics

PRD context: docs/INITIAL_START_01/PRD.md

Instructions:
1. Create branch issue/13 from main (ensure #10 is merged first)
2. Run `/ralph-loop` driving `/tdd` — stop when /tdd exits cleanly
3. Open a PR to main titled: feat(topics): topic detail view
4. Include "Closes #13" in the PR body
```

---

## Wave 8 — #15: GitHub Pages deployment

**Prerequisite:** #11, #12, #13 all merged

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #15.

Branch: issue/15  |  PR target: main

== ISSUE: chore(deploy): GitHub Pages deployment ==

What to build:
Configure vite.config.ts with base: '/exam-creator/' for production builds.
Create .github/workflows/deploy.yml that triggers on push to main, runs
`npm ci && npm run build`, and deploys dist/ to GitHub Pages using
actions/deploy-pages. Verify the deployed app loads correctly at the GitHub
Pages URL with all routes working via hash history.

Acceptance criteria:
- `npm run build` succeeds with correct base path in output asset URLs
- GitHub Actions workflow runs successfully on push to main
- App is accessible at the GitHub Pages URL
- Hash routing works on the deployed URL (e.g. /#/topics loads correctly)
- PWA manifest and service worker are served correctly from deployed URL

PRD context: docs/INITIAL_START_01/PRD.md

Instructions:
1. Create branch issue/15 from main (ensure all prior waves are merged)
2. Run `/ralph-loop` driving `/tdd` — stop when /tdd exits cleanly
3. Open a PR to main titled: chore(deploy): GitHub Pages deployment
4. Include "Closes #15" in the PR body
```

---

## Quick reference

| Wave | Paste N prompts | Merge PRs | Then |
|------|----------------|-----------|------|
| 1 | 1 | #1 | → wave 2 |
| 2 | 1 | #2 | → wave 3 |
| 3 | 3 simultaneously | #3, #4, #5 | → wave 4 |
| 4 | 3 simultaneously | #6, #7, #8 | → wave 5 |
| 5 | 2 simultaneously | #9, #14 | → wave 6 |
| 6 | 1 | #10 | → wave 7 |
| 7 | 3 simultaneously | #11, #12, #13 | → wave 8 |
| 8 | 1 | #15 | done |
