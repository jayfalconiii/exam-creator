# Dynamic Topics

## Problem Statement

Topics are currently hardcoded as a static list in the codebase. Adding a new question with a topic that doesn't exist in that list requires a code change and redeployment. There is no way for a user to create new topics through the UI, and the topic filter chips in the Study and Library views only reflect the hardcoded list — meaning new topics never appear there automatically.

## Solution

Make the topic system fully DB-driven. Topics will live exclusively in the database. Users can create new topics on the fly when adding questions, and the app will auto-create topics when importing questions that reference unknown topic IDs. All UI views that display topic chips or tiles will read from the DB. Topics can also be deleted (along with their associated questions) from the topic detail page.

## User Stories

1. As a user, I want to create a new topic when adding a question, so that I'm not limited to a predefined list.
2. As a user, I want to type a topic name and have the topic ID auto-generated from it, so that I don't have to manually maintain IDs.
3. As a user, I want new topics to be assigned a color automatically, so that they appear consistently styled in the heatmap and chips without extra effort.
4. As a user, I want the topic I'm creating to only be saved when I save the question, so that I don't accidentally create orphan topics.
5. As a user, I want to see all my topics (including newly created ones) as filter chips in the Library view, so that I can filter questions by any topic I've added.
6. As a user, I want to see all my topics as filter chips in the Study view, so that I can include any topic in a study session.
7. As a user, I want newly created topics to appear as tiles in the Topics heatmap view immediately after they're created, so that I can track my progress on them.
8. As a user, I want to import questions via CSV or JSON with new topic IDs, so that I can bulk-add content for topics I haven't created yet.
9. As a user, I want to be warned during import preview about new topics that will be created, so that I'm aware of the side effects before confirming.
10. As a user, I want new topics from imports to be created automatically on confirm, so that I don't have to manually create them first.
11. As a user, I want to delete a topic from the topic detail page, so that I can clean up topics I created by mistake.
12. As a user, I want to be warned before deleting a topic that has associated questions, so that I understand that those questions will also be permanently removed.
13. As a user, I want the topic heatmap tiles to use the topic's stored color, so that colors are consistent and not dependent on a hardcoded map.
14. As a user, I want my existing 17 topics to retain their current colors after the migration, so that the visual appearance of the app doesn't change unexpectedly.
15. As a user, I want the app to upgrade my local database automatically on next load, so that I don't have to reinstall or reset anything.

## Implementation Decisions

### Database
- Add a `color` field (`string`) to the `Topic` table.
- Bump the Dexie database version and add an upgrade callback that:
  - Populates `color` for the existing 17 topics using their known hex values.
  - Leaves any other existing topics (edge cases) with a default fallback color.

### Seeding
- The static `TOPIC_DEFINITIONS` file is deleted.
- Seed data (the initial 17 topics and questions) is inlined directly into the seed script.
- Seeding still only runs once when the questions table is empty.

### Color Assignment
- A predefined palette of visually distinct colors is defined in a shared utility.
- When a new topic is created, a color is picked from the palette that is least used among existing topics (or randomly if all are equally used).
- The `COLOR_MAP` in `TopicTile` is removed; the tile reads `topic.color` directly from the prop.

### Topic Creation in QuestionFormView
- The topic dropdown gains a **"Create new topic"** option at the bottom.
- Selecting it reveals an inline sub-form with a single `name` text input.
- The `topicId` is auto-derived by slugifying the name (lowercase, spaces → hyphens, strip special characters).
- The new topic object is held in local component state — it is **not** written to the DB until the question is saved.
- On question save, the new topic is inserted first, then the question.

### StudyView
- Replace the import of `TOPIC_DEFINITIONS` with a DB query (`db.topics.toArray()`) loaded on mount.
- Topic chips are rendered from the live DB list.

### LibraryView
- Already reads topics from the DB — no structural change needed.
- If new topics appear after import, the topic list is refreshed.

### Import (CSV / JSON)
- During the preview step, detect any `topicId` values in the valid rows that don't exist in the DB.
- If new topics are detected, show a notice: *"X new topic(s) will be created: eks, ecs"*.
- On confirm/import: insert new topics (with auto-assigned colors and default scores) before bulk-inserting questions.

### Topic Deletion
- The topic detail page gains a **Delete Topic** button.
- On tap, if the topic has associated questions, show a confirmation dialog: *"This topic has N question(s). Deleting it will permanently remove all of them. Continue?"*
- On confirm: delete all questions with that `topicId`, then delete the topic record.
- Navigate back to the Topics view after deletion.

### TopicTile
- Remove the hardcoded `COLOR_MAP`.
- Read color from `topic.color` (passed via prop from the store).

## Testing Decisions

Good tests verify observable behavior from the outside — not internal implementation details like which function was called or how state is structured internally.

### Modules to test

- **Topic color utility**: Given a list of existing topic colors and a palette, assert that the returned color is valid, in the palette, and prefers less-used colors.
- **Slug derivation**: Given a topic name string, assert that the output is lowercase, hyphen-separated, and free of special characters.
- **Import preview — new topic detection**: Given a set of questions and a set of existing topicIds, assert that the correct set of new topicIds is surfaced in the preview.

### Out of scope for tests
- Vue component rendering (no component unit tests)
- Dexie migration correctness (manual verification is sufficient for a single-user app)

## Out of Scope

- Editing a topic's name or color after creation.
- Reordering topics.
- Grouping or categorizing topics.
- Merging duplicate topics.
- Any server-side or multi-user topic synchronization.
- The open issues #85 (topic chip colors) and #86 (timer presets) are separate and not part of this PRD.

## Further Notes

- The Dexie version bump requires no PWA reinstall — the upgrade callback runs automatically on next page load when the stored DB version is lower than the code version.
- The fallback color for any topic not in the known palette is `#78716c` (gray), matching the existing `TopicTile` fallback.
- Topic IDs derived from slugification must be unique; if a collision occurs (e.g. user creates "EKS" twice), the sub-form should show an inline validation error before the question is saved.
