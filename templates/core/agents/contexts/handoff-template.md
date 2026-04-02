# Template: Context Handoff Between Agents / Sessions

> Use this template to transfer work state from one session or agent to another without losing critical context.
> Copy, fill in, and paste at the start of the new session or when invoking a specialized agent.

---

## Handoff Template

```
## Context Handoff — [date]

### What was being worked on?
[Describe the task or feature in progress. Be specific about the goal and current focus.]

### Current state
- [ ] In progress  [ ] Blocked  [ ] Ready for review  [ ] Requires a decision

### What is already done
- [x] [completed item 1]
- [x] [completed item 2]
- [x] [completed item 3]

### What still needs to be done
- [ ] [pending task 1]
- [ ] [pending task 2]
- [ ] [pending task 3]

### Modified / created files

| File | Status | Notes |
|------|--------|-------|
| `src/modules/<name>/...` | Created / Modified | [what was done] |
| `src/components/<name>/...` | Created / Modified | [what was done] |
| `src/database/migrations/...` | Created | [Applied: yes/no] |

### Pending migrations
- [ ] `[MigrationName]` — [description of schema change]

### Decisions taken
- **[decision 1]**: [what was decided and why]
- **[decision 2]**: [what was decided and why]

### Blockers or known issues
- [Describe any unresolved problem, ambiguity, or dependency blocking progress]

### Technical context
- Git branch: `[branch name]`
- Backend modules involved: `[names]`
- Frontend components involved: `[names]`
- New permissions/roles: `[list]`
- Environment variables added: `[list, no values]`

### Concrete next steps
1. [Immediate next action — be specific enough to act on without further clarification]
2. [Second action]
3. [Third action]

### Receiving agent
- **To:** `[@backend / @frontend / @mobile / @security / @pm]`
- **Required action:** [What the receiving agent must do with this context]
```

---

## Complete Example

```
## Context Handoff — 2026-04-01

### What was being worked on?
Implementing the notification preferences feature. Users can toggle notification categories on/off.
Backend is complete. Frontend is halfway through — the settings page component exists but the
toggle interaction and save logic are not implemented yet.

### Current state
- [x] In progress

### What is already done
- [x] NotificationPreference entity with TypeORM
- [x] Repository with findByUserId and upsert methods
- [x] Service: getPreferences, updatePreferences, resetToDefaults
- [x] Controller: GET and PATCH /api/v1/notifications/preferences
- [x] DTOs: UpdateNotificationPreferenceDto, NotificationPreferenceResponseDto
- [x] Migration generated and applied
- [x] Permissions added to seed: notifications.preferences:read, notifications.preferences:write
- [x] Module registered in AppModule
- [x] Frontend service: NotificationPreferencesService with getAll() and update() methods
- [x] Settings page skeleton: NotificationSettingsComponent renders the category list

### What still needs to be done
- [ ] Wire toggle onChange to service.update() in NotificationSettingsComponent
- [ ] Add loading and saving state signals (isLoading, isSaving)
- [ ] Show toast on save success and on save error
- [ ] Admin view: settings/users/:id/notifications — allow admin to override any user's prefs
- [ ] E2E test: verify toggle persists after page reload

### Modified / created files

| File | Status | Notes |
|------|--------|-------|
| `src/modules/notifications/entities/notification-preference.entity.ts` | Created | Full entity |
| `src/modules/notifications/notifications.service.ts` | Modified | Added preference methods |
| `src/modules/notifications/notifications.controller.ts` | Modified | Added preferences routes |
| `src/database/migrations/20260401120000-CreateNotificationPreferences.ts` | Created | Applied: yes |
| `src/app/settings/notifications/notification-settings.component.ts` | Created | Partial — see pending tasks |
| `src/app/settings/notifications/notification-preferences.service.ts` | Created | Complete |

### Pending migrations
- (none — migration already applied)

### Decisions taken
- **Upsert instead of separate create/update**: preferences are created with defaults on user registration and always upserted on PATCH — simplifies the client
- **No granular per-category endpoints**: a single PATCH accepts an array of changes — fewer round trips

### Blockers or known issues
- The admin override view is a scope question: should it live under /settings/users or /admin/users? Needs product clarification before implementing.

### Technical context
- Git branch: `feature/notification-preferences`
- Backend modules involved: notifications, users
- Frontend components involved: NotificationSettingsComponent, ToggleRowComponent (existing shared)
- New permissions: notifications.preferences:read, notifications.preferences:write, notifications.preferences:manage

### Concrete next steps
1. Open NotificationSettingsComponent and wire the toggle's (change) event to call service.update()
2. Add isSaving = signal(false), set to true before the call and false in finally block
3. Inject ToastService and call toast.success('Preferences saved') on resolution
4. Ask product whether the admin override UI belongs under /settings or /admin before building it

### Receiving agent
- **To:** `@frontend`
- **Required action:** Complete the toggle interaction in NotificationSettingsComponent per the steps above, then confirm the admin view scope question with the PM before proceeding further
```

---

## When to Use This Template

| Situation | Action |
|-----------|--------|
| Switching sessions on the same day | Save handoff in `agents/contexts/session-state.md` |
| Delegating a subtask to another agent | Create a targeted handoff for that agent |
| Resuming work the next day | Read `agents/contexts/session-state.md` at session start |
| Context switch (interrupt feature A for a bugfix) | Handoff feature A's state before starting the bugfix |
| Handing off to a human reviewer | Use the handoff as the PR description body |
| Escalating a blocker to a senior agent or PM | Attach handoff to the escalation message |
