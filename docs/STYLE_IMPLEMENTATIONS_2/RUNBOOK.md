# RUNBOOK: Design Overhaul Wave Execution

Drives all 6 GitHub issues via dependency-ordered waves. Each wave spawns
isolated agents that implement features using `/tdd`, then open PRs for review.

**Rule:** Merge all PRs in wave N before starting wave N+1.

---

## Dependency Wave Map

| Wave | Issues | Parallel | Blocked by |
|------|--------|----------|------------|
| 1 | #33 | — | — |
| 2 | #34, #35, #36, #37, #38 | ✓ | #33 |

---

## How to use

1. Copy a prompt block below
2. Paste into your Claude Code session and press Enter
3. Claude spawns an isolated agent with its own git worktree
4. The agent runs `/tdd` until tests pass, then opens a PR
5. Review and merge the PR, then move to the next wave

---

## Wave 1 — #33: Foundation — design tokens, PrimeVue setup, Inter font

**Prerequisite:** None

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #33.

Branch: issue/33  |  PR target: main

== ISSUE: feat(design): foundation — design tokens, PrimeVue setup, Inter font ==

What to build:
Set up the entire design foundation that all other styling slices depend on.
Install PrimeVue v4 + `@primevue/themes`. Register PrimeVue globally in
`main.ts` using the Aura preset customized to the orange/amber palette:
`--p-primary-*` maps to the orange scale (500 = #f97316, 400 = #fb923c hover),
`--p-surface-*` maps to warm whites/grays. Create `src/assets/tokens.css`
defining all CSS custom properties (primary, accent, success, warning, danger,
neutral shades, background, surface, text, border-radius scale, shadow scale).
Load Inter from Google Fonts CDN in `index.html` with `display=swap`. Apply
Inter globally in `App.vue`, replacing `system-ui`.

Acceptance criteria:
- PrimeVue v4 + `@primevue/themes` installed and registered globally in `main.ts`
- Aura preset customized: primary = orange (#f97316), hover = #fb923c
- `src/assets/tokens.css` created with full custom property set
- Inter font loaded in `index.html` via Google Fonts with `display=swap`
- Inter applied globally in `App.vue`
- `npm run build` passes with no TypeScript errors
- No visual regressions — existing components still render

PRD context: docs/STYLE_IMPLEMENTATIONS_2/PRD.md

Instructions:
1. Create branch issue/33 from main
2. Run `/tdd` — stop when tests and build pass cleanly
3. Open a PR to main titled: feat(design): foundation — design tokens, PrimeVue setup, Inter font
4. Include "Closes #33" in the PR body
```

---

## Wave 2 — #34, #35, #36, #37, #38 (run all in parallel)

**Prerequisite:** #33 merged

### #34: Core component restyling

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #34.

Branch: issue/34  |  PR target: main

== ISSUE: feat(design): core component restyling with orange/amber tokens ==

What to build:
Restyle all existing views and components to consume the CSS custom properties
introduced in #33. Replace plain `<button>` elements with PrimeVue `Button`
and plain `<input>` elements with PrimeVue `InputText`.

Components to restyle:
- `BottomNav`: bold active indicator using orange accent; active label/icon bold
- `TopicTile`: elevated card shadow; orange accent on mastery score
- `ProgressBar`: orange fill, rounded track
- `HeatmapGrid`: intensity gradient using orange scale
- `InstallBanner`: consistent with new palette
- All views: HomeView, TopicsView, TopicDetailView, StudyView, SessionView,
  SessionReviewView, StatsView, SettingsView — replace all hardcoded color
  values with CSS custom property references

Acceptance criteria:
- All hardcoded colors (#6366f1, #ccc, #e5e7eb, #1a73e8, etc.) replaced with
  var(--*) references
- PrimeVue `Button` replaces plain `<button>` throughout
- PrimeVue `InputText` replaces plain `<input>` in SettingsView
- BottomNav active indicator uses orange accent
- TopicTile has elevated shadow and orange mastery score
- ProgressBar renders with orange fill and rounded track
- HeatmapGrid uses orange-scale intensity gradient
- All touch targets ≥44px height on mobile
- Consistent border-radius and shadow language across cards and buttons
- `npm run build` and `npm run test` pass

PRD context: docs/STYLE_IMPLEMENTATIONS_2/PRD.md

Instructions:
1. Create branch issue/34 from main (ensure #33 is merged first)
2. Run `/tdd` — stop when tests and build pass cleanly
3. Open a PR to main titled: feat(design): core component restyling with orange/amber tokens
4. Include "Closes #34" in the PR body
```

---

### #35: Skeleton loaders + Toast notifications

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #35.

Branch: issue/35  |  PR target: main

== ISSUE: feat(design): skeleton loaders + toast notifications for AI generation ==

What to build:
Replace blank loading states during AI question generation with PrimeVue
`Skeleton` components shaped like a `QuestionCard` (1 title block + 4
option-sized blocks). Add a global PrimeVue `Toast` in `App.vue` that fires
on question generation success and on error.

Acceptance criteria:
- PrimeVue `Skeleton` renders in `StudyView` / `SessionView` while
  `isGenerating` is true
- Skeleton layout mirrors QuestionCard shape (title block + 4 option blocks)
- Skeleton disappears and real QuestionCard appears once generation resolves
- PrimeVue `Toast` placed globally in `App.vue`
- Toast fires on generation success with a confirmation message
- Toast fires on generation error with the error message
- No blank white flash visible during generation on mobile
- Unit test: skeleton present in DOM when isGenerating=true; absent when false

PRD context: docs/STYLE_IMPLEMENTATIONS_2/PRD.md

Instructions:
1. Create branch issue/35 from main (ensure #33 is merged first)
2. Run `/tdd` — stop when tests and build pass cleanly
3. Open a PR to main titled: feat(design): skeleton loaders + toast notifications for AI generation
4. Include "Closes #35" in the PR body
```

---

### #36: Empty state component

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #36.

Branch: issue/36  |  PR target: main

== ISSUE: feat(design): empty state component for topics and topic detail ==

What to build:
Build a reusable `EmptyState.vue` component accepting `icon`, `heading`,
`description`, and `ctaLabel` props. It emits a `cta` event on CTA click.
Use it in `TopicsView` when the topics list is empty and in `TopicDetailView`
when the topic has zero questions. Style the CTA using PrimeVue `Button`
with the orange palette.

Acceptance criteria:
- `EmptyState` renders icon, heading, description, and CTA button from props
- CTA button emits `cta` event on click
- `TopicsView` shows EmptyState when topics list is empty
- `TopicDetailView` shows EmptyState when topic has no questions
- CTA styled with orange/amber PrimeVue Button
- Unit test: all props render; `cta` emitted on click; no EmptyState shown
  when list is non-empty

PRD context: docs/STYLE_IMPLEMENTATIONS_2/PRD.md

Instructions:
1. Create branch issue/36 from main (ensure #33 is merged first)
2. Run `/tdd` — stop when tests and build pass cleanly
3. Open a PR to main titled: feat(design): empty state component for topics and topic detail
4. Include "Closes #36" in the PR body
```

---

### #37: Answer feedback animations

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #37.

Branch: issue/37  |  PR target: main

== ISSUE: feat(design): answer feedback animations on QuestionCard ==

What to build:
Enhance `QuestionCard` with CSS keyframe animations on answer selection.
Correct answer: green scale/pulse keyframe on the selected option.
Incorrect answer: red horizontal shake keyframe on selected option + green
highlight on the correct option. Add visual emphasis to `SessionReviewView`
for high-score (≥80%) sessions. All animations must respect
`prefers-reduced-motion`.

Acceptance criteria:
- Correct selection: selected option plays green scale/pulse animation
- Incorrect selection: selected option plays red shake animation
- Incorrect selection: correct option highlighted green after answer
- No animation plays before any answer is selected
- `@media (prefers-reduced-motion: reduce)` disables all keyframes (instant
  state change only)
- SessionReviewView shows celebratory visual emphasis for ≥80% score sessions
- Unit test: `--correct` class on correct option after selection; `--incorrect`
  on wrong option; no feedback class present before selection

PRD context: docs/STYLE_IMPLEMENTATIONS_2/PRD.md

Instructions:
1. Create branch issue/37 from main (ensure #33 is merged first)
2. Run `/tdd` — stop when tests and build pass cleanly
3. Open a PR to main titled: feat(design): answer feedback animations on QuestionCard
4. Include "Closes #37" in the PR body
```

---

### #38: View transitions and micro-interactions

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #38.

Branch: issue/38  |  PR target: main

== ISSUE: feat(design): view transitions and micro-interactions ==

What to build:
Add a Vue `<Transition>` wrapper around `<RouterView>` in `App.vue` with a
slide-fade animation on route changes. Add CSS micro-interactions:
- Buttons: `transform: scale(0.97)` on `:active`
- TopicTile cards: `translateY(-2px)` + increased shadow on `:hover` /
  `:focus-visible`
- BottomNav active icon: spring-like scale animation

All transitions must respect `prefers-reduced-motion`.

Acceptance criteria:
- Vue `<Transition>` wraps RouterView in App.vue with slide-fade animation
- Buttons scale down (0.97) on press
- TopicTile lifts and shadow deepens on hover/focus
- BottomNav active icon has scale spring on activation
- `@media (prefers-reduced-motion: reduce)` disables all transitions
- `npm run build` and `npm run test` pass

PRD context: docs/STYLE_IMPLEMENTATIONS_2/PRD.md

Instructions:
1. Create branch issue/38 from main (ensure #33 is merged first)
2. Run `/tdd` — stop when tests and build pass cleanly
3. Open a PR to main titled: feat(design): view transitions and micro-interactions
4. Include "Closes #38" in the PR body
```

---

## Quick reference

| Wave | Paste N prompts | Merge PRs | Then |
|------|----------------|-----------|------|
| 1 | 1 | #33 | → wave 2 |
| 2 | 5 simultaneously | #34, #35, #36, #37, #38 | done |
