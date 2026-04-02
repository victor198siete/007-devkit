# Workflow: New React Feature Module (List / Form / Detail)

Use this workflow to create a complete feature with list, create/edit form, and detail view.

---

## Feature Structure

```
src/
├── api/
│   └── items.api.ts            # API client functions
├── hooks/
│   ├── use-items.ts            # useQuery hooks
│   └── use-item-mutations.ts   # useMutation hooks
├── models/
│   └── item.model.ts           # TypeScript interfaces
└── pages/
    └── items/
        ├── ItemsPage.tsx        # List view (index)
        ├── ItemFormPage.tsx     # Create / edit form
        └── ItemDetailPage.tsx   # Detail view
```

---

## Step 1: Define Models

```typescript
// models/item.model.ts
export interface Item {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface CreateItemDto {
  name: string;
  description?: string;
}

export type UpdateItemDto = Partial<CreateItemDto>;
```

---

## Step 2: Create API Client

```typescript
// api/items.api.ts
const BASE = '/api/items';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message ?? 'Request failed');
  }
  return res.json();
}

export const itemsApi = {
  getAll: (): Promise<Item[]> => request(BASE),
  getById: (id: string): Promise<Item> => request(`${BASE}/${id}`),
  create: (dto: CreateItemDto): Promise<Item> =>
    request(BASE, { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: string, dto: UpdateItemDto): Promise<Item> =>
    request(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  remove: (id: string): Promise<void> =>
    request(`${BASE}/${id}`, { method: 'DELETE' }),
};
```

---

## Step 3: Create Hooks

```typescript
// hooks/use-items.ts
import { useQuery } from '@tanstack/react-query';
import { itemsApi } from '@/api/items.api';

export const itemsQueryKey = ['items'] as const;

export function useItems() {
  return useQuery({
    queryKey: itemsQueryKey,
    queryFn: itemsApi.getAll,
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => itemsApi.getById(id),
    enabled: Boolean(id),
  });
}

// hooks/use-item-mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '@/api/items.api';
import { itemsQueryKey } from './use-items';

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: itemsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: itemsQueryKey }),
  });
}

export function useUpdateItem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateItemDto) => itemsApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemsQueryKey });
      qc.invalidateQueries({ queryKey: ['items', id] });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: itemsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: itemsQueryKey }),
  });
}
```

---

## Step 4: List Page

```tsx
// pages/items/ItemsPage.tsx
import { useNavigate } from 'react-router-dom';
import { useItems } from '@/hooks/use-items';

export default function ItemsPage() {
  const navigate = useNavigate();
  const { data: items = [], isLoading, error } = useItems();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-(--color-primary) border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-(--color-danger) p-6">Failed to load items.</p>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-(--color-text)">Items</h1>
        <button
          onClick={() => navigate('/items/new')}
          className="bg-(--color-primary) text-(--color-primary-fg) rounded-lg px-4 py-2 text-sm font-medium"
        >
          New Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-(--color-text-muted)">No items yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <div
              key={item.id}
              onClick={() => navigate(`/items/${item.id}`)}
              className="bg-(--color-surface) border border-(--color-border) rounded-xl p-5 cursor-pointer hover:shadow-md transition"
            >
              <h3 className="font-medium text-(--color-text)">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-(--color-text-muted) mt-1">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Step 5: Form Page

```tsx
// pages/items/ItemFormPage.tsx
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateItem } from '@/hooks/use-item-mutations';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ItemFormPage() {
  const navigate = useNavigate();
  const { mutateAsync: createItem } = useCreateItem();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await createItem(data);
    navigate('/items');
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-bold text-(--color-text) mb-6">New Item</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-(--color-text) mb-1">Name</label>
          <input
            {...register('name')}
            className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) focus:ring-2 focus:ring-(--color-primary) outline-none"
          />
          {errors.name && <p className="text-xs text-(--color-danger) mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-(--color-text) mb-1">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) focus:ring-2 focus:ring-(--color-primary) outline-none"
          />
        </div>

        <div className="flex gap-3 justify-end mt-2">
          <button type="button" onClick={() => navigate('/items')}
            className="border border-(--color-border) text-(--color-text) rounded-lg px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="bg-(--color-primary) text-(--color-primary-fg) rounded-lg px-4 py-2 text-sm disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## Step 6: Detail Page

```tsx
// pages/items/ItemDetailPage.tsx
import { useParams } from 'react-router-dom';
import { useItem } from '@/hooks/use-items';

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading, error } = useItem(id!);

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-(--color-primary) border-t-transparent rounded-full animate-spin" /></div>;
  if (error || !item) return <p className="text-(--color-danger) p-6">Item not found.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-(--color-text)">{item.name}</h1>
      {item.description && <p className="text-sm text-(--color-text-muted) mt-2">{item.description}</p>}
    </div>
  );
}
```

---

## Step 7: Add Routes

```tsx
// In router/routes.tsx
const ItemsPage = lazy(() => import('@/pages/items/ItemsPage'));
const ItemFormPage = lazy(() => import('@/pages/items/ItemFormPage'));
const ItemDetailPage = lazy(() => import('@/pages/items/ItemDetailPage'));

// Add to children of AppLayout:
{ path: 'items', element: <Suspense fallback={<Spinner />}><ItemsPage /></Suspense> },
{ path: 'items/new', element: <Suspense fallback={<Spinner />}><ItemFormPage /></Suspense> },
{ path: 'items/:id', element: <Suspense fallback={<Spinner />}><ItemDetailPage /></Suspense> },
```

---

## Final Checklist

- [ ] Models interface file created
- [ ] API client with typed methods
- [ ] `useQuery` hooks in `hooks/`
- [ ] `useMutation` hooks with cache invalidation
- [ ] List page with loading / empty / data states
- [ ] Form with React Hook Form + Zod validation
- [ ] Detail page using `useParams`
- [ ] Routes added with lazy loading + Suspense
- [ ] CSS variables only — no hardcoded colors
- [ ] No prop drilling beyond 2 levels
