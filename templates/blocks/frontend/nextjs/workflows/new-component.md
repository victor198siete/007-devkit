# Workflow: New Next.js Component or Page

Follow this checklist every time you create a new Next.js 14 App Router component or page.

---

## Decision: Server or Client Component?

Ask these questions in order:

1. Does it use `onClick`, `onChange`, or any other event handler? → **Client**
2. Does it use `useState`, `useEffect`, `useContext`, or any React hook? → **Client**
3. Does it use browser-only APIs (`window`, `localStorage`, `navigator`)? → **Client**
4. Does it use a third-party library that requires browser APIs? → **Client**
5. Otherwise → **Server Component** (default, no directive needed)

---

## New Page (Server Component)

### 1. Create the file

```
app/(dashboard)/[feature]/page.tsx
```

### 2. Write the page

```tsx
// app/(dashboard)/items/page.tsx
import { getItems } from '@/lib/data/items';

// Static metadata
export const metadata = {
  title: 'Items | MyApp',
};

// Or dynamic:
// export async function generateMetadata({ params }) { ... }

export default async function ItemsPage() {
  const items = await getItems();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-(--color-text)">Items</h1>
      {items.length === 0 ? (
        <p className="text-(--color-text-muted) mt-4">No items found.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {items.map(item => (
            <li key={item.id}
              className="bg-(--color-surface) border border-(--color-border) rounded-xl p-5">
              <h3 className="font-medium text-(--color-text)">{item.name}</h3>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 3. Add loading UI

```tsx
// app/(dashboard)/items/loading.tsx
export default function Loading() {
  return (
    <div className="p-6 flex flex-col gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-(--color-surface) rounded-xl h-16 animate-pulse border border-(--color-border)" />
      ))}
    </div>
  );
}
```

### 4. Add error boundary

```tsx
// app/(dashboard)/items/error.tsx
'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 text-center">
      <p className="text-(--color-danger)">{error.message}</p>
      <button onClick={reset} className="mt-4 text-sm text-(--color-primary) underline">
        Try again
      </button>
    </div>
  );
}
```

---

## New Client Component

### 1. Identify the need for `'use client'`

Only add `'use client'` if one of the conditions in the decision tree is met.

### 2. Create the file

```
components/shared/[ComponentName].tsx
```

### 3. Write the component

```tsx
// components/shared/DeleteButton.tsx
'use client';

import { useState, useTransition } from 'react';
import { deleteItem } from '@/app/(dashboard)/items/actions';

interface DeleteButtonProps {
  itemId: string;
  onDeleted?: () => void;
}

export function DeleteButton({ itemId, onDeleted }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteItem(itemId);
      if (result?.error) {
        setError(result.error);
      } else {
        onDeleted?.();
      }
    });
  };

  return (
    <div>
      {error && <p className="text-xs text-(--color-danger)">{error}</p>}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="bg-(--color-danger) text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
      >
        {isPending ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}
```

---

## Final Checklist

- [ ] Default to Server Component — no unnecessary `'use client'`
- [ ] `metadata` or `generateMetadata()` on every page
- [ ] `loading.tsx` for pages that fetch data
- [ ] `error.tsx` for route segments with potential errors
- [ ] Server Actions in `actions.ts` for mutations
- [ ] `next/image` for any images
- [ ] CSS variables only — no hardcoded colors
- [ ] TypeScript strict — typed props interface
- [ ] No `any` types
