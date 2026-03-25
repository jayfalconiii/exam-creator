# RUNBOOK: Dynamic Topics — Issue Wave Execution

Two waves. Wave 0 has no blockers and runs in parallel. Wave 1 runs after both wave 0 PRs are merged.

---

## Dependency Wave Map

| Wave | Issues | Parallel | Blocked by |
|------|--------|----------|------------|
| 0 | #88, #89 | ✓ | — |
| 1 | #90, #91, #92, #93, #94 | ✓ | #88, #89 |

---

## Wave 0 — #88, #89 (run in parallel)

**Prerequisite:** None

### #88: DB migration — add color field + migrate existing topic colors

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #88.

Branch: issue/88  |  PR target: main

== ISSUE: feat(db): add color field to topics + migrate existing topic colors ==

What to build:
Bump the Dexie database version and add a `color: string` field to the Topic schema.
Run an upgrade callback that populates `color` for the existing 17 topics using their known
hex values. Topics not in the known map receive the fallback color '#78716c'.
Also export a shared color palette utility for use by other issues when auto-assigning
colors to new topics.

Known topic colors (topicId → hex):
  ec2             → #1565c0
  s3              → #00695c
  vpc             → #6a1b9a
  iam             → #c62828
  rds             → #283593
  lambda          → #ad1457
  cloudfront      → #00838f
  route53         → #4e342e
  elb             → #2e7d32
  dynamodb        → #4527a0
  sqs-sns         → #e65100
  cloudwatch      → #37474f
  efs-fsx         → #0277bd
  glacier         → #4a148c
  kms-secrets     → #b71c1c
  trusted-advisor → #1b5e20
  storage-gateway → #0d47a1

Palette utility (src/utils/topicColors.ts):
- Export TOPIC_COLOR_PALETTE: string[] — a list of visually distinct hex colors to use for new topics
- Export function pickTopicColor(existingColors: string[]): string — picks the color from the palette
  least used among existingColors; falls back to the first palette color

Topic type change:
- Add `color: string` to the Topic interface in src/types/index.ts

DB changes (src/db/db.ts):
- Bump Dexie version (e.g. from current version to next)
- Add an upgrade() callback for the new version that iterates all topics and sets color
  using the known map above, defaulting to '#78716c'

Acceptance criteria:
- [ ] Dexie DB version is bumped
- [ ] `color: string` added to Topic type
- [ ] Upgrade callback populates color for all 17 existing topics
- [ ] Unknown topics get fallback color '#78716c'
- [ ] src/utils/topicColors.ts exported with TOPIC_COLOR_PALETTE and pickTopicColor
- [ ] No TypeScript errors
- [ ] No data loss on upgrade

PRD context: docs/DYNAMIC_TOPICS_06/PRD.md

Instructions:
1. Create branch issue/88 from main
2. Implement following existing patterns (BEM, SCSS nesting, CSS custom properties, TypeScript)
3. Open a PR to main titled: feat(db): add color field to topics + migrate existing topic colors
4. Include "Closes #88" in the PR body
5. Use the PR body format from CLAUDE.md (the emoji PR format)
```

### #89: Seed refactor — inline seed data, remove TOPIC_DEFINITIONS

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #89.

Branch: issue/89  |  PR target: main

== ISSUE: refactor(db): inline seed data into seed.ts, remove TOPIC_DEFINITIONS ==

What to build:
Delete src/data/topics.ts (the static TOPIC_DEFINITIONS export) and move the 17 topic
seed records inline into the seed script. Seeding behavior is unchanged — it only runs
once when the questions table is empty. Remove all remaining imports of TOPIC_DEFINITIONS.

The 17 topics to inline (topicId, name):
  ec2             → EC2
  s3              → S3
  vpc             → VPC
  iam             → IAM
  rds             → RDS
  lambda          → Lambda
  cloudfront      → CloudFront
  route53         → Route 53
  elb             → ELB
  dynamodb        → DynamoDB
  sqs-sns         → SQS / SNS
  cloudwatch      → CloudWatch
  efs-fsx         → EFS / FSx
  glacier         → Glacier
  kms-secrets     → KMS / Secrets Manager
  trusted-advisor → Trusted Advisor
  storage-gateway → Storage Gateway

Each seeded topic should have: rawScore: 0, lastReviewedAt: null, totalSessions: 0
(color is handled by the DB migration in #88, not the seed)

Acceptance criteria:
- [ ] src/data/topics.ts is deleted
- [ ] Seed script contains the 17 topic definitions inline
- [ ] No remaining imports of TOPIC_DEFINITIONS anywhere in the codebase
- [ ] First-time seed still inserts topics and questions correctly
- [ ] Existing users with data are unaffected (seed guard still works)
- [ ] No TypeScript errors

PRD context: docs/DYNAMIC_TOPICS_06/PRD.md

Instructions:
1. Create branch issue/89 from main
2. Implement following existing patterns (TypeScript)
3. Open a PR to main titled: refactor(db): inline seed data into seed.ts, remove TOPIC_DEFINITIONS
4. Include "Closes #89" in the PR body
5. Use the PR body format from CLAUDE.md (the emoji PR format)
```

---

## Wave 1 — #90, #91, #92, #93, #94 (run in parallel)

**Prerequisite:** Both #88 and #89 merged to main.

### #90: TopicTile — remove COLOR_MAP, read topic.color from DB

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #90.

Branch: issue/90  |  PR target: main

== ISSUE: refactor(topics): remove COLOR_MAP from TopicTile, read topic.color from DB ==

What to build:
Remove the hardcoded COLOR_MAP from TopicTile.vue. The tile background color should be
read directly from topic.color which is now stored in the DB (added in #88). The
TopicWithScore type passed as a prop flows from the store — bind the color from it.

Changes:
- TopicTile.vue: remove COLOR_MAP const, remove computed tileColor, bind backgroundColor
  directly to topic.color (with fallback '#78716c' if undefined)
- TopicWithScore type (src/stores/topics.ts or src/types): ensure color is included when
  topics are fetched from DB and mapped to TopicWithScore

Acceptance criteria:
- [ ] COLOR_MAP is removed from TopicTile.vue
- [ ] Tile background color is bound to topic.color from the prop
- [ ] All 17 existing tiles render with the same colors as before
- [ ] Topics without a color field render with fallback '#78716c'
- [ ] No TypeScript errors

PRD context: docs/DYNAMIC_TOPICS_06/PRD.md

Instructions:
1. Create branch issue/90 from main
2. Implement following existing patterns (BEM, SCSS nesting, CSS custom properties, TypeScript)
3. Open a PR to main titled: refactor(topics): remove COLOR_MAP from TopicTile, read topic.color from DB
4. Include "Closes #90" in the PR body
5. Use the PR body format from CLAUDE.md (the emoji PR format)
```

### #91: StudyView — switch topic chips to DB-driven list

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #91.

Branch: issue/91  |  PR target: main

== ISSUE: feat(study): switch topic chips to DB-driven list ==

What to build:
Replace the static TOPIC_DEFINITIONS import in StudyView.vue with a live DB query
(db.topics.toArray()) loaded on mount. Topic chips should reflect whatever topics exist
in the database, including any newly created ones.

Changes:
- StudyView.vue: remove TOPIC_DEFINITIONS import
- On mount, load topics from db.topics.toArray() into a local ref
- Render topic chips from the DB list (use topic.topicId and topic.name)
- allTopicIds computed from the DB list, not from TOPIC_DEFINITIONS
- "All" button still toggles all DB topics

Acceptance criteria:
- [ ] StudyView no longer imports from any static topics file
- [ ] Topic chips are rendered from the DB topic list
- [ ] "All" button selects/deselects all DB topics correctly
- [ ] All 17 existing topic chips appear as before
- [ ] No TypeScript errors

PRD context: docs/DYNAMIC_TOPICS_06/PRD.md

Instructions:
1. Create branch issue/91 from main
2. Implement following existing patterns (BEM, SCSS nesting, CSS custom properties, TypeScript)
3. Open a PR to main titled: feat(study): switch topic chips to DB-driven list
4. Include "Closes #91" in the PR body
5. Use the PR body format from CLAUDE.md (the emoji PR format)
```

### #92: QuestionFormView — inline "Create new topic" sub-form

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #92.

Branch: issue/92  |  PR target: main

== ISSUE: feat(library): create new topic inline when adding a question ==

What to build:
Add a "Create new topic" option to the topic dropdown in QuestionFormView. Selecting it
reveals an inline sub-form with a name input. The topicId is auto-derived by slugifying
the name. A color is auto-assigned using pickTopicColor from src/utils/topicColors.ts.
The new topic is held in local state and only written to DB when the question is saved.

Slug derivation rules:
- Lowercase the name
- Replace spaces and underscores with hyphens
- Strip any character that is not alphanumeric or a hyphen
- Collapse consecutive hyphens to one
- Trim leading/trailing hyphens
Example: "Elastic Kubernetes Service" → "elastic-kubernetes-service"

Behavior:
- The dropdown should show existing topics from db.topics.toArray()
- At the bottom of the dropdown options, add a "＋ Create new topic" option
- Selecting it shows a name text input below the dropdown
- As the user types, show the derived topicId beneath the input (read-only preview)
- If the derived topicId already exists in the DB, show an inline error: "Topic ID already exists"
  and disable the save button
- On question save (existing handleSubmit or equivalent):
  1. If creating a new topic, insert it first: { topicId, name, color, rawScore: 0, lastReviewedAt: null, totalSessions: 0 }
  2. Then insert the question with that topicId
- If the user switches back to selecting an existing topic, discard the pending new topic state

Acceptance criteria:
- [ ] Topic dropdown has a "＋ Create new topic" option
- [ ] Selecting it reveals a name input
- [ ] topicId is auto-derived and shown as a read-only preview
- [ ] Color is auto-assigned via pickTopicColor
- [ ] New topic is NOT saved until the question is saved
- [ ] On question save, topic is inserted before the question
- [ ] If derived topicId collides with existing, inline error is shown and save is blocked
- [ ] Switching back to existing topic discards pending new topic state
- [ ] No TypeScript errors

PRD context: docs/DYNAMIC_TOPICS_06/PRD.md

Instructions:
1. Create branch issue/92 from main
2. Implement following existing patterns (BEM, SCSS nesting, CSS custom properties, TypeScript)
3. Open a PR to main titled: feat(library): create new topic inline when adding a question
4. Include "Closes #92" in the PR body
5. Use the PR body format from CLAUDE.md (the emoji PR format)
```

### #93: Import — auto-create topics for unknown topicIds

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #93.

Branch: issue/93  |  PR target: main

== ISSUE: feat(library): auto-create topics on CSV/JSON import for unknown topicIds ==

What to build:
During the import preview step in LibraryView (both JSON and CSV tabs), detect any
topicId values in valid rows that don't exist in the DB. Show a notice listing the new
topics that will be created. On confirm, insert the new topics (auto-assigned color via
pickTopicColor from src/utils/topicColors.ts, default scores) before bulk-inserting questions.

Preview notice (show below the valid/invalid summary if new topics detected):
  "2 new topic(s) will be created: eks, ecs"
  (list the topicIds, not names — we only have topicIds from the import data)

On import confirm:
1. Fetch existing topicIds from DB
2. For each unique topicId in valid rows not in DB:
   - Insert { topicId, name: topicId, color: pickTopicColor(existingColors), rawScore: 0, lastReviewedAt: null, totalSessions: 0 }
   - (name defaults to topicId since we have no other info)
3. Bulk-insert questions
4. Refresh topic list in LibraryView after import

Acceptance criteria:
- [ ] Preview step detects unknown topicIds in valid rows
- [ ] Notice shown listing new topicIds to be created
- [ ] No new topics created until user confirms
- [ ] On confirm, new topics inserted with auto-assigned color and default scores
- [ ] Questions inserted after topics
- [ ] Topic filter chips in LibraryView update after import
- [ ] No TypeScript errors

PRD context: docs/DYNAMIC_TOPICS_06/PRD.md

Instructions:
1. Create branch issue/93 from main
2. Implement following existing patterns (BEM, SCSS nesting, CSS custom properties, TypeScript)
3. Open a PR to main titled: feat(library): auto-create topics on CSV/JSON import for unknown topicIds
4. Include "Closes #93" in the PR body
5. Use the PR body format from CLAUDE.md (the emoji PR format)
```

### #94: Topic deletion with cascade from detail page

```
Spawn an agent with isolation: "worktree" to implement GitHub issue #94.

Branch: issue/94  |  PR target: main

== ISSUE: feat(topics): delete topic with cascade from topic detail page ==

What to build:
Add a Delete Topic button to the topic detail page (the view reached by clicking a topic
tile, showing Effective Score, Raw Score, Total Questions, Difficult Questions, Session
History). On tap, show a PrimeVue confirmation dialog (useConfirm().require(...)). If the
topic has questions, the dialog message should include the count. On confirm, delete all
questions with that topicId, then delete the topic, then navigate back to /topics.

Dialog messages:
- With questions: "This topic has N question(s). Deleting it will permanently remove all of them. Continue?"
- Without questions: "Are you sure you want to delete this topic?"

Header: "Delete Topic"
Accept label: "Delete" (severity: danger)
Reject label: "Cancel"

On confirm:
1. await db.questions.where('topicId').equals(topicId).delete()
2. await db.topics.where('topicId').equals(topicId).delete()
3. router.push('/topics')

Button placement: below the stats cards, above Session History — or at the bottom of the
page, whichever fits better visually. Use severity="danger" outlined styling consistent
with other delete buttons in the app.

Acceptance criteria:
- [ ] Delete Topic button visible on topic detail page
- [ ] Dialog message includes question count when topic has questions
- [ ] On confirm, all questions with that topicId are deleted
- [ ] Topic record is deleted after questions
- [ ] User is navigated to /topics after deletion
- [ ] Deleted topic no longer appears in heatmap, StudyView chips, or LibraryView chips
- [ ] No TypeScript errors

PRD context: docs/DYNAMIC_TOPICS_06/PRD.md

Instructions:
1. Create branch issue/94 from main
2. Implement following existing patterns (BEM, SCSS nesting, CSS custom properties, TypeScript)
3. Open a PR to main titled: feat(topics): delete topic with cascade from topic detail page
4. Include "Closes #94" in the PR body
5. Use the PR body format from CLAUDE.md (the emoji PR format)
```

---

## Quick reference

| Wave | Paste N prompts | Merge PRs | Then |
|------|----------------|-----------|------|
| 0 | 2 simultaneously | #88, #89 | Start wave 1 |
| 1 | 5 simultaneously | #90, #91, #92, #93, #94 | Done |
