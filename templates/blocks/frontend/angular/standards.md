# Angular 21 Architecture Standards

## Project Structure

```
src/app/
├── core/                    # Singleton services, guards, interceptors
│   ├── auth/
│   ├── guards/
│   ├── interceptors/
│   └── services/
├── repos/                   # RepoHttp-based data services (one per entity)
│   ├── users.repo.ts
│   └── items.repo.ts
├── shared/                  # Reusable standalone components, pipes, directives
│   ├── components/
│   │   ├── page-header/
│   │   ├── summary-card/
│   │   └── icon/
│   ├── pipes/
│   └── directives/
├── layout/                  # Shell, sidebar, topbar, tabs
│   ├── sidebar/
│   └── topbar/
├── auth/                    # Login, register, password reset pages
│   └── login/
└── dashboard/               # Feature modules (lazy loaded)
    ├── dashboard.routes.ts
    ├── home/
    └── [feature]/
        ├── [feature].routes.ts
        ├── list/
        ├── detail/
        └── shared/
```

---

## Component Rules

### Always Standalone

```typescript
@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [/* explicit imports */],
  template: `...`,
})
export class MyComponent { }
```

No `NgModule`. No `declarations`. Always `standalone: true`.

### Template Inline

```typescript
// CORRECT
@Component({
  template: `<h1>Hello</h1>`,
})

// WRONG
@Component({
  templateUrl: './my.component.html',  // never
})
```

### Dependency Injection

```typescript
// CORRECT
export class MyComponent {
  private readonly service = inject(MyService);
}

// WRONG
export class MyComponent {
  constructor(private service: MyService) {}  // never
}
```

### Field Visibility

```typescript
export class MyComponent {
  // private: logic not referenced in template
  private readonly router = inject(Router);

  // protected: referenced in template
  protected readonly items = signal<Item[]>([]);
  protected readonly loading = signal(false);
}
```

### Inputs and Outputs

```typescript
// CORRECT
readonly title = input.required<string>();
readonly subtitle = input<string>('');
readonly selected = output<Item>();

// WRONG
@Input() title: string;          // never
@Output() selected = new EventEmitter();  // never
```

---

## State Management

### Signals Only

```typescript
// Mutable state
readonly count = signal(0);

// Derived (read-only)
readonly doubled = computed(() => this.count() * 2);

// Derived but writable
readonly visibleItems = linkedSignal(() =>
  this.allItems().filter(i => !i.archived)
);

// Side effects
constructor() {
  effect(() => {
    localStorage.setItem('count', String(this.count()));
  });
}
```

### No RxJS for State

| Prohibited | Use Instead |
|------------|------------|
| `BehaviorSubject` | `signal()` |
| `Subject` | `output()` or `signal()` |
| `ReplaySubject` | `signal()` |
| `async` pipe for state | signal in template |
| `.subscribe()` for state | `effect()` or `toSignal()` |

`toSignal()` is permitted only to bridge unavoidable third-party observables.

---

## Services (RepoHttp Pattern)

```typescript
@Injectable({ providedIn: 'root' })
export class ItemsRepo {
  private readonly http = inject(RepoHttp);
  private readonly base = '/items';

  async getAll(params?: Record<string, string>): Promise<Item[]> {
    return this.http.get<Item[]>(this.base, { params });
  }

  async getById(id: string): Promise<Item> {
    return this.http.get<Item>(`${this.base}/${id}`);
  }

  async create(payload: CreateItemDto): Promise<Item> {
    return this.http.post<Item>(this.base, payload);
  }

  async update(id: string, payload: Partial<CreateItemDto>): Promise<Item> {
    return this.http.patch<Item>(`${this.base}/${id}`, payload);
  }

  async remove(id: string): Promise<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
```

Rules:
- File named `*.repo.ts` in `src/app/repos/`
- `providedIn: 'root'` unless scoped to a feature
- `async/await` throughout — no `.subscribe()`
- Return `Promise<T>` — never `Observable<T>`

---

## Routing

### Lazy Loading

```typescript
// dashboard.routes.ts
export const DASHBOARD_ROUTES: Routes = [
  {
    path: 'items',
    loadComponent: () =>
      import('./items/items-list.component').then(m => m.ItemsListComponent),
  },
  {
    path: 'items/:id',
    loadComponent: () =>
      import('./items/item-detail.component').then(m => m.ItemDetailComponent),
  },
];
```

Rules:
- Every feature route uses `loadComponent` (lazy)
- No eager imports of feature components in routing
- Group related routes into `[feature].routes.ts` files
- Use `canActivate` with functional guards

### Functional Guards

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login']);
};
```

---

## Control Flow

```html
<!-- CORRECT — Angular control flow -->
@if (loading()) {
  <app-spinner />
} @else if (items().length === 0) {
  <p>No items found.</p>
} @else {
  <ul>
    @for (item of items(); track item.id) {
      <li>{{ item.name }}</li>
    }
  </ul>
}

<!-- WRONG -->
<!-- <div *ngIf="loading">...</div>        never -->
<!-- <li *ngFor="let item of items">...     never -->
```

---

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Component | `*.component.ts` | `items-list.component.ts` |
| Service / Repo | `*.repo.ts` / `*.service.ts` | `items.repo.ts` |
| Guard | `*.guard.ts` | `auth.guard.ts` |
| Interceptor | `*.interceptor.ts` | `token.interceptor.ts` |
| Pipe | `*.pipe.ts` | `date-format.pipe.ts` |
| Routes | `*.routes.ts` | `dashboard.routes.ts` |
| Model/DTO | `*.models.ts` | `items.models.ts` |

---

## TypeScript Conventions

```typescript
// Prefer interfaces for object shapes
interface Item {
  id: string;
  name: string;
  createdAt: Date;
}

// Use type for unions and utility types
type ItemStatus = 'active' | 'archived' | 'draft';

// Never use any — prefer unknown with narrowing
function process(data: unknown): Item {
  if (!isItem(data)) throw new Error('Invalid data');
  return data;
}

// Explicit return types on public service methods
async getAll(): Promise<Item[]> { ... }
```
