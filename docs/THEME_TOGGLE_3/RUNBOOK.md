# RUNBOOK: Theme Toggle Execution

Drives both GitHub issues via dependency-ordered waves. Each wave spawns
isolated agents that implement features using `/tdd`, then open PRs for review.

**Rule:** Merge all PRs in wave N before starting wave N+1.

---

## Dependency Wave Map

| Wave | Issues | Parallel | Blocked by |
|------|--------|----------|------------|
| 1 | #52 | — | — |
| 2 | #53 | — | #52 |

---

## How to use

1. Copy a prompt block below
2. Paste into your Claude Code session and press Enter
3. Claude spawns an isolated agent with its own git worktree
4. The agent runs `/tdd` until tests pass, then opens a PR
5. Review and merge the PR, then move to the next wave

---

## Wave 1 — #52: Theme switching engine

**Prerequisite:** None

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #52.

Branch: issue/52  |  PR target: main

== ISSUE: feat(theme): theme switching engine — tokens, store, App.vue wiring ==

What to build:
Update `tokens.css` to support manual theme overrides via a `data-theme`
attribute on `<html>`. Extend `settingsStore` with a `theme` preference
and wire `App.vue` to reactively apply it.

Changes required:
- Add `ThemePreference = 'light' | 'dark' | 'auto'` to `src/types/index.ts`
- Update `tokens.css` dark block:
    @media (prefers-color-scheme: dark) {
      :root:not([data-theme='light']) { /* existing dark token overrides */ }
    }
    [data-theme='dark'] { /* same dark token overrides */ }
- Add `theme` ref (default 'auto') and `saveTheme(value: ThemePreference)`
  to `settingsStore`; persist to `db.settings` key 'theme'
- Update `settingsStore.loadFromDB()` to hydrate the `theme` ref
- Add `watchEffect` in `App.vue` that sets/removes
  `document.documentElement.dataset.theme` based on `settingsStore.theme`

Acceptance criteria:
- `ThemePreference` type exported from `src/types/index.ts`
- `tokens.css` dark tokens apply under both `[data-theme='dark']` and
  `@media (prefers-color-scheme: dark)` without duplication
- `[data-theme='light']` on `<html>` forces light tokens even when OS is dark
- `settingsStore` exposes `theme` ref and `saveTheme()` action
- `loadFromDB()` hydrates `theme` from the `'theme'` settings key
- `App.vue` watchEffect syncs store → `document.documentElement.dataset.theme`
- `npm run build` and `npm run test` pass

PRD context: docs/THEME_TOGGLE_3/PRD.md

Instructions:
1. Create branch issue/52 from main
2. Run `/tdd` — stop when tests and build pass cleanly
3. Open a PR to main titled: feat(theme): theme switching engine — tokens, store, App.vue wiring
4. Include "Closes #52" in the PR body
```

---

## Wave 2 — #53: Appearance UI in SettingsView

**Prerequisite:** #52 merged

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #53.

Branch: issue/53  |  PR target: main

== ISSUE: feat(theme): appearance UI in SettingsView — Light / Auto / Dark segmented control ==

What to build:
Add an "Appearance" section to `SettingsView` with a PrimeVue `ButtonGroup`
segmented control (Light | Auto | Dark). Clicking a button applies and
persists the theme immediately — no Save button required.

Changes required:
- Add "Appearance" section above the API Key section in `SettingsView`
- Use PrimeVue `ButtonGroup` + `Button` with `:outlined="theme !== value"`
  pattern (same as Mode group in `StudyView`)
- On click: call `settingsStore.saveTheme(value)` immediately
- Initialise selected state from `settingsStore.theme` on mount

Acceptance criteria:
- "Appearance" section visible in SettingsView with Light / Auto / Dark buttons
- Active option renders filled; inactive options are outlined
- Clicking any option applies the theme instantly (no Save button)
- Selected state is correctly initialised from persisted store value on mount
- Unit test: each of the 3 buttons sets the correct theme value
- `npm run build` and `npm run test` pass

PRD context: docs/THEME_TOGGLE_3/PRD.md

Instructions:
1. Create branch issue/53 from main (ensure #52 is merged first)
2. Run `/tdd` — stop when tests and build pass cleanly
3. Open a PR to main titled: feat(theme): appearance UI in SettingsView — Light / Auto / Dark segmented control
4. Include "Closes #53" in the PR body
```

---

## Quick reference

| Wave | Paste N prompts | Merge PRs | Then |
|------|----------------|-----------|------|
| 1 | 1 | #52 | → wave 2 |
| 2 | 1 | #53 | done |
