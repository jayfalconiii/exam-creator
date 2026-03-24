# Tracker: Design Overhaul — Bold & Energetic UX Upgrade

Parent PRD issue: [#32](https://github.com/jayfalconiii/exam-creator/issues/32)

## Slices

| # | Issue | Title | Type | Blocked by | Status |
|---|-------|-------|------|------------|--------|
| 1 | [#33](https://github.com/jayfalconiii/exam-creator/issues/33) | Foundation — design tokens, PrimeVue setup, Inter font | AFK | none | open |
| 2 | [#34](https://github.com/jayfalconiii/exam-creator/issues/34) | Core component restyling with orange/amber tokens | AFK | #33 | open |
| 3 | [#35](https://github.com/jayfalconiii/exam-creator/issues/35) | Skeleton loaders + toast notifications for AI generation | AFK | #33 | open |
| 4 | [#36](https://github.com/jayfalconiii/exam-creator/issues/36) | Empty state component for topics and topic detail | AFK | #33 | open |
| 5 | [#37](https://github.com/jayfalconiii/exam-creator/issues/37) | Answer feedback animations on QuestionCard | AFK | #33 | open |
| 6 | [#38](https://github.com/jayfalconiii/exam-creator/issues/38) | View transitions and micro-interactions | AFK | #33 | open |

## Dependency graph

```
#33 Foundation
  ├── #34 Core restyling
  ├── #35 Skeleton loaders + Toast
  ├── #36 Empty states
  ├── #37 Answer feedback animations
  └── #38 View transitions + micro-interactions
```

Slices 2–6 are all parallelizable once #33 lands.
