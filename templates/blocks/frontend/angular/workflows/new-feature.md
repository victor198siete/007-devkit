# Workflow: New Angular Feature (List / Create / Detail)

This workflow covers creating a complete feature module with list, create form, and detail view using the standard Angular 21 pattern.

---

## Overview

A full feature consists of:

```
dashboard/[feature]/
├── [feature].routes.ts         # Lazy-loaded route config
├── [feature]-list.component.ts # List view (index)
├── [feature]-form.component.ts # Create / edit form
├── [feature]-detail.component.ts  # Detail / show view
├── [feature].repo.ts           # RepoHttp data service
└── [feature].models.ts         # TypeScript interfaces / DTOs
```

---

## Step 1: Define Models

```typescript
// [feature].models.ts
export interface Item {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface CreateItemDto {
  name: string;
  description?: string;
}

export type UpdateItemDto = Partial<CreateItemDto>;
```

---

## Step 2: Create the Repo

```typescript
// [feature].repo.ts
import { Injectable, inject } from '@angular/core';
import { RepoHttp } from '@core/repo-http';
import { Item, CreateItemDto, UpdateItemDto } from './[feature].models';

@Injectable({ providedIn: 'root' })
export class ItemsRepo {
  private readonly http = inject(RepoHttp);
  private readonly base = '/items';

  async getAll(): Promise<Item[]> {
    return this.http.get<Item[]>(this.base);
  }

  async getById(id: string): Promise<Item> {
    return this.http.get<Item>(`${this.base}/${id}`);
  }

  async create(payload: CreateItemDto): Promise<Item> {
    return this.http.post<Item>(this.base, payload);
  }

  async update(id: string, payload: UpdateItemDto): Promise<Item> {
    return this.http.patch<Item>(`${this.base}/${id}`, payload);
  }

  async remove(id: string): Promise<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
```

---

## Step 3: Create the List Component

```typescript
// [feature]-list.component.ts
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ItemsRepo } from './[feature].repo';
import { Item } from './[feature].models';

@Component({
  selector: 'app-items-list',
  standalone: true,
  imports: [/* PageHeaderComponent, SummaryCardComponent */],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-(--color-text)">Items</h1>
        <button
          (click)="create()"
          class="bg-(--color-primary) text-(--color-primary-fg) rounded-lg px-4 py-2 text-sm font-medium"
        >
          New Item
        </button>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="w-8 h-8 border-2 border-(--color-primary) border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (items().length === 0) {
        <div class="flex flex-col items-center py-16 text-center">
          <p class="text-(--color-text-muted)">No items yet.</p>
        </div>
      } @else {
        <div class="grid gap-4">
          @for (item of items(); track item.id) {
            <div
              class="bg-(--color-surface) border border-(--color-border) rounded-xl p-5 cursor-pointer hover:shadow-md transition"
              (click)="view(item.id)"
            >
              <h3 class="font-medium text-(--color-text)">{{ item.name }}</h3>
              @if (item.description) {
                <p class="text-sm text-(--color-text-muted) mt-1">{{ item.description }}</p>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ItemsListComponent {
  private readonly repo = inject(ItemsRepo);
  private readonly router = inject(Router);

  protected readonly items = signal<Item[]>([]);
  protected readonly loading = signal(false);

  async ngOnInit() {
    this.loading.set(true);
    try {
      this.items.set(await this.repo.getAll());
    } finally {
      this.loading.set(false);
    }
  }

  protected create() {
    this.router.navigate(['/dashboard/items/new']);
  }

  protected view(id: string) {
    this.router.navigate(['/dashboard/items', id]);
  }
}
```

---

## Step 4: Create the Form Component

```typescript
// [feature]-form.component.ts
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ItemsRepo } from './[feature].repo';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-lg">
      <h1 class="text-2xl font-bold text-(--color-text) mb-6">New Item</h1>

      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-(--color-text) mb-1">Name</label>
          <input
            formControlName="name"
            type="text"
            class="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) focus:ring-2 focus:ring-(--color-primary) outline-none"
          />
          @if (form.controls.name.invalid && form.controls.name.touched) {
            <p class="text-xs text-(--color-danger) mt-1">Name is required.</p>
          }
        </div>

        <div>
          <label class="block text-sm font-medium text-(--color-text) mb-1">Description</label>
          <textarea
            formControlName="description"
            rows="3"
            class="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) focus:ring-2 focus:ring-(--color-primary) outline-none"
          ></textarea>
        </div>

        <div class="flex gap-3 justify-end mt-2">
          <button type="button" (click)="cancel()"
            class="border border-(--color-border) text-(--color-text) rounded-lg px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="submit" [disabled]="form.invalid || saving()"
            class="bg-(--color-primary) text-(--color-primary-fg) rounded-lg px-4 py-2 text-sm disabled:opacity-50">
            {{ saving() ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ItemFormComponent {
  private readonly repo = inject(ItemsRepo);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly saving = signal(false);
  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
  });

  protected async submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    try {
      await this.repo.create(this.form.getRawValue() as any);
      this.router.navigate(['/dashboard/items']);
    } finally {
      this.saving.set(false);
    }
  }

  protected cancel() {
    this.router.navigate(['/dashboard/items']);
  }
}
```

---

## Step 5: Create the Detail Component

```typescript
// [feature]-detail.component.ts
import { Component, inject, signal, input } from '@angular/core';
import { ItemsRepo } from './[feature].repo';
import { Item } from './[feature].models';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [],
  template: `
    <div class="p-6">
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="w-8 h-8 border-2 border-(--color-primary) border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (item()) {
        <h1 class="text-2xl font-bold text-(--color-text)">{{ item()!.name }}</h1>
        <p class="text-sm text-(--color-text-muted) mt-2">{{ item()!.description }}</p>
      }
    </div>
  `,
})
export class ItemDetailComponent {
  private readonly repo = inject(ItemsRepo);

  readonly id = input.required<string>();
  protected readonly item = signal<Item | null>(null);
  protected readonly loading = signal(false);

  async ngOnInit() {
    this.loading.set(true);
    try {
      this.item.set(await this.repo.getById(this.id()));
    } finally {
      this.loading.set(false);
    }
  }
}
```

---

## Step 6: Create Routes

```typescript
// [feature].routes.ts
import { Routes } from '@angular/router';

export const ITEMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./[feature]-list.component').then(m => m.ItemsListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./[feature]-form.component').then(m => m.ItemFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./[feature]-detail.component').then(m => m.ItemDetailComponent),
  },
];
```

---

## Step 7: Register in Dashboard Routes

```typescript
// dashboard.routes.ts
{
  path: 'items',
  loadChildren: () =>
    import('./items/items.routes').then(m => m.ITEMS_ROUTES),
},
```

---

## Final Checklist

- [ ] `[feature].models.ts` with typed interfaces
- [ ] `[feature].repo.ts` with `RepoHttp` + `async/await`
- [ ] List component with loading, empty, and data states
- [ ] Form component with `ReactiveFormsModule`, `saving` signal
- [ ] Detail component loads by `id` input
- [ ] Routes file with lazy `loadComponent`
- [ ] Registered in parent `dashboard.routes.ts`
- [ ] No hardcoded colors — CSS variables only
- [ ] All signals, no `BehaviorSubject`
