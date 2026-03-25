# Question Library

## Problem Statement

The app ships with a fixed seed question bank of ~200 AWS SAA-C03 questions and supports AI-generated questions via the Anthropic API. However, the user does not have an API key and does not want to pay for one. The in-app generation feature is therefore inaccessible, leaving the question bank static and limited. There is no way to expand, correct, or manage questions once the app is installed — questions cannot be added, edited, or deleted through any UI.

## Solution

A dedicated **Library** tab in the bottom navigation bar that gives the user full control over their question bank:

- Browse all questions with filtering by AWS topic
- Add individual questions via a manual input form
- Bulk-import questions from a JSON or CSV file (generated externally, e.g. via Claude.ai)
- Edit any existing question's fields
- Delete questions individually

The remote database and in-app AI generation remain out of scope. All data continues to live in local IndexedDB (Dexie). The user generates question content externally using their Claude.ai subscription and imports it into the app.

## User Stories

1. As a student, I want a Library tab in the bottom navigation, so that I can access question management without leaving the main app flow.
2. As a student, I want to see a list of all questions in my bank, so that I can understand what content I have available.
3. As a student, I want to filter the question list by AWS topic, so that I can quickly find questions relevant to a specific domain.
4. As a student, I want to see each question's topic, text (truncated), and question count per topic, so that I can assess coverage at a glance.
5. As a student, I want to tap a question in the list to open it in an edit form, so that I can correct mistakes or improve wording.
6. As a student, I want to edit any field of a question (topic, text, options, correct answer, explanation), so that I can fix errors in seed or imported questions.
7. As a student, I want to delete a question from the list, so that I can remove duplicates or low-quality questions.
8. As a student, I want a confirmation step before deleting a question, so that I don't accidentally lose data.
9. As a student, I want an "Add question" button that opens a blank form, so that I can manually author new questions one at a time.
10. As a student, I want the add form to have a topic dropdown populated from existing topics, so that I don't mistype topic identifiers.
11. As a student, I want the add form to have a text area for the question, four option inputs, a correct-answer selector, and an explanation field, so that every required field is captured.
12. As a student, I want form validation to prevent saving incomplete questions, so that malformed questions don't break the study flow.
13. As a student, I want an "Import" action in the Library, so that I can bulk-add questions I generated outside the app.
14. As a student, I want to paste a JSON array of questions into the import dialog, so that I can quickly import questions copied from Claude.ai.
15. As a student, I want to upload a CSV file in the import dialog, so that I can import questions from a spreadsheet.
16. As a student, I want the import dialog to show me how many valid questions were found before I confirm, so that I can catch formatting errors early.
17. As a student, I want invalid rows/items in an import to be reported with a clear error message, so that I know exactly what to fix.
18. As a student, I want successfully imported questions to appear in my question list immediately, so that I can verify the import worked.
19. As a student, I want imported questions to be tagged as `source: 'generated'`, so that they are treated the same as API-generated questions by the study engine.
20. As a student, I want the Library to show a total question count and a per-topic breakdown, so that I can track my bank size over time.

## Implementation Decisions

### Modules

**LibraryView**
- New top-level route at `/library`, accessible from the bottom nav.
- Loads all questions from `db.questions` on mount; re-loads after any mutation.
- Maintains a local reactive filter (selected topic) to display a filtered subset.
- Renders a scrollable list of question cards with topic badge, truncated text, edit button, and delete button.
- Hosts the import dialog as a child component (toggled via a local boolean).
- Header contains "Add" and "Import" action buttons.

**QuestionFormView**
- Shared view for both add (`/library/new`) and edit (`/library/:id/edit`) modes.
- Detects mode from the presence of the `:id` route param.
- In edit mode: loads the question by ID from `db.questions.get(id)` on mount.
- In add mode: starts with a blank form state.
- Topic field: dropdown populated by `db.topics.toArray()` on mount.
- Options: four separate input fields (A–D); correct answer chosen via radio button group.
- On save: calls `db.questions.add` (add mode) or `db.questions.update` (edit mode), then navigates back to `/library`.
- Cancel navigates back without saving.

**ImportDialog**
- Modal/dialog component rendered inside LibraryView.
- Tab toggle between JSON and CSV modes.
- JSON mode: multiline textarea; on parse, validates each item against the `Question` shape (`topicId`, `text`, `options: string[]` of length 4, `correctIndex: number`, `explanation: string`).
- CSV mode: file input (`.csv`); columns `topicId,text,option1,option2,option3,option4,correctIndex,explanation`; parsed client-side.
- Pre-import preview: shows count of valid rows and count of invalid rows with error details.
- On confirm: bulk-inserts valid rows via `db.questions.bulkAdd`, enriching each with `source: 'generated'`, `errorCount: 0`, `lastSeenAt: null`, `createdAt: Date.now()`.
- Shows a success toast (PrimeVue Toast) after import.

### Routing
- `/library` → LibraryView (lazy-loaded)
- `/library/new` → QuestionFormView (lazy-loaded)
- `/library/:id/edit` → QuestionFormView (lazy-loaded)
- No nav guard needed for Library routes.

### Navigation
- BottomNav gains a fifth tab: "Library" linking to `/library`.

### Data Layer
- No schema changes to Dexie. All operations use the existing `questions` table.
- Key operations: `db.questions.toArray()`, `db.questions.get(id)`, `db.questions.add(q)`, `db.questions.update(id, changes)`, `db.questions.delete(id)`, `db.questions.bulkAdd(qs)`.
- Topic list for the dropdown sourced from `db.topics.toArray()`.

### Architecture Decisions
- No new Pinia store — Library views read/write Dexie directly (same pattern used sparingly elsewhere for one-off operations).
- CSV parsing is done with a simple client-side split (no third-party CSV library); the format is strict and controlled by the user.
- Import validation is synchronous and runs entirely in the browser before any DB write.
- Deleting a question does not cascade to sessions (session records store a snapshot of answers, not live question references).

## Testing Decisions

A good test only asserts external behavior observable through the module's public interface — not internal state or implementation details.

**ImportDialog validation logic**
- Unit-test the JSON validation function: valid input → parsed array; missing field → error; wrong `options` length → error; non-numeric `correctIndex` → error.
- Unit-test the CSV parser: valid file → parsed array matching expected shape; missing column → error row reported.

**QuestionFormView (integration)**
- Test add mode: submitting a valid form calls `db.questions.add` with the correct shape and navigates to `/library`.
- Test edit mode: form is pre-populated from DB record; submitting calls `db.questions.update` with changed fields only.
- Test validation: submitting with a missing required field does not call DB and shows an error.

**LibraryView (integration)**
- Test delete: clicking delete and confirming calls `db.questions.delete(id)` and removes the item from the rendered list.
- Test filter: selecting a topic shows only questions matching that `topicId`.

Prior art for integration tests: existing tests in `src/views/__tests__/` using a seeded in-memory Dexie instance (`fake-indexeddb`).

## Out of Scope

- In-app AI question generation (no API key, no in-app calls to Anthropic).
- Remote/cloud database or sync across devices.
- Bulk delete (select multiple questions and delete at once).
- Question tagging or custom categories beyond the existing `topicId` field.
- Question search by free text (filter by topic only for now).
- Import format negotiation or auto-detection (user selects JSON or CSV explicitly).
- Export questions from the app to a file.
- Question deduplication on import.
- Reordering questions manually.
- Pagination or virtual scrolling (acceptable for a personal question bank of a few hundred questions).

## Further Notes

- The expected JSON import shape matches the existing seed format exactly, making it easy for users to generate compatible output by sharing the seed structure with Claude.ai as a reference.
- CSV column order is fixed (`topicId,text,option1,option2,option3,option4,correctIndex,explanation`) and should be documented in the import dialog's placeholder/helper text so users know how to format their spreadsheet.
- The `correctIndex` field is zero-based (0 = option1, 3 = option4); this should be made explicit in the import UI to avoid off-by-one errors.
- Deleting seed questions is allowed — there is no protection on `source: 'seed'` records. If the user deletes all questions for a topic, that topic will simply return zero questions in study sessions.
