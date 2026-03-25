# PRD: UX Enhancements — Duplicate Detection & Swipe-to-Delete

## Problem Statement

As the user's question library grows (especially through JSON/CSV imports), it becomes easy to accidentally accumulate near-identical questions. There is currently no way to spot duplicates without manually reading through every card. Additionally, deleting questions in the library requires tapping two small buttons (Delete → confirm), and deleting test/junk sessions from Stats requires navigating away and back. On mobile, both flows feel slow and cumbersome — a swipe gesture would be far more natural.

## Solution

Three focused UX improvements:

1. **Duplicate detection in Library** — Compute fuzzy similarity between questions sharing the same topic. Surface duplicates via a dedicated "Duplicates" filter chip and a visible badge on each affected card, so the user can review and manually delete the ones they don't want.

2. **Swipe-to-delete in Library** — iOS-style swipe-left on a question card reveals a Delete action. Tapping it triggers the existing confirmation dialog. This replaces the need to hunt for the small Delete button.

3. **Swipe-to-delete in Stats** — iOS-style swipe-left on a session row reveals a Delete action. Tapping it triggers a confirmation dialog. On confirm, the session is removed and overall stats recompute automatically.

## User Stories

1. As a student, I want to see a "Duplicates" chip in the Library filter row, so that I can quickly isolate questions that may have been imported more than once.
2. As a student, I want duplicate question cards to show a visible "Duplicate" badge, so that I can identify which specific questions are affected at a glance.
3. As a student, I want to use the existing delete flow on duplicate cards, so that I can choose which copy to keep and which to remove.
4. As a student, I want the duplicate chip to disappear (or show zero) once all duplicates have been resolved, so that I get feedback that the library is clean.
5. As a student, I want duplicates to be detected within the same topic only, so that identical-sounding questions in different topics are not incorrectly flagged.
6. As a student, I want fuzzy matching (≥ 70% text similarity) rather than exact matching, so that slightly rephrased versions of the same question are still caught.
7. As a student, I want to swipe left on a Library question card to reveal a Delete button, so that I can delete questions faster without hunting for the small action buttons.
8. As a student, I want swiping a new Library card to automatically close any previously open swipe, so that the UI doesn't get cluttered with multiple open swipe states.
9. As a student, I want the Library delete-via-swipe to still show a confirmation dialog, so that I don't accidentally delete questions.
10. As a student, I want to swipe left on a Stats session row to reveal a Delete button, so that I can remove test or junk sessions without leaving the Stats view.
11. As a student, I want swiping a new Stats row to close any previously open swipe, so that the behaviour is consistent with standard iOS-style lists.
12. As a student, I want the Stats delete-via-swipe to show a confirmation dialog, so that I don't accidentally lose session history.
13. As a student, I want the overall Stats summary (Sessions count, Questions total, Correct %) to update immediately after a session is deleted, so that the numbers always reflect my actual history.
14. As a student, I want the session row to disappear from the list after confirming deletion, so that I get immediate feedback without a page reload.
15. As a student, I want swipe gestures to feel native (smooth translate animation, snaps open/closed), so that the interaction feels polished on mobile.
16. As a student, I want to cancel a swipe by swiping back right, so that accidental swipes don't lock the card in an open state.

## Implementation Decisions

### Duplicate Detection

- **Algorithm**: Dice coefficient on normalised question text (lowercase, trimmed). Two questions within the same `topicId` are considered duplicates if their similarity score ≥ 0.70.
- **Scope**: Computed client-side on the full questions list loaded in LibraryView. No DB schema changes needed.
- **Output**: A `Set<number>` of question IDs that have at least one duplicate partner within their topic.
- **Filter chip**: Added alongside the existing topic chips in LibraryView. Selecting it sets the active filter to a special `'duplicates'` sentinel value; the filtered list then shows only questions whose ID is in the duplicate set.
- **Badge**: A small "Duplicate" label rendered on each card when it is in the duplicate set.
- **Recalculation**: The duplicate set is a `computed` derived from the full `questions` ref, so it updates automatically after any delete.

### Swipe-to-Delete (Library & Stats)

- **Gesture implementation**: Native `touchstart` / `touchmove` / `touchend` events — no third-party library.
- **Direction gate**: Only register a swipe if the horizontal delta is at least 2× the vertical delta (prevents accidental triggers while scrolling).
- **Reveal**: Card/row translates left by a fixed amount (e.g. 80px) to expose a red Delete button behind it. Uses CSS `transform: translateX()` with a `transition` for smoothness.
- **Snap behaviour**: Releasing mid-swipe snaps to fully open (if past 40px threshold) or back to closed.
- **One-open-at-a-time**: A shared `openSwipeId` ref tracks which item is currently swiped open. Opening a new one closes the previous.
- **Delete trigger**: Tapping the revealed Delete button calls the existing `handleDelete` logic (confirmation dialog → DB delete → remove from list).
- **Mouse fallback**: Not required — this is a mobile-first gesture feature. Desktop users still have the existing buttons in Library.

### Stats Schema

- No schema changes. `db.sessions.delete(id)` removes the record. The `sessions` ref is filtered in-place; `totalQuestions` and `overallPct` are already `computed` and update automatically.

### Modules to Build / Modify

- **LibraryView**: Add duplicate computation, duplicate chip, duplicate badge, swipe gesture on cards.
- **StatsView**: Add swipe gesture on session rows, confirmation dialog on delete, delete logic.
- **No new shared components required** — swipe logic is self-contained per view given the different data shapes.

## Testing Decisions

Good tests verify observable behaviour, not implementation details (no testing internal refs or private functions).

- **Duplicate detection logic**: Extract the Dice coefficient function and the "find duplicate IDs" function as pure utility functions so they can be unit-tested in isolation with known inputs/outputs.
- **LibraryView**: Test that the "Duplicates" chip appears when duplicates exist, filters the list correctly, and disappears when none remain.
- **StatsView**: Test that deleting a session removes it from the list and updates the summary stats.
- No tests required for swipe gesture mechanics (DOM event simulation for touch is brittle and low-value).

## Out of Scope

- Auto-merging or deduplicating questions automatically — the user always decides which copy to keep.
- Fuzzy matching across topics — duplicates are only detected within the same `topicId`.
- Swipe-to-edit — only delete is exposed via swipe for now.
- Mouse drag / desktop swipe gesture support.
- Bulk-delete for duplicates (select all duplicates and delete at once).
- Duplicate detection during import (prevent importing known duplicates).

## Further Notes

- The 70% Dice coefficient threshold was chosen to catch slightly rephrased imports while avoiding false positives for questions that merely share topic keywords. This value can be tuned later.
- Swipe gestures should respect `prefers-reduced-motion`: when the user has reduced motion enabled, skip the translate animation and snap instantly.
