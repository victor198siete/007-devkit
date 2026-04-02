# React 19 Architecture Standards

## Project Structure

```
src/
├── api/                    # API client functions (one file per resource)
│   ├── items.api.ts
│   └── users.api.ts
├── hooks/                  # Custom hooks (data, UI, shared logic)
│   ├── use-items.ts
│   ├── use-auth.ts
│   └── use-modal.ts
├── components/             # Reusable UI components
│   ├── ui/                 # Primitive: Button, Input, Badge, Card
│   └── shared/             # Composite: PageHeader, EmptyState, Spinner
├── context/                # React Context providers
│   ├── auth.context.tsx
│   └── theme.context.tsx
├── pages/                  # Route-level components (lazy loaded)
│   ├── items/
│   │   ├── ItemsPage.tsx
│   │   ├── ItemDetailPage.tsx
│   │   └── ItemFormPage.tsx
│   └── auth/
│       └── LoginPage.tsx
├── layout/                 # Shell, Sidebar, Topbar
│   └── AppLayout.tsx
├── lib/                    # Utilities, helpers, type guards
│   ├── utils.ts
│   └── validators.ts
├── models/                 # TypeScript interfaces and types
│   └── item.model.ts
└── router/                 # Route definitions
    └── routes.tsx
```

---

## Component Rules

### Functional Components Only

```tsx
// CORRECT
export function MyComponent({ title }: MyComponentProps) {
  return <h1>{title}</h1>;
}

// WRONG
export class MyComponent extends React.Component { }  // never
```

### Named Exports Preferred

```tsx
// Preferred — named exports for better tree-shaking and refactoring
export function ItemCard(props: ItemCardProps) { }

// Default exports only for route-level page components
export default function ItemsPage() { }
```

### Props Interface Convention

```tsx
// Always define props as an interface above the component
interface ItemCardProps {
  item: Item;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function ItemCard({ item, isSelected = false, onSelect }: ItemCardProps) {
  // ...
}
```

### Children Pattern

```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-(--color-surface) rounded-xl border border-(--color-border) p-5 ${className}`}>
      {children}
    </div>
  );
}
```

---

## State Management

### useState for Local UI State

```tsx
const [open, setOpen] = useState(false);
const [tab, setTab] = useState<'profile' | 'settings'>('profile');
```

### useReducer for Complex Local State

```tsx
type State = { step: number; data: Partial<FormData>; errors: Record<string, string> };
type Action =
  | { type: 'NEXT'; payload: Partial<FormData> }
  | { type: 'PREV' }
  | { type: 'SET_ERROR'; field: string; message: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'NEXT': return { ...state, step: state.step + 1, data: { ...state.data, ...action.payload } };
    case 'PREV': return { ...state, step: state.step - 1 };
    default: return state;
  }
}
```

### React Query for Server State

```tsx
// Query (read)
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['items', filter],
  queryFn: () => itemsApi.getAll({ filter }),
  staleTime: 5 * 60 * 1000,
});

// Mutation (write)
const { mutate: createItem, isPending } = useMutation({
  mutationFn: itemsApi.create,
  onSuccess: (newItem) => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
    toast.success('Item created');
  },
  onError: (error) => {
    toast.error('Failed to create item');
  },
});
```

### Context for Global State

```tsx
// context/theme.context.tsx
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

---

## Custom Hooks

Every hook lives in `src/hooks/` and is prefixed with `use`:

```typescript
// hooks/use-item.ts
export function useItem(id: string) {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => itemsApi.getById(id),
    enabled: Boolean(id),
  });
}

// hooks/use-debounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

---

## Routing

```tsx
// router/routes.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/layout/AppLayout';
import { Spinner } from '@/components/shared/Spinner';

const ItemsPage = lazy(() => import('@/pages/items/ItemsPage'));
const ItemDetailPage = lazy(() => import('@/pages/items/ItemDetailPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: 'items',
        element: (
          <Suspense fallback={<Spinner />}>
            <ItemsPage />
          </Suspense>
        ),
      },
      {
        path: 'items/:id',
        element: (
          <Suspense fallback={<Spinner />}>
            <ItemDetailPage />
          </Suspense>
        ),
      },
    ],
  },
]);
```

---

## Forms with React Hook Form + Zod

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ItemForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase `.tsx` | `ItemCard.tsx` |
| Pages | PascalCase `Page.tsx` | `ItemsPage.tsx` |
| Hooks | camelCase `use-*.ts` | `use-items.ts` |
| API clients | kebab `*.api.ts` | `items.api.ts` |
| Models | kebab `*.model.ts` | `item.model.ts` |
| Context | kebab `*.context.tsx` | `auth.context.tsx` |
| Utilities | kebab `*.ts` | `date-utils.ts` |
