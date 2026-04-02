<div align="center">

# 007devkit

**Scaffold any TypeScript project with a complete AI agent system,
AIM methodology and coding standards — in seconds.**

[![npm version](https://img.shields.io/npm/v/007devkit?color=black&style=flat-square)](https://www.npmjs.com/package/007devkit)
[![npm downloads](https://img.shields.io/npm/dm/007devkit?color=black&style=flat-square)](https://www.npmjs.com/package/007devkit)
[![license](https://img.shields.io/github/license/victor198siete/007devkit?color=black&style=flat-square)](./LICENSE)
[![node](https://img.shields.io/node/v/007devkit?color=black&style=flat-square)](https://nodejs.org)
[![tests](https://img.shields.io/github/actions/workflow/status/victor198siete/007devkit/ci.yml?label=tests&style=flat-square)](https://github.com/victor198siete/007devkit/actions)

```bash
npx 007devkit init
```

</div>

---

## The problem

You start a new TypeScript project. Before writing a single line of business logic, you need to set up how you'll collaborate with AI tools:

- What rules does the AI follow for *your* stack?
- How do you request a feature without re-explaining the architecture every time?
- How do you keep context across sessions?
- How do you onboard the AI to a bug without 5 back-and-forth messages?

**007devkit solves this by generating a complete AI collaboration environment tailored to your stack.**

---

## What gets generated

```
your-project/
├── .cursorrules              ← Rules for Cursor / Windsurf
├── CLAUDE.md                 ← Instructions for Claude Code CLI
├── devkit.config.json        ← Installed config (for future updates)
│
├── agents/
│   ├── roles/                ← One file per agent (@pm, @backend, @frontend…)
│   ├── workflows/            ← Step-by-step guides (new module, debug, tests, review)
│   ├── prompts/              ← Templates for feature requests, bugs, ADRs
│   └── contexts/             ← Session state + handoff between sessions
│
└── docs/
    ├── aim-methodology.md    ← R-A-C-V collaboration cycle
    └── <stack>-standards.md  ← Coding standards for your exact stack
```

Everything is plain Markdown — readable, editable, committable. No lock-in.

---

## Quick start

```bash
# Run interactively in current directory
npx 007devkit init

# Scaffold into a new directory
npx 007devkit init my-project

# Update templates later (never overwrites your customizations)
npx 007devkit update
```

---

## Supported stacks

| Layer | Options |
|-------|---------|
| **Frontend** | Angular 21 + Signals, React 19, Next.js 14 (App Router), Vue 3, Nuxt 3 |
| **Backend** | NestJS, Express / Fastify, Next.js API Routes |
| **Mobile** | Ionic + Capacitor, React Native + Expo |
| **Database** | PostgreSQL, MySQL, MongoDB |
| **Monorepo** | Nx, Turborepo |
| **AI tool** | Claude Code CLI, Cursor / Windsurf, Both |
| **Language** | English, Español |

Each combination generates a custom `.cursorrules` and `CLAUDE.md` composed from stack-specific rule blocks — no irrelevant rules, no generic boilerplate.

---

## Interactive setup

```
┌  007devkit — AI Dev Environment Setup
│
◇  Project name
│  my-app
│
◇  Frontend framework
│  ❯ Angular 21 + Signals
│    React 19
│    Next.js 14 (App Router)
│    Vue 3 · Nuxt 3 · None
│
◇  Backend framework
│  ❯ NestJS
│    Express / Fastify
│    Next.js API Routes · None
│
◇  Database
│  ❯ PostgreSQL
│    MySQL · MongoDB · None
│
◇  Mobile app?
│  ❯ No mobile
│    Ionic + Capacitor
│    React Native / Expo
│
◇  Monorepo tool?
│  ❯ No (single repo)
│    Nx · Turborepo
│
◇  Primary AI tool
│  ❯ Claude Code (CLI)
│    Cursor / Windsurf · Both
│
◇  Documentation language
│  ❯ English · Español
│
└  ✓ Done!

  Created:
    ✓  CLAUDE.md
    ✓  .cursorrules
    ✓  agents/roles/project-manager.md
    ✓  agents/roles/backend-agent.md
    ✓  agents/roles/frontend-agent.md
    ✓  agents/roles/security-agent.md
    ✓  agents/workflows/init-session.md
    ✓  agents/workflows/new-backend-module.md
    ✓  agents/workflows/new-frontend-component.md
    ✓  agents/workflows/debug-issue.md
    ✓  agents/workflows/write-tests.md
    ✓  agents/workflows/review-code.md
    ✓  agents/prompts/feature-request.md
    ✓  agents/prompts/bug-report.md
    ✓  agents/prompts/architecture-decision.md
    ✓  agents/contexts/session-state.md
    ✓  agents/contexts/handoff-template.md
    ✓  docs/aim-methodology.md
    ✓  docs/nest-backend-general-standards.md
    ✓  docs/frontend-architecture-standards.md
    ✓  devkit.config.json
```

---

## Using the agent system

Once initialized, use agent aliases directly in your AI tool:

```
# Coordinate a new feature
@pm: add daily attendance registration for classrooms
Type: Full Stack

# Go straight to backend implementation
@backend: create the Attendance NestJS module
Workflow: agents/workflows/new-backend-module.md

# Report a bug with full context
@backend: [fill in agents/prompts/bug-report.md and paste here]

# Pre-PR review
/review-code: attendance module

# Resume after a break
Read agents/contexts/session-state.md — what's pending?
```

---

## AIM Methodology

Every task follows the **R-A-C-V** cycle, defined in `docs/aim-methodology.md`:

| Phase | What happens |
|-------|--------------|
| **R** — Requirements | Define goal, actor, scope, and API contract |
| **A** — Architecture | Select patterns per layer, list files to create |
| **C** — Code | Atomic implementation, backend first if Full Stack |
| **V** — Validation | Build passes · tests pass · security checked · PR ready |

The AI reads this methodology automatically at session start and applies it to every request.

---

## Updating templates

```bash
npx 007devkit update
```

Prompts you for each file group. Files you've customized are never overwritten automatically.

Your `devkit.config.json` tracks what's installed:

```json
{
  "version": "0.1.0",
  "projectName": "my-app",
  "blocks": ["angular", "nestjs", "postgresql", "nx"],
  "aiTool": "both",
  "language": "en",
  "customized": [],
  "installedAt": "2026-04-02T10:00:00.000Z"
}
```

---

## How it works

007devkit uses a **block composition** system:

```
templates/
├── core/          ← Installed in every project (stack-agnostic)
│   ├── agents/    ← Universal prompts, workflows, context templates
│   └── docs/      ← AIM methodology
│
└── blocks/        ← Installed based on your selections
    ├── frontend/angular/
    ├── backend/nestjs/
    ├── mobile/ionic/
    ├── database/postgresql/
    └── monorepo/nx/
```

Each block contributes:
- A **role file** (`agents/roles/<agent>.md`) — identity, rules, stack-specific patterns
- A **standards doc** (`docs/<stack>-standards.md`)
- **Workflow files** (`agents/workflows/new-<thing>.md`)
- A **`.cursorrules` fragment** — injected into the final file
- A **`CLAUDE.md` fragment** — injected into the final file

The final `.cursorrules` and `CLAUDE.md` are assembled from the header scaffold + all selected fragments + footer scaffold, rendered with [EJS](https://ejs.co/) using your project variables.

---

## Requirements

- Node.js 18+
- Any TypeScript project

---

## Contributing

Contributions welcome — especially new stack blocks.

### Adding a new stack

```
templates/blocks/<layer>/<framework>/
├── role.md                    ← Agent identity, stack rules, patterns, checklist
├── standards.md               ← Coding standards for this stack
├── workflows/
│   └── new-<thing>.md         ← Step-by-step creation workflow
├── cursorrules.fragment.ejs   ← Injected into .cursorrules
└── claude.fragment.ejs        ← Injected into CLAUDE.md
```

Then register it in `src/composer/template-composer.ts` in the appropriate blocks map, and add tests.

### Development setup

```bash
git clone https://github.com/victor198siete/007devkit
cd 007devkit
npm install
npm run dev       # watch mode
npm test          # 42 tests
```

### PR checklist

- [ ] New block files follow the structure above
- [ ] Block registered in `template-composer.ts`
- [ ] Tests added / passing (`npm test`)
- [ ] No TypeScript errors (`npm run lint`)

---

## License

MIT © [victor198siete](https://github.com/victor198siete)
