# Workflow: /debug-issue

> Diagnose and resolve bugs following a structured, root-cause-first process.
> Never treat symptoms — always find and fix the underlying cause.
> Use together with: `agents/prompts/bug-report.md`

---

## Required Information

If the user has not provided a bug report, ask for:

1. **Where does it occur?** — Backend / Frontend / Mobile / Database
2. **What error is visible?** — Error message, stack trace, HTTP status code
3. **How to reproduce it?** — Concrete, ordered steps
4. **What was expected?** — The correct behavior
5. **Branch / environment?** — local / dev / staging / production

Do not start diagnosing until you have answers to all five questions.

---

## Diagnostic Steps

### Step 1 — Understand the Full Flow

Before opening any file, trace the complete execution path:

- **Backend request:** entry point (route/controller) → middleware/guards → service → repository/DB → response
- **Frontend action:** user event → component handler → service call → HTTP request → state update → UI render
- **Mobile:** navigation event → page component → service → API → local state

Identify every file involved in this flow. Do not skip layers.

### Step 2 — Read the Affected Files

Read in this priority order:

1. The file named in the stack trace (where the error was thrown)
2. The service or handler containing the business logic
3. The data model / entity / schema (if the error relates to data shape)
4. The validation layer / DTO / schema (if the error is a validation failure)
5. The auth/guard layer (if the error is a 401 or 403)
6. The environment/config (if the error relates to missing variables or wrong URLs)

Read fully — do not skim. Bugs are often one line away from where the error is thrown.

### Step 3 — Categorize the Bug

| Category | Typical Symptoms | Where to Look |
|----------|-----------------|---------------|
| **Validation** | 400 Bad Request, "field X is required", unexpected field error | DTOs, request schema, validation middleware |
| **Authentication** | 401 Unauthorized, "invalid token", "token expired" | Auth guard, token parsing, public route config |
| **Authorization** | 403 Forbidden, "insufficient permissions" | Role/permission guard, ownership checks |
| **Not Found** | 404, "entity not found", null reference after DB query | Repository query, ID parameter, FK existence |
| **DB / ORM** | 500, constraint violation, "null value in column", duplicate key | Entity schema, migration state, relations, query |
| **Business Logic** | Wrong data returned, incorrect calculations, unexpected state | Service methods, conditional logic |
| **Frontend State** | UI doesn't update, stale data, signal not reactive | State management (signals/hooks/stores), effect deps |
| **Network / Config** | CORS error, connection refused, wrong base URL | Environment config, proxy settings, API base URL |
| **Concurrency** | Race condition, intermittent failure, works sometimes | Async/await handling, parallel calls, loading state |

### Step 4 — Identify the Root Cause

Work through the relevant questions for each layer:

**Backend:**
- Is the guard applied correctly? Is the route accidentally public or accidentally protected?
- Does the service correctly identify the acting user (from the token payload, not a request body field)?
- Do all database queries include required scope filters (tenant, owner, org)?
- Are entity relations properly configured? Is eager loading vs. lazy loading correct?
- Has the latest migration been executed? Does the DB schema match the entity definition?
- Is there a field excluded from selects by default that this query needs?
- Is a null/undefined value being accessed without a guard (`?.` or explicit check)?

**Frontend:**
- Is the reactive state (signal, store, hook) updated correctly after the API response?
- Are effect dependencies complete? Could the effect be skipping a re-run?
- Is the correct API base URL used? Is the `/api/v1` prefix (or equivalent) present?
- Is the error from the API being caught and handled, or swallowed silently?
- Is the component lifecycle causing a double-fetch or a cleanup race?

**Database:**
- Has the migration been applied? Run the migration status command to verify.
- Is a UNIQUE constraint being violated by a duplicate insert?
- Is a foreign key pointing to a record that does not exist?
- Does the column type in the schema match the TypeScript type?
- Is a NOT NULL column receiving a null value due to a missing default?

### Step 5 — Propose the Fix

Rules for a good fix:

- Apply the minimal, surgical change — only what is necessary to resolve the root cause
- Do not refactor unrelated code in the same change
- Do not change public interfaces or API contracts without assessing the full impact
- Do not silence errors with empty catch blocks — log and re-throw or handle explicitly
- If the fix requires a DB schema change, generate a migration — do not rely on auto-sync

**If a DB migration is needed**, follow your project's migration command:

```bash
# Example for TypeORM
npx typeorm migration:generate src/database/migrations/Fix<Description>
npx typeorm migration:run

# Example for Prisma
npx prisma migrate dev --name fix_<description>
```

### Step 6 — Verify the Fix

```bash
# Build to catch type or compile errors
<your build command for the affected app>

# Run tests scoped to the affected module
<your test command> --testPathPattern="<module-name>"

# If the bug was in an integration path, run the broader test suite
<your test command>

# For a frontend bug, serve locally and reproduce the original steps
<your dev server command>
```

---

## Resolution Checklist

- [ ] Root cause identified (not just the symptom)
- [ ] Minimal fix applied — no unrelated changes included
- [ ] No regressions introduced in the affected module or related modules
- [ ] If DB schema changed: migration generated and applied
- [ ] Build passes without errors
- [ ] Relevant tests pass
- [ ] If no test existed for this case: new test added to prevent regression

---

## Anti-Patterns to Avoid

- `try { ... } catch(e) {}` — swallowing errors without logging or re-throwing
- Disabling type checking (`as any`, `@ts-ignore`) to bypass the symptom
- Broadening access controls (e.g. making a route public) to "fix" an auth error without understanding why auth failed
- Adding a `null` fallback everywhere instead of fixing the source that should never produce `null`
- Commenting out failing code with `// TODO: fix later`
- Fixing the error in one call site without checking if the same bug exists elsewhere
- Changing the test to match the wrong behavior instead of fixing the code
