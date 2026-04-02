# Meta-Prompt: Architecture Decision

> Template for requesting an architecture decision or for documenting one already made.
> Use this when you need to evaluate technical options before committing to an implementation path.
> The agent will produce an ADR (Architecture Decision Record) as output.

---

## Template

```
## Architecture Decision Request

**Title:** [The decision you need to make. e.g. "How to implement real-time updates for the dashboard"]

**Context:**
[Describe the problem or need that drives this decision.
What is the current situation? Why is a change or decision necessary now?
What are the consequences of not deciding?]

**Options considered:**
1. [Option A — brief description]
2. [Option B — brief description]
3. [Option C — if applicable]

**Constraints:**
- Existing stack: [list your current technologies, e.g. TypeScript, Node.js, PostgreSQL, React]
- [Other constraints: performance targets, budget, team expertise, deployment environment]
- [Timeline constraint if any]

**Evaluation criteria:**
- [ ] Consistency with the existing stack
- [ ] Implementation complexity
- [ ] Long-term maintainability
- [ ] Performance under expected load
- [ ] Cost (infrastructure, licensing, team time)
- [ ] [Other project-specific criteria]

**Concrete question:**
[What exactly do you need the agent to evaluate or recommend? Be specific.]
```

---

## Complete Example

```
## Architecture Decision Request

**Title:** How to handle file storage for user-uploaded media (images, documents)

**Context:**
The application currently saves uploaded files to the local filesystem.
This works in development but is incompatible with stateless container deployments and does not
scale to multiple instances. We need to decide on a file storage strategy before deploying to
production. Files can be up to 10MB. Expected volume: ~500 uploads/day in the first year.

**Options considered:**
1. AWS S3 (or compatible: MinIO, Cloudflare R2) with pre-signed URLs
2. Store files in PostgreSQL as binary (bytea)
3. Self-hosted MinIO in a Docker volume with an nginx proxy

**Constraints:**
- Existing stack: Node.js (NestJS), PostgreSQL, Docker, deployed on a single VPS initially
- Budget: minimize recurring costs; avoid per-GB transfer fees where possible
- Team has experience with S3 APIs but not with managing MinIO in production
- Files must be accessible via a public URL (for sharing) or a signed URL (for private content)

**Evaluation criteria:**
- [x] Consistency with the existing stack
- [x] Implementation complexity
- [x] Long-term maintainability
- [ ] Performance (not critical at current scale)
- [x] Cost (priority — we want to keep infrastructure costs low)
- [x] Operational burden on a small team

**Concrete question:**
Should we use Cloudflare R2 (S3-compatible, no egress fees) as the storage backend,
or is self-hosted MinIO on the same VPS a better fit given our current scale and team size?
What are the risks of each approach as we grow?
```

---

## Expected Agent Output

The agent must produce an ADR (Architecture Decision Record) in this format:

```
## ADR-[number]: [Title]

**Date:** [decision date]
**Status:** Proposed | Accepted | Rejected | Deprecated | Superseded

### Context
[Summary of the problem that motivated this decision]

### Options Evaluated

| Option | Pros | Cons | Stack Fit |
|--------|------|------|-----------|
| A | ... | ... | High / Medium / Low |
| B | ... | ... | High / Medium / Low |
| C | ... | ... | High / Medium / Low |

### Decision
[Chosen option and primary reason]

### Consequences
- [benefit 1]
- [benefit 2]
- [trade-off or accepted technical debt]

### Implementation Plan
1. [step 1]
2. [step 2]
3. [step 3]
```

---

## When to Use This Template

| Situation | Use ADR? |
|-----------|---------|
| Choosing between two libraries or frameworks | Yes |
| Deciding on a database schema pattern | Yes |
| Evaluating a third-party service | Yes |
| Standard CRUD feature implementation | No |
| Bug fix strategy | No — use bug-report.md instead |
| Changing an existing decision | Yes — reference the original ADR and mark it Superseded |
