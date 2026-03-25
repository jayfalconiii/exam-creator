# RUNBOOK: Question Library — Issue Wave Execution

Drives all 6 GitHub issues via dependency-ordered waves. Each wave spawns
isolated agents that implement features, then open PRs for review.

**Rule:** Merge all PRs in wave N before starting wave N+1.

---

## Dependency Wave Map

| Wave | Issues | Parallel | Blocked by |
|------|--------|----------|------------|
| 1 | #60 | — | — |
| 2 | #61, #62, #64 | ✓ | #60 |
| 3 | #63, #65 | ✓ | #62, #64 (respectively) |

---

## How to use

1. Copy a prompt block below
2. Paste into your Claude Code session and press Enter
3. Claude spawns an isolated agent with its own git worktree
4. The agent implements the feature and opens a PR
5. Review and merge the PR, then move to the next wave

---

## Wave 1 — #60: Library tab scaffolding and question list

**Prerequisite:** None

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #60.

Branch: issue/60  |  PR target: main

== ISSUE: feat(library): library tab scaffolding and question list with topic filter ==

What to build:
Add a "Library" tab to BottomNav.vue linking to /library. Add the /library
route (lazy-loaded) to the router. Create LibraryView.vue at /library.

LibraryView:
- Page layout: <main class="library-view">, <header class="library-view__header"><h1>Library</h1></header>
- BEM + SCSS with nesting, CSS custom properties (--color-*, --space-*, --radius-*)
- Load all questions from db.questions on mount using a ref + onMounted
- Load all topics from db.topics on mount for the filter chips
- Topic filter chips above the list; selecting one filters the visible questions
- "All" chip selected by default (shows everything)
- Each question card shows: topic badge (topicId), truncated question text (max 2 lines), Edit button (navigates to /library/:id/edit), Delete button (placeholder, just logs for now)
- Header shows total question count and per-topic count in a subtitle
- Empty state message when no questions match the active filter
- "Add question" button in header navigating to /library/new (placeholder route is fine)
- "Import" button in header (placeholder, does nothing yet)

Acceptance criteria:
- Bottom nav has a "Library" tab that navigates to /library
- LibraryView renders all questions on load
- Selecting a topic chip filters the list to that topic only
- "All" chip resets the filter
- Each question card shows topic badge and truncated text
- Edit button on each card navigates to /library/:id/edit
- Total question count visible in the view
- Empty state shown when filter yields no results
- No TypeScript errors

PRD context: docs/QUESTION_LIBRARY_04/PRD.md

Instructions:
1. Create branch issue/60 from main
2. Implement the feature following the code patterns in the existing views (BEM, SCSS nesting, PrimeVue components, @/ path aliases, TypeScript)
3. Open a PR to main titled: feat(library): library tab scaffolding and question list with topic filter
4. Include "Closes #60" in the PR body
```

---

## Wave 2 — #61, #62, #64 (run in parallel)

**Prerequisite:** #60 merged

### #61: Delete question with confirmation

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #61.

Branch: issue/61  |  PR target: main

== ISSUE: feat(library): delete question with confirmation ==

What to build:
Wire up the Delete button on each question card in LibraryView.
Use PrimeVue ConfirmDialog (or a simple Dialog) to ask for confirmation before
deleting. On confirm: call db.questions.delete(id), remove the item from the
local reactive list, show a success toast via useToast(). On cancel: do nothing.

Acceptance criteria:
- Delete button on each question card opens a confirmation dialog
- Confirming calls db.questions.delete(id) and removes the card from the list
- Cancelling the dialog leaves the question untouched
- Success toast shown after deletion
- No TypeScript errors

PRD context: docs/QUESTION_LIBRARY_04/PRD.md

Instructions:
1. Create branch issue/61 from main (ensure #60 is merged first)
2. Implement following existing patterns (BEM, SCSS, PrimeVue, TypeScript)
3. Open a PR to main titled: feat(library): delete question with confirmation
4. Include "Closes #61" in the PR body
```

### #62: Add question form

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #62.

Branch: issue/62  |  PR target: main

== ISSUE: feat(library): add question form ==

What to build:
Create QuestionFormView.vue used for add mode at /library/new.
Wire the "Add question" header button in LibraryView to navigate to /library/new.
Add the /library/new route (lazy-loaded) to the router.

QuestionFormView (add mode):
- Page layout: <main class="question-form-view">, header with back button + "New Question" title
- Topic: PrimeVue Select (dropdown), options loaded from db.topics.toArray() on mount, display topic name, value is topicId
- Question text: PrimeVue Textarea (autoResize)
- Options A–D: four InputText fields labeled A, B, C, D
- Correct answer: PrimeVue RadioButton group, one per option (A/B/C/D)
- Explanation: PrimeVue Textarea (autoResize)
- Save button: validates all fields non-empty, inserts via db.questions.add({
    topicId, text, options: [optA, optB, optC, optD],
    correctIndex, explanation,
    source: 'generated', errorCount: 0, lastSeenAt: null, createdAt: Date.now()
  }), navigates back to /library
- Cancel button: navigates back to /library without saving
- Show inline validation errors on required fields if Save is attempted with empty fields

Acceptance criteria:
- /library/new renders the blank form
- Topic dropdown populated from db.topics
- All fields present and correctly typed
- Submitting with any empty field shows validation error, does not write to DB
- Valid submission inserts question and navigates to /library
- New question visible in LibraryView after return
- Cancel returns to /library without inserting
- No TypeScript errors

PRD context: docs/QUESTION_LIBRARY_04/PRD.md

Instructions:
1. Create branch issue/62 from main (ensure #60 is merged first)
2. Implement following existing patterns (BEM, SCSS, PrimeVue, TypeScript)
3. Open a PR to main titled: feat(library): add question form
4. Include "Closes #62" in the PR body
```

### #64: JSON import via paste dialog

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #64.

Branch: issue/64  |  PR target: main

== ISSUE: feat(library): JSON import via paste dialog ==

What to build:
Wire up the "Import" button in LibraryView to open a PrimeVue Dialog.
The dialog has a JSON tab (CSV tab comes in the next issue — leave a tab
placeholder or a toggle for it, but only implement JSON for now).

JSON import flow:
1. User pastes a JSON array into a Textarea
2. "Preview" button (or auto-preview on paste) parses and validates the JSON
3. Validation rules per item:
   - topicId: non-empty string
   - text: non-empty string
   - options: array of exactly 4 non-empty strings
   - correctIndex: integer 0–3
   - explanation: non-empty string
4. Show a preview summary: "X valid questions, Y invalid" with error details
   (item index + which field failed) for invalid items
5. "Import X questions" confirm button: calls db.questions.bulkAdd on valid items,
   enriching each with source: 'generated', errorCount: 0, lastSeenAt: null,
   createdAt: Date.now()
6. On success: close dialog, reload question list, show success toast
7. If 0 valid items: confirm button is disabled, show error message

Helper text in dialog should show the expected JSON shape:
[{ "topicId": "ec2", "text": "...", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "..." }]

Acceptance criteria:
- "Import" button opens the dialog
- Pasting valid JSON shows correct preview count
- Pasting JSON with invalid items shows per-item error details
- Confirming inserts only valid items into DB
- Questions appear in LibraryView after import without page reload
- Success toast shows number of questions imported
- Pasting an empty string or invalid JSON shows a parse error
- Import button disabled when 0 valid items
- No TypeScript errors

PRD context: docs/QUESTION_LIBRARY_04/PRD.md

Instructions:
1. Create branch issue/64 from main (ensure #60 is merged first)
2. Implement following existing patterns (BEM, SCSS, PrimeVue, TypeScript)
3. Open a PR to main titled: feat(library): JSON import via paste dialog
4. Include "Closes #64" in the PR body
```

---

## Wave 3 — #63, #65 (run in parallel)

**Prerequisite:** #62 merged (for #63), #64 merged (for #65)

### #63: Edit existing question

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #63.

Branch: issue/63  |  PR target: main

== ISSUE: feat(library): edit existing question ==

What to build:
Extend QuestionFormView.vue to support edit mode at /library/:id/edit.
Add the /library/:id/edit route (lazy-loaded) to the router.
Wire the Edit button on each question card in LibraryView to navigate to
/library/:id/edit.

Edit mode behavior:
- Detect edit mode from useRoute().params.id being present
- On mount: load question via db.questions.get(Number(id)) and pre-populate all form fields
- If the question ID does not exist, navigate back to /library and show an error toast
- Save: call db.questions.update(id, { topicId, text, options, correctIndex, explanation }),
  navigate back to /library
- Page title in header: "Edit Question"
- Same validation as add mode — all fields required

Acceptance criteria:
- Edit button on each card in LibraryView navigates to /library/:id/edit
- All form fields pre-populated with existing question data
- Saving writes updated values to DB and navigates to /library
- Updated question reflected in LibraryView on return
- Invalid id redirects to /library with error toast
- Cancel returns to /library without saving
- No TypeScript errors

PRD context: docs/QUESTION_LIBRARY_04/PRD.md

Instructions:
1. Create branch issue/63 from main (ensure #62 is merged first)
2. Implement following existing patterns (BEM, SCSS, PrimeVue, TypeScript)
3. Open a PR to main titled: feat(library): edit existing question
4. Include "Closes #63" in the PR body
```

### #65: CSV import via file upload

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #65.

Branch: issue/65  |  PR target: main

== ISSUE: feat(library): CSV import via file upload ==

What to build:
Extend the import dialog from #64 with a CSV tab (second tab alongside the
existing JSON tab).

CSV format (fixed column order, header row required):
topicId,text,option1,option2,option3,option4,correctIndex,explanation

CSV import flow:
1. File input accepting .csv files only
2. On file selection: read file client-side (FileReader), parse rows manually
   (split by newline, split by comma — assume no embedded commas/quotes for now)
3. Skip the header row; parse each data row into the Question shape
4. Apply the same validation rules as JSON import
5. Show same preview summary (valid count, invalid rows with row number + error)
6. On confirm: db.questions.bulkAdd with same runtime fields
7. Show success toast

Helper text in the CSV tab:
- Expected columns: topicId,text,option1,option2,option3,option4,correctIndex,explanation
- correctIndex is zero-based (0 = option1, 3 = option4)

Acceptance criteria:
- Import dialog has a CSV tab alongside JSON tab
- File input accepts only .csv files
- Valid CSV produces correct preview count
- Invalid rows reported with row number and field that failed
- Confirming inserts valid rows into DB
- Success toast shows number imported
- Helper text explains column order and zero-based correctIndex
- No TypeScript errors

PRD context: docs/QUESTION_LIBRARY_04/PRD.md

Instructions:
1. Create branch issue/65 from main (ensure #64 is merged first)
2. Implement following existing patterns (BEM, SCSS, PrimeVue, TypeScript)
3. Open a PR to main titled: feat(library): CSV import via file upload
4. Include "Closes #65" in the PR body
```

---

## Quick reference

| Wave | Paste N prompts | Merge PRs | Then |
|------|----------------|-----------|------|
| 1 | 1 | #60 | → wave 2 |
| 2 | 3 simultaneously | #61, #62, #64 | → wave 3 |
| 3 | 2 simultaneously | #63, #65 | done |
