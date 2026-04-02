# Meta-Prompt: Feature Request

> Template for requesting a new feature. Copy and fill in the sections marked with `[ ]`.
> The receiving agent will read this prompt and apply the AIM methodology automatically.
> Use agent aliases (`@pm`, `@backend`, `@frontend`, `@mobile`) at the start of your message to route the request.

---

## Template

```
## Feature Request

**Objective:** [Describe what this feature must do. Be specific about the expected outcome and user value.]

**Type:** [ ] Full Stack  [ ] Backend Only  [ ] Frontend Only  [ ] Mobile Only

**Module/Area:**
- Backend: [existing module name OR "new module: <Name>"]
- Web: [route in the app, e.g. dashboard/settings/notifications]
- Mobile: [if applicable, e.g. user/profile/edit]

**Actor/User:** [Who uses this feature? e.g. Admin / Editor / Customer / All authenticated users]

**Detailed description:**
[Explain the complete flow. What does the user see? What triggers the backend? What is the end state?]

**Entities involved:**
- [EntityName]: [new fields or existing ones used]
- [RelatedEntity]: [relationship and usage]

**Required endpoints (if Backend):**
- [METHOD] /api/v1/[route]  →  [what it does]
- [METHOD] /api/v1/[route]  →  [what it does]

**UI / Design (if Frontend):**
[Describe or attach a visual reference. Note reusable components, layout patterns, or interaction style.]

**Required permissions:**
- [ ] [resource:action]  →  Role: [role1/role2]
- [ ] [resource:action]  →  Role: [role1]

**Restrictions / Notes:**
- [Any technical, business, or UX constraint]
- [Edge cases to handle explicitly]

**AIM Filter:** Apply full AIM methodology (R-A-C-V) for all specified layers.
```

---

## Complete Example

```
## Feature Request

**Objective:** Allow administrators to configure email notification preferences per user role.
Users should be able to opt in or out of specific notification categories (system alerts, activity summaries, billing) without losing their account settings.

**Type:** [x] Full Stack

**Module/Area:**
- Backend: existing module: notifications — extend with a preferences sub-resource
- Web: dashboard/settings/notifications
- Mobile: profile/notifications

**Actor/User:** Admin, any authenticated user (editing their own preferences)

**Detailed description:**
From the Settings page, a user opens the Notifications tab.
They see a list of notification categories (system, activity, billing) with toggles.
On toggle change, a PATCH request updates the user's preference record.
The notification dispatch service reads these preferences before sending.
Admins can override preferences for any user from the Admin panel.

**Entities involved:**
- NotificationPreference: userId (FK), category (enum), enabled (boolean), updatedAt
- User: no changes — linked via userId FK

**Required endpoints:**
- GET    /api/v1/notifications/preferences        →  Get current user's preferences
- PATCH  /api/v1/notifications/preferences        →  Update one or more preferences (current user)
- GET    /api/v1/admin/users/:id/preferences      →  Admin: get a specific user's preferences
- PATCH  /api/v1/admin/users/:id/preferences      →  Admin: override a user's preferences

**UI / Design:**
Settings page with a grouped list of toggle rows. Each row shows: category icon, label, description, and a toggle switch. Changes auto-save (debounced 500ms). Show a subtle "Saved" toast on success. Use the existing SettingsPageLayout and ToggleRowComponent if available.

**Required permissions:**
- [ ] notifications.preferences:read    →  Role: any authenticated user
- [ ] notifications.preferences:write   →  Role: any authenticated user (own record)
- [ ] notifications.preferences:manage  →  Role: admin

**Restrictions / Notes:**
- A user can only modify their own preferences; admins can modify any user's preferences
- Default preferences (all enabled) are created automatically on user registration
- The billing category is visible only to users with an active subscription

**AIM Filter:** Apply full AIM methodology (R-A-C-V) for all specified layers.
```

---

## Usage Notes

- Use `@pm` to have the Project Manager Agent decompose and distribute the task across agents
- Use `@backend` to send directly to the backend agent if the API layer is already clear
- Use `@frontend` or `@mobile` to target a specific platform agent
- The receiving agent will read the relevant standards documents before generating code
- Fill in every section — missing context causes extra clarification rounds and slower delivery
- If you only need one layer, mark the others as N/A rather than leaving them blank
