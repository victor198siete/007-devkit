# Meta-Prompt: Bug Report

> Template for reporting a bug and requesting its resolution.
> Provide enough context for the agent to reproduce, diagnose, and fix the issue without unnecessary back-and-forth.
> The agent will follow `agents/workflows/debug-issue.md` upon receiving this report.

---

## Template

```
## Bug Report

**Title:** [Short description. e.g. "500 error when creating a record with a null optional field"]

**Severity:** [ ] Critical  [ ] High  [ ] Medium  [ ] Low

**Affected layer:** [ ] Backend (API)  [ ] Frontend (Web)  [ ] Mobile  [ ] Infrastructure/DB

**Module/Area:**
- File(s): [path(s) to the file(s) where the error occurs]
- Endpoint (if API): [METHOD /api/v1/route]
- Component (if UI): [path to the component]

**Steps to reproduce:**
1. [First step — include auth state, test data, environment]
2. [Second step]
3. [Action that triggers the error]

**Expected result:**
[What should happen]

**Actual result:**
[What is actually happening]

**Error / Log:**
```
[Paste the error message, stack trace, or relevant log here]
```

**Additional context:**
- User role: [role of the user performing the action]
- Environment: [ ] Local  [ ] Dev  [ ] Staging  [ ] Production
- Branch: [git branch name]
- Related to a recent change: [yes/no — if yes, describe]

**Initial hypothesis (optional):**
[If you have a sense of where the problem might be, note it here]
```

---

## Complete Example

```
## Bug Report

**Title:** PATCH /api/v1/users/:id/preferences returns 403 for the user editing their own record

**Severity:** [x] High

**Affected layer:** [x] Backend (API)

**Module/Area:**
- File(s): src/modules/notifications/notifications.controller.ts, src/modules/notifications/notifications.service.ts
- Endpoint: PATCH /api/v1/notifications/preferences

**Steps to reproduce:**
1. Authenticate as a regular user (role: "member")
2. Send PATCH /api/v1/notifications/preferences with body: { "category": "activity", "enabled": false }
3. Include valid Bearer token in Authorization header

**Expected result:**
HTTP 200 with the updated preference object

**Actual result:**
HTTP 403 Forbidden — {"message": "Forbidden resource"}

**Error / Log:**
```
ForbiddenException: Forbidden resource
    at NotificationsController.updatePreferences (notifications.controller.ts:54:13)
    at GuardsConsumer.tryActivate (guards-consumer.ts:16:5)
```

**Additional context:**
- User role: member
- Environment: [x] Local
- Branch: feature/notification-preferences
- Related to a recent change: yes — @Roles() decorator was added in the last commit

**Initial hypothesis:**
The @Roles() guard on line 52 of notifications.controller.ts likely lists only "admin", omitting
regular users who should be allowed to edit their own preferences.
```

---

## Severity Guide

| Level | Meaning | Examples |
|-------|---------|---------|
| **Critical** | System unusable, data loss, security breach | Auth bypass, data corruption, production outage |
| **High** | Core feature broken, no workaround | CRUD operation fails, data not saved, 500 in happy path |
| **Medium** | Feature partially broken, workaround exists | Incorrect data displayed, non-blocking UI error |
| **Low** | Visual glitch, edge case, cosmetic issue | Wrong label, minor layout problem |

---

## Resolution Workflow

The agent receiving this report will follow `agents/workflows/debug-issue.md`:

1. Trace the full request flow mentally using the steps provided
2. Read the affected files in priority order
3. Identify the root cause (not just the symptom)
4. Apply the minimal necessary fix
5. Verify no regressions were introduced in the affected module
6. If there are DB changes — generate a migration
7. Confirm the fix with a unit or integration test where applicable
