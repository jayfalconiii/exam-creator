# RUNBOOK: UX Enhancements — Issue Wave Execution

All three issues are independent. Run them in parallel as a single wave.

**Rule:** All three PRs can be opened and merged independently in any order.

---

## Dependency Wave Map

| Wave | Issues | Parallel | Blocked by |
|------|--------|----------|------------|
| 1 | #77, #78, #79 | ✓ | — |

---

## Wave 1 — #77, #78, #79 (run in parallel)

**Prerequisite:** None

### #77: Duplicate question detection

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #77.

Branch: issue/77  |  PR target: main

== ISSUE: feat(library): duplicate question detection ==

What to build:
Add fuzzy duplicate detection to LibraryView.

Duplicate algorithm:
- Implement a Dice coefficient function on normalised text (lowercase, trimmed, split into bigrams)
- Compare all question pairs within the same topicId
- Threshold: similarity >= 0.70 → both questions are duplicates
- Output: a computed Set<number> of question IDs that have at least one duplicate partner

LibraryView changes:
- Add a "Duplicates" chip in the filter row (alongside All + topic chips)
- Selecting it sets activeFilter to a special 'duplicates' sentinel
- filteredQuestions returns only questions whose id is in the duplicate set
- Each card shows a small "Duplicate" badge when its id is in the duplicate set
- The chip only appears when the duplicate set is non-empty
- The duplicate set recomputes automatically (computed) so badges/chip disappear as duplicates are deleted

Acceptance criteria:
- "Duplicates" chip appears when at least one duplicate pair exists
- Selecting chip filters list to duplicate questions only
- Each card in filtered view shows "Duplicate" badge
- Chip and badges disappear once all duplicates resolved
- Only matches within same topicId
- 70% Dice coefficient threshold on normalised text
- No TypeScript errors

PRD context: docs/UX_ENHANCEMENTS_05/PRD.md

Instructions:
1. Create branch issue/77 from main
2. Implement following existing patterns (BEM, SCSS nesting, CSS custom properties, TypeScript)
3. Open a PR to main titled: feat(library): duplicate question detection
4. Include "Closes #77" in the PR body
```

### #78: Swipe-to-delete on question cards

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #78.

Branch: issue/78  |  PR target: main

== ISSUE: feat(library): swipe-to-delete on question cards ==

What to build:
Add iOS-style swipe-left gesture to question cards in LibraryView.

Gesture behaviour:
- Listen to touchstart, touchmove, touchend on each card
- Only register as a horizontal swipe if horizontal delta >= 2x vertical delta (prevents scroll conflicts)
- Translate the card left up to 80px using CSS transform: translateX()
- Snap threshold: 40px — release past this snaps fully open, below snaps closed
- Use CSS transition for smooth animation (skip transition when prefers-reduced-motion)
- A shared openSwipeId ref tracks which card is open; opening a new one closes the previous
- Swiping right on an open card closes it

Behind the card:
- A red Delete button is revealed in the 80px gap
- Tapping it calls the existing handleDelete(question) function (confirmation dialog flow)

Acceptance criteria:
- Swipe left reveals Delete button
- Release below 40px snaps back; past 40px snaps open
- Swiping second card closes first
- Swiping right closes open card
- Delete button triggers existing confirmation dialog
- Confirming deletes question and removes card
- Respects prefers-reduced-motion (instant snap)
- No TypeScript errors

PRD context: docs/UX_ENHANCEMENTS_05/PRD.md

Instructions:
1. Create branch issue/78 from main
2. Implement following existing patterns (BEM, SCSS nesting, CSS custom properties, TypeScript)
3. Open a PR to main titled: feat(library): swipe-to-delete on question cards
4. Include "Closes #78" in the PR body
```

### #79: Swipe-to-delete on session rows

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #79.

Branch: issue/79  |  PR target: main

== ISSUE: feat(stats): swipe-to-delete on session rows ==

What to build:
Add iOS-style swipe-left gesture to session rows in StatsView.

Gesture behaviour (same pattern as #78):
- touchstart / touchmove / touchend on each session row
- Horizontal delta >= 2x vertical delta gate
- Translate row left up to 80px, snap at 40px threshold
- CSS transition for animation; skip if prefers-reduced-motion
- Shared openSwipeId ref — one row open at a time

Behind the row:
- A red Delete button revealed in the 80px gap
- Tapping it opens a PrimeVue ConfirmDialog (useConfirm().require(...))
- On confirm: db.sessions.delete(session.id), filter session from sessions ref
- totalQuestions and overallPct are already computed — they update automatically

Acceptance criteria:
- Swipe left reveals Delete button
- Release below threshold snaps back; past threshold snaps open
- Swiping second row closes first
- Delete button triggers confirmation dialog
- Confirming removes session from DB and list
- Overall stats update immediately (Sessions count, Questions, Correct %)
- Respects prefers-reduced-motion
- No TypeScript errors

PRD context: docs/UX_ENHANCEMENTS_05/PRD.md

Instructions:
1. Create branch issue/79 from main
2. Implement following existing patterns (BEM, SCSS nesting, CSS custom properties, TypeScript)
3. Open a PR to main titled: feat(stats): swipe-to-delete on session rows
4. Include "Closes #79" in the PR body
```

---

## Quick reference

| Wave | Paste N prompts | Merge PRs | Then |
|------|----------------|-----------|------|
| 1 | 3 simultaneously | #77, #78, #79 | done |
