# AIM Methodology — Agent Interaction Model

> A structured, stack-agnostic collaboration framework for AI-assisted software development.
> AIM ensures every task is properly scoped, architecturally sound, correctly implemented, and validated before delivery.

---

## The R-A-C-V Lifecycle

Every request — whether a new feature, a bug fix, or a refactor — must pass through four phases:

```
Requirements → Architecture → Code → Validation
      R      →      A      →   C  →      V
```

---

### R — Requirements

**Goal:** Define the complete scope before writing a single line of code.

The requirements phase prevents wasted effort by establishing a clear contract between what is needed and what will be built.

**What to define:**

- **Inputs and outputs:** What data enters the system? What is returned or produced?
- **User flows:** Who does what, in what order, under what conditions?
- **API contract (if applicable):** Request shape, response shape, status codes, error cases
- **Edge cases:** What happens with null values, empty collections, invalid permissions, concurrent writes?
- **Acceptance criteria:** How do we know the feature is done and correct?

**Checklist before moving to Architecture:**

- [ ] Objective is unambiguous — one sentence describes what the feature does
- [ ] All actors (user roles, services, external systems) are identified
- [ ] Input and output shapes are defined
- [ ] At least three edge cases are named
- [ ] Acceptance criteria are written in testable form ("given X, when Y, then Z")

---

### A — Architecture

**Goal:** Choose the correct patterns and structure before implementing.

Architecture decisions made here are hard to reverse. Getting them right upfront costs minutes; reversing them costs hours.

**Layers to consider:**

| Layer | Concerns | Common Patterns |
|-------|---------|-----------------|
| **Server / API** | Routing, validation, auth, business logic, data access | Controller → Service → Repository; Middleware/Guard chains |
| **Client / Web** | State management, data fetching, UI composition, routing | Component tree; reactive state (signals/stores); service layer for HTTP |
| **Mobile** | Navigation, platform APIs, offline support, permissions | Role-based route namespacing; lazy-loaded pages; native plugin wrappers |
| **Database** | Schema design, migrations, indexes, constraints | Explicit migrations (never auto-sync in production); FK constraints; index on FK and query columns |
| **Cross-cutting** | Auth, logging, error handling, multi-tenancy, observability | Centralized middleware; audit trail; structured logging |

**Questions to answer before moving to Code:**

- Which existing modules/components does this touch?
- Is a new module/component needed, or can an existing one be extended cleanly?
- Where does state live, and how does it flow?
- What are the security boundaries (who can access what)?
- Is a database migration required?
- Are there performance implications at the expected data volume?

---

### C — Code

**Goal:** Implement atomically, layer by layer, in the correct order.

**Implementation order:**

1. **Database layer first** — if schema changes are needed, write the migration before touching service logic
2. **Backend/API second** — if API changes are needed, implement and verify them before touching the frontend
3. **Frontend/Mobile last** — connect to the verified API; never mock an API that already exists

**Rules for implementation:**

- One logical change per commit — do not mix feature work with refactors or formatting fixes
- Follow the project's naming conventions and style guide without exception
- Use the project's standard patterns (DI, HTTP abstraction, reactive primitives, CSS design tokens)
- No `any` types, no `console.log` in production code, no hardcoded secrets or URLs
- Every new module/endpoint/component must be reachable from the router/app entry point
- Write code that is readable to the next person — clarity over cleverness

---

### V — Validation

**Goal:** Verify correctness, security, and quality before the work is considered done.

Validation is not optional and not the last thing to squeeze in. It is the gate between "written" and "done."

**Validation checklist:**

- [ ] Build passes without errors or warnings
- [ ] Tests pass — all existing tests still pass, new tests cover the new behavior
- [ ] Security review done — auth, authorization, input validation, data exposure
- [ ] Code review completed — self-review at minimum, peer review preferred
- [ ] PR approved and merged per the project's contribution process

---

## Quality Checkpoints Table

Use this table to verify compliance at the end of any task:

| Checkpoint | What to Verify | Applies To |
|------------|---------------|------------|
| **Scope complete** | All acceptance criteria from Requirements are met | All |
| **No type errors** | Build passes with strict types — no `any`, no casts | All |
| **Tests exist** | Happy path, not found, auth error covered | All |
| **Auth enforced** | Routes/endpoints/actions protected; ownership scoped | API + UI |
| **Data scoped** | Queries filtered by owner/tenant/org as applicable | API + DB |
| **Migrations present** | Schema change has a migration — no auto-sync in prod | DB |
| **Reactive state correct** | State updates consistently without stale reads | Frontend |
| **Loading/error states** | UI shows feedback during async operations | Frontend + Mobile |
| **Responsive design** | Layout works at mobile and desktop breakpoints | Frontend + Mobile |
| **No hardcoded values** | No colors, URLs, secrets in source code | All |
| **Logging structured** | Structured logs in place; no `console.log` | API |
| **PR reviewed** | At least one reviewer approved before merge | All |

---

## Meta-Prompt Skeleton

Use this structure when requesting work from an agent:

```
**Objective:** [One sentence describing the desired outcome]

**Type:** [ ] Full Stack  [ ] Backend Only  [ ] Frontend Only  [ ] Mobile Only

**Context:**
[Relevant background. What exists today? What changes? Why now?]

**Acceptance criteria:**
- Given [state], when [action], then [expected result]
- Given [state], when [action], then [expected result]

**AIM Filter:** Apply the full R-A-C-V cycle for all specified layers.
```

---

## Why Use AIM

Without a structured methodology, AI-assisted development tends to produce:

- Code that solves the stated symptom but not the underlying need
- API and UI that were designed independently and don't align
- Features that work in happy-path demos but fail on edge cases
- No tests, no migrations, no audit trail
- Fast first draft, slow everything that comes after

AIM enforces discipline at each phase:

- **R** ensures you know what you're building before you build it
- **A** ensures the structure supports future changes without rewrites
- **C** ensures implementation is consistent, secure, and maintainable
- **V** ensures the work is actually done — not just written

The result: code that not only works, but works correctly, securely, and in a way the team can understand and extend.
