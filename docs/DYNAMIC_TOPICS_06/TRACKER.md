# Dynamic Topics — Issue Tracker

Parent PRD: #87 | `docs/DYNAMIC_TOPICS_06/PRD.md`

## Issues

| # | Title | Type | Blocked by | Status |
|---|-------|------|------------|--------|
| [#88](https://github.com/jayfalconiii/exam-creator/issues/88) | feat(db): add color field to topics + migrate existing topic colors | AFK | — | Open |
| [#89](https://github.com/jayfalconiii/exam-creator/issues/89) | refactor(db): inline seed data into seed.ts, remove TOPIC_DEFINITIONS | AFK | — | Open |
| [#90](https://github.com/jayfalconiii/exam-creator/issues/90) | refactor(topics): remove COLOR_MAP from TopicTile, read topic.color from DB | AFK | #88 | Open |
| [#91](https://github.com/jayfalconiii/exam-creator/issues/91) | feat(study): switch topic chips to DB-driven list | AFK | #88, #89 | Open |
| [#92](https://github.com/jayfalconiii/exam-creator/issues/92) | feat(library): create new topic inline when adding a question | AFK | #88, #89 | Open |
| [#93](https://github.com/jayfalconiii/exam-creator/issues/93) | feat(library): auto-create topics on CSV/JSON import for unknown topicIds | AFK | #88, #89 | Open |
| [#94](https://github.com/jayfalconiii/exam-creator/issues/94) | feat(topics): delete topic with cascade from topic detail page | AFK | #88, #89 | Open |

## Wave Plan

**Wave 0 (no blockers — run in parallel):**
- #88 DB migration + color field
- #89 Seed refactor

**Wave 1 (after wave 0 merges — run in parallel):**
- #90 TopicTile refactor
- #91 StudyView DB-driven chips
- #92 Inline topic creation in QuestionFormView
- #93 Import auto-create topics
- #94 Topic deletion from detail page
