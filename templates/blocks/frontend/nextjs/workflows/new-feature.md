# Workflow: New Next.js Feature (Route Group + Layout + Pages)

Use this workflow to create a complete feature with list, form, and detail pages using the App Router.

---

## Feature Structure

```
app/(dashboard)/[feature]/
├── layout.tsx               # Optional: feature-level layout
├── page.tsx                 # List page (RSC)
├── new/
│   └── page.tsx             # Create form page
├── [id]/
│   ├── page.tsx             # Detail page (RSC)
│   └── edit/
│       └── page.tsx         # Edit form page
├── actions.ts               # Server Actions
├── loading.tsx              # Loading skeleton
└── error.tsx                # Error boundary

lib/data/
└── [feature].ts             # Data access functions

components/shared/
└── [Feature]Card.tsx        # Optional: reusable card component
```

---

## Step 1: Data Access Layer

```typescript
// lib/data/items.ts
import { cache } from 'react';
import { db } from '@/lib/db';

export const getItems = cache(async (search?: string) => {
  return db.item.findMany({
    where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
    orderBy: { createdAt: 'desc' },
  });
});

export const getItemById = cache(async (id: string) => {
  return db.item.findUnique({ where: { id } });
});
```

---

## Step 2: Server Actions

```typescript
// app/(dashboard)/items/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';

const Schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

type ActionState = { errors?: Record<string, string[]>; message?: string } | null;

export async function createItem(prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await db.item.create({ data: parsed.data });
  revalidatePath('/items');
  redirect('/items');
}

export async function updateItem(id: string, prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await db.item.update({ where: { id }, data: parsed.data });
  revalidatePath('/items');
  revalidatePath(`/items/${id}`);
  redirect(`/items/${id}`);
}

export async function deleteItem(id: string): Promise<ActionState> {
  await db.item.delete({ where: { id } });
  revalidatePath('/items');
  redirect('/items');
}
```

---

## Step 3: List Page

```tsx
// app/(dashboard)/items/page.tsx
import Link from 'next/link';
import { getItems } from '@/lib/data/items';

export const metadata = { title: 'Items' };

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const items = await getItems(searchParams.q);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-(--color-text)">Items</h1>
        <Link
          href="/items/new"
          className="bg-(--color-primary) text-(--color-primary-fg) rounded-lg px-4 py-2 text-sm font-medium"
        >
          New Item
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-(--color-text-muted)">No items yet.</p>
          <Link href="/items/new" className="mt-4 text-sm text-(--color-primary) underline">
            Create your first item
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <Link
              key={item.id}
              href={`/items/${item.id}`}
              className="bg-(--color-surface) border border-(--color-border) rounded-xl p-5 hover:shadow-md transition block"
            >
              <h3 className="font-medium text-(--color-text)">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-(--color-text-muted) mt-1">{item.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Step 4: Create Form Page

```tsx
// app/(dashboard)/items/new/page.tsx
'use client';

import { useActionState } from 'react';
import { createItem } from '../actions';

export default function NewItemPage() {
  const [state, action, isPending] = useActionState(createItem, null);

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-bold text-(--color-text) mb-6">New Item</h1>

      <form action={action} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-(--color-text) mb-1">Name</label>
          <input
            name="name"
            required
            className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) focus:ring-2 focus:ring-(--color-primary) outline-none"
          />
          {state?.errors?.name && (
            <p className="text-xs text-(--color-danger) mt-1">{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-(--color-text) mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) focus:ring-2 focus:ring-(--color-primary) outline-none"
          />
        </div>

        {state?.message && (
          <p className="text-sm text-(--color-danger)">{state.message}</p>
        )}

        <div className="flex gap-3 justify-end">
          <a href="/items" className="border border-(--color-border) text-(--color-text) rounded-lg px-4 py-2 text-sm">
            Cancel
          </a>
          <button
            type="submit"
            disabled={isPending}
            className="bg-(--color-primary) text-(--color-primary-fg) rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## Step 5: Detail Page

```tsx
// app/(dashboard)/items/[id]/page.tsx
import { notFound } from 'next/navigation';
import { getItemById } from '@/lib/data/items';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const item = await getItemById(params.id);
  if (!item) return { title: 'Not Found' };
  return { title: `${item.name} | Items` };
}

export default async function ItemDetailPage({ params }: Props) {
  const item = await getItemById(params.id);
  if (!item) notFound();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-(--color-text)">{item.name}</h1>
      {item.description && (
        <p className="text-sm text-(--color-text-muted) mt-2">{item.description}</p>
      )}
    </div>
  );
}
```

---

## Step 6: Loading and Error Files

```tsx
// loading.tsx
export default function Loading() {
  return (
    <div className="p-6 flex flex-col gap-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-(--color-surface) rounded-xl h-16 animate-pulse border border-(--color-border)" />
      ))}
    </div>
  );
}

// error.tsx
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 text-center">
      <p className="text-(--color-danger) font-medium">Something went wrong</p>
      <button onClick={reset} className="mt-4 text-sm text-(--color-primary) underline">Try again</button>
    </div>
  );
}
```

---

## Final Checklist

- [ ] Data access in `lib/data/[feature].ts` with `cache()`
- [ ] Server Actions in `actions.ts` with `'use server'`
- [ ] List page with metadata and loading state
- [ ] Create form with `useActionState` and field errors
- [ ] Detail page with `notFound()` guard and `generateMetadata()`
- [ ] `loading.tsx` skeleton
- [ ] `error.tsx` boundary with reset
- [ ] CSS variables only — no hardcoded colors
- [ ] TypeScript strict — no `any`
- [ ] `next/link` for all navigation
- [ ] `revalidatePath()` after every mutation
