# Workflow: Initialize Session

Run this workflow at the start of every working session before writing or modifying any code. Its purpose is to ensure the agent has full context, understands the current state of the project, and avoids redundant or conflicting work.

---

## Step 1 — Read Mandatory Documents

Read the following files in order. Do not skip any that exist in the project:

```
CLAUDE.md                              ← Agent system, stack rules, compliance requirements
.cursorrules                           ← Project-wide conventions and anti-patterns
docs/frontend-architecture-standards.md   ← (if present) Frontend structure and patterns
docs/frontend-ui-ux-guidelines.md         ← (if present) Design system and CSS conventions
docs/nest-backend-general-standards.md    ← (if present) Backend standards
docs/aim-methodology.md                   ← (if present) Delivery methodology
agents/contexts/session-state.md          ← Current project state, in-progress work
```

Confirm each file was read. If a file is missing, note it and continue.

---

## Step 2 — Check Git Status

```bash
git status
git log --oneline -10
```

Review:
- Which branch is active?
- Are there uncommitted changes? If so, what modules do they affect?
- What was the last completed commit? Does it indicate any in-progress feature?

---

## Step 3 — Review Existing Modules and Components

Identify what already exists to avoid duplication:

```bash
# Backend: list existing modules
ls apps/api/src/modules/

# Frontend: list feature modules
ls apps/web/src/app/dashboard/

# Mobile: list pages
ls apps/mobile/src/app/

# Shared libraries
ls libs/
```

Note any module that is relevant to the current session's task.

---

## Step 4 — Confirm Feature Flags and Configuration

Check if the project uses feature flags, environment-specific config, or toggle systems:

```bash
# Check for environment files (do NOT read secrets, just confirm they exist)
ls .env* 2>/dev/null | grep -v ".env.example"

# Check for feature flag files
ls apps/*/src/environments/ 2>/dev/null
ls apps/*/src/app/config/ 2>/dev/null
```

If the task being undertaken depends on a flag that may be off by default, note it.

---

## Step 5 — Review Shared Utilities

Before creating new utilities, confirm what already exists:

```bash
# Shared helpers, pipes, guards, interceptors
ls libs/shared/src/ 2>/dev/null
ls apps/api/src/common/ 2>/dev/null
ls apps/web/src/app/shared/ 2>/dev/null
```

Look for: existing guards, interceptors, pipes, decorators, HTTP abstractions, validators. Using existing utilities prevents duplication and maintains consistency.

---

## Step 6 — Confirm Context Loaded

Once all steps above are complete, output this confirmation statement before proceeding with the task:

```
## Session Context Loaded

- Branch: [branch name]
- Uncommitted changes: [Yes — affects: X, Y / No]
- Existing modules relevant to task: [list or "none"]
- Session state reviewed: [Yes / File not found]
- Mandatory documents read: [list of docs confirmed]
- Ready to proceed: ✅
```

Only after this confirmation should the agent begin writing or modifying code.

---

## Notes

- If `agents/contexts/session-state.md` contains in-progress work from a previous session, resume from where it left off rather than starting fresh.
- If the task requires a new module, run `agents/workflows/new-backend-module.md` or the appropriate frontend workflow after this init.
- If uncertain about scope or approach, invoke `@pm` before proceeding.
