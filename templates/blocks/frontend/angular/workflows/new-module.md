# Workflow: New Angular Module (Multiple Components)

Use this workflow when a feature requires multiple related components, a shared model layer, and its own route namespace.

---

## Module Structure

```
dashboard/[module]/
├── [module].routes.ts              # Route definitions (lazy)
├── [module].models.ts              # Interfaces, DTOs, enums
├── shared/
│   └── [module]-[shared].component.ts   # Module-scoped shared components
├── [entity-a]/
│   ├── [entity-a]-list.component.ts
│   ├── [entity-a]-form.component.ts
│   └── [entity-a]-detail.component.ts
├── [entity-b]/
│   ├── [entity-b]-list.component.ts
│   └── [entity-b]-form.component.ts
└── repos/
    ├── [entity-a].repo.ts
    └── [entity-b].repo.ts
```

---

## Step 1: Define All Models in One File

```typescript
// [module].models.ts
export interface EntityA {
  id: string;
  name: string;
  entityBId: string;
}

export interface EntityB {
  id: string;
  label: string;
}

export interface CreateEntityADto {
  name: string;
  entityBId: string;
}

export type UpdateEntityADto = Partial<CreateEntityADto>;
```

---

## Step 2: Create Repos

One repo per API resource:

```typescript
// repos/entity-a.repo.ts
@Injectable({ providedIn: 'root' })
export class EntityARepo {
  private readonly http = inject(RepoHttp);
  private readonly base = '/entity-a';

  async getAll(): Promise<EntityA[]> {
    return this.http.get<EntityA[]>(this.base);
  }
  // ... CRUD methods
}
```

---

## Step 3: Module-Scoped Shared Components

For components used only within this module (not app-wide), place them in `shared/`:

```typescript
// shared/[module]-header.component.ts
@Component({
  selector: 'app-[module]-header',
  standalone: true,
  imports: [],
  template: `
    <div class="border-b border-(--color-border) pb-4 mb-6">
      <h1 class="text-2xl font-bold text-(--color-text)">{{ title() }}</h1>
      <p class="text-sm text-(--color-text-muted)">{{ subtitle() }}</p>
    </div>
  `,
})
export class [Module]HeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
```

---

## Step 4: Build Each Entity's Components

Follow the single feature workflow (`new-feature.md`) for each entity. Each list/form/detail component is standalone and lazy-loaded via routes.

---

## Step 5: Route Config

```typescript
// [module].routes.ts
import { Routes } from '@angular/router';

export const [MODULE]_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'entity-a',
    pathMatch: 'full',
  },
  {
    path: 'entity-a',
    loadComponent: () =>
      import('./entity-a/entity-a-list.component').then(m => m.EntityAListComponent),
  },
  {
    path: 'entity-a/new',
    loadComponent: () =>
      import('./entity-a/entity-a-form.component').then(m => m.EntityAFormComponent),
  },
  {
    path: 'entity-a/:id',
    loadComponent: () =>
      import('./entity-a/entity-a-detail.component').then(m => m.EntityADetailComponent),
  },
  {
    path: 'entity-b',
    loadComponent: () =>
      import('./entity-b/entity-b-list.component').then(m => m.EntityBListComponent),
  },
];
```

---

## Step 6: Register in Dashboard

```typescript
// dashboard.routes.ts
{
  path: '[module]',
  loadChildren: () =>
    import('./[module]/[module].routes').then(m => m.[MODULE]_ROUTES),
},
```

---

## Step 7: Add Sidebar Navigation Entries

Add entries in `layout/sidebar/sidebar.component.ts`:

```typescript
protected readonly navItems = signal([
  // ... existing items
  {
    label: '[Module]',
    icon: 'grid',
    children: [
      { label: 'Entity A', route: '/dashboard/[module]/entity-a' },
      { label: 'Entity B', route: '/dashboard/[module]/entity-b' },
    ],
  },
]);
```

---

## Final Checklist

- [ ] All models in `[module].models.ts`
- [ ] Separate repo per entity in `repos/`
- [ ] Module-scoped shared components in `shared/`
- [ ] Each entity has list / form / detail components (as needed)
- [ ] Routes file with lazy `loadComponent` per route
- [ ] Registered in `dashboard.routes.ts`
- [ ] Sidebar navigation updated
- [ ] All signals — no `BehaviorSubject`
- [ ] All CSS variables — no hardcoded colors
- [ ] `standalone: true` on every component
- [ ] `inject()` for all DI — no constructor injection
