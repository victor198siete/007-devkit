# Workflow: New Angular Component

Follow this checklist every time you create a new standalone Angular 21 component.

---

## Steps

### 1. Identify the Component Type

Determine which category fits:

| Type | Description | Location |
|------|-------------|----------|
| **Page** | Route-level container, loads data, hosts layout | `dashboard/[feature]/` |
| **List** | Displays a collection of items | `dashboard/[feature]/` |
| **Detail** | Shows a single entity's full information | `dashboard/[feature]/detail/` |
| **Form** | Create or edit an entity | `dashboard/[feature]/` |
| **Shared** | Reusable across features | `shared/components/[name]/` |

---

### 2. Create the File

File naming: `[name].component.ts`

```
src/app/dashboard/[feature]/[name].component.ts
```

---

### 3. Write the Component Shell

```typescript
import { Component, inject, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-[name]',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- template here -->
  `,
})
export class [Name]Component {
  // 1. Injected dependencies (private)
  private readonly service = inject([Name]Service);

  // 2. Inputs (if any)
  readonly id = input<string>();

  // 3. Outputs (if any)
  readonly selected = output<Item>();

  // 4. State signals (protected)
  protected readonly items = signal<Item[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // 5. Computed (protected)
  protected readonly count = computed(() => this.items().length);

  // 6. Lifecycle
  async ngOnInit() {
    await this.load();
  }

  // 7. Private methods
  private async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.items.set(await this.service.getAll());
    } catch (e) {
      this.error.set('Failed to load items.');
    } finally {
      this.loading.set(false);
    }
  }
}
```

---

### 4. Build the Template

Use Angular control flow:

```html
@if (loading()) {
  <div class="flex items-center justify-center py-12">
    <div class="w-8 h-8 border-2 border-(--color-primary) border-t-transparent rounded-full animate-spin"></div>
  </div>
} @else if (error()) {
  <p class="text-(--color-danger) text-sm">{{ error() }}</p>
} @else if (items().length === 0) {
  <p class="text-(--color-text-muted) text-sm">No items found.</p>
} @else {
  <ul>
    @for (item of items(); track item.id) {
      <li>{{ item.name }}</li>
    }
  </ul>
}
```

---

### 5. Apply Styles (CSS Variables Only)

```typescript
styles: [`
  :host {
    display: block;
    padding: 1.5rem;
    background-color: var(--color-bg);
  }
`]
```

Never use hardcoded colors. Always use `var(--color-*)` tokens.

---

### 6. Register in Routing (if Page Component)

```typescript
// [feature].routes.ts
{
  path: '[name]',
  loadComponent: () =>
    import('./[name].component').then(m => m.[Name]Component),
},
```

---

### 7. Final Checklist

- [ ] `standalone: true`
- [ ] Template inline (no `templateUrl`)
- [ ] `inject()` for all dependencies
- [ ] `signal()` / `computed()` for all state
- [ ] No `BehaviorSubject` / `Subject`
- [ ] `@if` / `@for` control flow (no `*ngIf` / `*ngFor`)
- [ ] `input()` / `output()` (no `@Input()` / `@Output()`)
- [ ] `protected` for template fields
- [ ] CSS variables only (no hardcoded colors)
- [ ] Loading and error states handled
- [ ] Added to route config if it is a page
