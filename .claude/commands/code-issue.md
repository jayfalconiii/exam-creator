---
name: code-issue
description: List open GitHub issues, pick one or more unblocked issues, and launch parallel autonomous TDD sub-agents to implement them. Each issue gets its own branch, worktree, and PR.
---

# /code-issue

Implement one or more open GitHub issues for the exam-creator repository. Each selected issue runs in its own isolated worktree sub-agent in parallel.

## Step 1 — Fetch and display open issues

Run:

```bash
gh issue list --state open --limit 50 --json number,title,labels \
  --template '{{range .}}#{{.number}}  {{.title}}{{"\n"}}{{end}}'
```

Display the results as a numbered list. If empty, tell the user "No open issues found." and stop.

## Step 2 — Ask the user to pick issues

Ask: "Which issue number(s) would you like to implement? You can enter multiple numbers separated by spaces or commas (e.g. `86 110 112`). Pick only issues that don't block each other."

Wait for a text response. Parse out all issue numbers.

For **each** selected issue number, validate in parallel:

**a. Fetch full issue details:**
```bash
gh issue view <NUMBER> --json number,title,state,body,labels
```
If `state` is not `OPEN`, remove it from the list and warn the user.

**b. Check for an existing PR:**
```bash
gh pr list --state all --search "closes #<NUMBER>" --json number,title,state,headRefName
```
Also:
```bash
gh pr list --state all --json number,title,state,headRefName | grep -i "issue-<NUMBER>"
```
If a PR already exists, warn the user and ask them to confirm whether to include that issue.

After validation, if no valid issues remain, stop.

## Step 3 — Determine branch names

For **each** valid issue, parse the issue title:

1. **Infer type** from the title prefix (e.g. `feat(...)`, `fix(...)`, `refactor(...)`) if present. Otherwise infer from labels:
   - `bug` → `fix`
   - `enhancement` → `feat`
   - `refactor` → `refactor`
   - `documentation` or `docs` → `docs`
   - `style` → `style`
   - `test` → `test`
   - default → `feat`

2. **Slugify** the description part: lowercase, replace spaces and special characters (parens, colons, commas, slashes) with hyphens, collapse consecutive hyphens, strip leading/trailing hyphens, max 40 characters.

3. **Format:** `type/issue-<NUMBER>-<slug>`

Examples:
- `refactor(study): replace timer slider with preset time buttons` + issue 86 → `refactor/issue-86-replace-timer-slider-with-preset-time-buttons`
- `feat(backup): add exportStudySession() utility` + issue 110 → `feat/issue-110-add-exportstudy-session-utility`

## Step 4 — Confirm with user

Show a summary table for all selected issues:

```
Ready to implement <N> issue(s) in parallel:

  #<NUMBER1>  <title1>
  Branch: <branch-name-1>

  #<NUMBER2>  <title2>
  Branch: <branch-name-2>

  ...

Strategy: TDD (red → green → refactor) per issue, each in its own worktree
Result:   One PR per issue opened on completion

Proceed? (yes / no)
```

If the user says no, stop.

## Step 5 — Launch sub-agents in parallel

**Send a single message** containing one Agent tool call per issue, all with `isolation: "worktree"`. Do NOT send separate messages — all calls must be in the same message so they run simultaneously.

Each sub-agent will implement, push its branch, clean up its worktree, and return a structured summary with `BRANCH`, `PR_TITLE`, and `PR_BODY_START...PR_BODY_END`.

Once **all** sub-agents have completed, proceed to Step 6.

For each issue, use the sub-agent prompt template below with all `<PLACEHOLDERS>` substituted.

---

### Sub-agent prompt template (repeat per issue)

```
You are implementing GitHub issue #<NUMBER> for the exam-creator repository.

Issue: #<NUMBER> — <TITLE>
Branch to create: <BRANCH_NAME>

Issue body:
---
<ISSUE_BODY>
---

## Repo facts
- Stack: Vue 3 Composition API, TypeScript, Pinia, Dexie (IndexedDB), PrimeVue, Vitest
- Test command: npm test (vitest --run)
- Path alias: @/ → src/
- Style conventions: BEM classes, semantic HTML, SCSS
- No watchers — use computed properties or composables instead

## CLAUDE.md rules (follow strictly)
- TypeScript always; Vue 3 Composition API only
- No watch or watchEffect — use computed or composables
- Use @/ path alias, never relative ../../ imports
- BEM CSS classes, semantic HTML
- Commit format: type(scope): description (e.g. fix(nav): add z-index to bottom nav)
- Never commit to main; never force-push; never skip tests

## Step 1 — Baseline

1. Ensure main is up to date:
   git fetch origin main
   git merge origin/main
   If the merge fails (conflicts), report the conflict and stop — do not proceed.

2. Create the feature branch:
   git checkout -b <BRANCH_NAME>

3. Install dependencies:
   npm install

4. Run the full test suite:
   npm test
   All tests must pass before writing any code.
   If any fail, report them and stop — do not proceed with a broken baseline.

## Step 2 — Read the codebase

Before writing any code:
- Use Glob and Grep to find files relevant to the issue
- Read src/__tests__/ to understand testing patterns and conventions
- Read 2-3 existing components, composables, or stores closest to what the issue requires
- Understand what already exists before writing anything new

## Step 3 — TDD implementation (one vertical slice at a time)

Write a short plan first (in your response, not a file):
- What public interface / behavior changes are needed?
- What are the 3-5 most important behaviors to test, ordered by priority?
- Which existing files will be modified vs which new files are needed?

Then follow the red → green → refactor loop strictly:

  RED:     Write one failing test for one behavior
  GREEN:   Write minimal code to make it pass; run npm test
  REFACTOR: Clean up if needed; tests must stay green
  COMMIT:  git add -p && git commit -m "type(scope): description"

Rules:
- One test at a time, not a batch
- Minimal implementation only — no speculative features, no extra configurability
- Commit after each red/green/refactor cycle
- Commit message format: type(scope): description (present tense, max 72 chars)
  - Use same type as branch (feat/fix/refactor/style/etc.)
  - Scope = the component, composable, store, or module name
- Run npm test after every GREEN step to catch regressions

## Step 4 — Refactor pass

After all behaviors are implemented and all tests pass:
- Extract any duplication
- Simplify interfaces
- Run npm test after each refactor step
- Commit refactors separately: refactor(scope): description

## Step 5 — Final verification

1. Run npm test — all tests must pass; report the count
2. Run TypeScript check:
   npx vue-tsc --noEmit
   Fix ALL TypeScript errors before creating the PR

## Step 6 — Push and report

Push the branch:
```bash
git push -u origin <BRANCH_NAME>
```

Then output a structured summary that the calling context will use to create the PR. Include:

```
BRANCH: <BRANCH_NAME>
PR_TITLE: <TYPE>(<scope>): <concise description matching issue intent>
CLOSES: #<NUMBER>

PR_BODY_START
## 🚀 Feature
- <one-line summary of what this implements>

### 📄 Summary
- <bullet: key change 1>
- <bullet: key change 2>

Closes #<NUMBER>

### 🌟 What's New
- <list new/changed components, composables, functions, types, styles>

### 🧪 How to Test
- <numbered steps for a human to verify the feature>

### 🖼️ UI Changes (if any)
- <describe visual changes, or remove this section if purely logic>

### 📌 Checklist
- [x] Feature works as expected
- [x] Unit/integration tests added (if applicable)
- [ ] Updated relevant documentation
- [ ] Verified in staging (if applicable)
PR_BODY_END
```

## Hard constraints
- Never commit directly to main
- Never skip tests, never force-push
- Never use watch or watchEffect in Vue components
- Never use relative ../../ imports — always use @/
- Never add features not described in the issue
- Do NOT create the PR and do NOT clean up the worktree — the calling context handles both
- If blocked or uncertain, describe the blocker clearly and stop — do not guess or workaround silently
```

---

## Step 6 (main context) — Create PRs and clean up worktrees

Once all sub-agents have finished and returned their summaries:

**For each sub-agent:**

1. Write the PR body to a temp file using the Write tool
2. Create the PR:
```bash
gh pr create \
  --title "<PR_TITLE from sub-agent>" \
  --body-file /tmp/pr-body-<NUMBER>.md \
  --head <BRANCH from sub-agent> \
  --base main
```
3. Delete the temp file
4. Remove the worktree using the path from the task notification's `<worktreePath>`:
```bash
git -C /Users/jayfalcon-arcanys/Developer/side-projects/exam-creator \
  worktree remove <worktreePath> --force
```
5. After all worktrees are removed, prune once:
```bash
git -C /Users/jayfalcon-arcanys/Developer/side-projects/exam-creator worktree prune
```

Output all PR URLs to the user.
