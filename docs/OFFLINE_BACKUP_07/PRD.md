# Offline Backup & Restore

## Problem Statement

The app has no way to transfer questions or progress between devices. All data lives exclusively in the device's local IndexedDB. If a user wants to use the app on a second device, or reinstalls the app, they lose all their questions, topic scores, and per-question difficulty history. With no cloud sync, the only viable alternative is a manual export/import workflow.

## Solution

Add a full-backup export to the Settings page and enhance the existing LibraryView import to detect and restore backup files. A backup is a single versioned JSON file containing all questions (with full learning metadata) and all topic score data. On import, the app detects the backup format automatically and prompts the user to choose: questions only or questions + scores, and merge with existing data or replace it.

## User Stories

1. As a user, I want to export all my questions and topic scores to a single file from the Settings page, so that I can back up my data without needing an internet connection.
2. As a user, I want the export file to be named with today's date, so that I can identify backups by when they were created.
3. As a user, I want the exported file to include every question's text, options, answer, explanation, topic, error count, and last-seen date, so that my full learning history is preserved.
4. As a user, I want the exported file to include each topic's name, color, raw score, last reviewed date, and total sessions, so that my progress is not lost when switching devices.
5. As a user, I want to import a backup file through the same Library import screen I already use, so that I don't have to learn a separate workflow.
6. As a user, I want the app to automatically detect whether I'm importing a backup or a plain questions file, so that I'm not asked to choose the format manually.
7. As a user, I want to be asked whether to import questions only or questions + topic scores when importing a backup, so that I can decide whether to carry over my progress.
8. As a user, I want to be asked whether to merge the backup with my existing data or replace it entirely, so that I have control over how the import affects what I already have.
9. As a user who chooses "Merge", I want duplicate questions (same topic + text) to be resolved by keeping the copy with the higher error count, so that the richer learning data survives.
10. As a user who chooses "Merge", I want topics that already exist on the target device to keep their local scores, so that local progress is not overwritten by older backup data.
11. As a user who chooses "Merge", I want topics that don't exist on the target device to be created from the backup, so that all topics from the source device appear after the import.
12. As a user who chooses "Replace", I want all existing questions and topics to be removed and replaced with the backup's contents, so that the target device exactly mirrors the source.
13. As a user, I want to see a preview of what will be imported (question count, topic count) before confirming, so that I know what the file contains.
14. As a user, I want the backup format to be stable and versioned, so that future app updates can still read old backup files.

## Implementation Decisions

### Backup File Schema

```
{
  version: 1,
  questions: Question[],   // id field stripped
  topics: Topic[]          // id field stripped
}
```

- The `id` field is omitted from both arrays; the DB auto-assigns new IDs on import.
- Questions carry all learning metadata: `errorCount`, `lastSeenAt`, `createdAt`, `source`.
- Topics carry all score fields: `rawScore`, `lastReviewedAt`, `totalSessions`, plus display fields `name` and `color`.

### Export

- An "Export Backup" button is added to the Settings page.
- On click, the app reads all records from the `questions` and `topics` tables, strips `id` fields, builds the versioned JSON object, and triggers a browser file download.
- Filename format: `exam-backup-YYYY-MM-DD.json`.
- No UI blocking — export is synchronous after the DB reads resolve.

### Import Detection (LibraryView)

- The existing import flow accepts JSON. Detection: if the parsed JSON is an object with `version`, `questions`, and `topics` keys, it is treated as a backup file. If it is a plain array, it follows the existing questions-only path.
- When a backup is detected, the existing questions-only import form is bypassed and a two-step prompt is shown instead.

### Import Step 1 — Scope

User chooses one of:
- **Questions only** — topics array in the backup is ignored entirely; questions are imported using the existing validation + auto-topic-creation logic.
- **Questions + scores** — both arrays are imported; topic scores are applied according to the merge/replace choice.

### Import Step 2 — Strategy

User chooses one of:
- **Merge** — run deduplication; local data is preserved where it conflicts.
- **Replace** — clear `questions` and `topics` tables, then bulk-insert from backup.

### Merge Logic

- **Questions:** match on `(topicId, text)`. If a match exists, keep the record with the higher `errorCount`. If no match, insert as new.
- **Topics:** match on `topicId`. If a match exists, keep the local record entirely (ignore backup scores). If no match, insert the backup topic.

### Replace Logic

- `db.questions.clear()` and `db.topics.clear()` are called before bulk-inserting from the backup.
- All `id` fields are stripped before insert so Dexie assigns fresh auto-increment IDs.

### Validation

- Backup questions are validated using the same `validateItem()` function used by the existing import. Invalid rows are skipped with a warning count shown in the preview.
- Backup topics missing required fields (`topicId`, `name`, `color`) are skipped.

### Preview

- Before the confirm button is enabled, the UI shows: valid question count, invalid question count (if any), topic count in the backup, and the chosen scope + strategy.

## Testing Decisions

Good tests verify observable behavior from the outside: what ends up in the DB after an import, what file is downloaded on export, and what the UI shows at each step — not the internal helper functions used to achieve it.

### Modules to test

- **Export utility** — given a set of questions and topics, produces the correct versioned JSON shape with `id` fields stripped.
- **Backup detection** — given a plain array vs. a `{ version, questions, topics }` object, returns the correct detected type.
- **Merge logic** — given existing DB state and a backup payload, the resulting DB contains the correct records after merge (higher `errorCount` wins for questions, local wins for topics).
- **Replace logic** — after a replace import, the DB contains exactly the backup's records and nothing from before.
- **LibraryView import flow** — component-level: when a backup file is loaded, the two-step prompt is shown; when a plain JSON array is loaded, the existing preview is shown.
- **SettingsView export** — clicking "Export Backup" triggers a download with the correct filename and JSON content.

### Prior art

- Existing import validation tests in `src/views/__tests__/LibraryView.spec.ts` (if present) or the import-related logic in `LibraryView.vue` serve as the reference pattern for testing the detection and validation steps.
- `src/__tests__/db.spec.ts` for DB-level assertions.
- `src/__tests__/SettingsView.spec.ts` for the export button interaction.

## Out of Scope

- Cloud sync or real-time cross-device sharing.
- Exporting or importing session history (`sessions` table).
- Selective export (e.g. export only one topic's questions).
- Scheduled or automatic backups.
- Backup encryption.
- Importing from the existing plain CSV format as a backup (CSV remains questions-only).

## Further Notes

- The `version` field in the backup schema exists to allow future migrations. A v1 reader should reject or warn on files with an unrecognised version number rather than silently producing wrong data.
- The "Replace" path clears the entire questions and topics tables. Users should be warned clearly that this is irreversible.
- Topic auto-creation (from the Dynamic Topics feature) still applies during the "questions only" import path — if a backup question references a `topicId` not in the DB, a new topic is created with default values.
