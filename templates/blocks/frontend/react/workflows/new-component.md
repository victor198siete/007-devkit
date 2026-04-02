# Workflow: New React Component

Follow this checklist every time you create a new React 19 component.

---

## Steps

### 1. Identify the Component Type

| Type | Description | Location |
|------|-------------|----------|
| **Page** | Route-level, fetches data | `src/pages/[feature]/` |
| **Feature** | Smart component with data hook | `src/pages/[feature]/` |
| **UI Primitive** | Stateless, purely presentational | `src/components/ui/` |
| **Shared** | Composite, reusable across features | `src/components/shared/` |

---

### 2. Define Props Interface

```tsx
// Always declare props interface above the component
interface MyComponentProps {
  // Required props first
  item: Item;
  // Optional props with defaults last
  variant?: 'default' | 'compact';
  onSelect?: (id: string) => void;
  className?: string;
}
```

---

### 3. Write the Component

```tsx
// src/components/shared/ItemCard.tsx
import { useState } from 'react';

interface ItemCardProps {
  item: Item;
  onSelect?: (id: string) => void;
}

export function ItemCard({ item, onSelect }: ItemCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="
        bg-(--color-surface)
        border border-(--color-border)
        rounded-xl p-5
        cursor-pointer
        transition
        hover:shadow-md
      "
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect?.(item.id)}
    >
      <h3 className="font-medium text-(--color-text)">{item.name}</h3>
      {item.description && (
        <p className="text-sm text-(--color-text-muted) mt-1">{item.description}</p>
      )}
    </div>
  );
}
```

---

### 4. For Data-Fetching Components, Use a Custom Hook

```tsx
// hooks/use-items.ts
import { useQuery } from '@tanstack/react-query';
import { itemsApi } from '@/api/items.api';

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: itemsApi.getAll,
  });
}

// pages/items/ItemsPage.tsx
import { useItems } from '@/hooks/use-items';
import { ItemCard } from '@/components/shared/ItemCard';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';

export default function ItemsPage() {
  const { data: items = [], isLoading, error } = useItems();

  if (isLoading) return <Spinner />;
  if (error) return <p className="text-(--color-danger)">Failed to load items.</p>;
  if (items.length === 0) return <EmptyState message="No items yet." />;

  return (
    <div className="p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-(--color-text)">Items</h1>
      <ul className="flex flex-col gap-3">
        {items.map(item => (
          <li key={item.id}>
            <ItemCard item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

### 5. Apply Styles (CSS Variables Only)

```tsx
// CORRECT
<div className="bg-(--color-surface) border border-(--color-border)">

// WRONG
<div className="bg-white border-gray-200">  // never hardcoded
```

---

### 6. Register in Router (if Page Component)

```tsx
// router/routes.tsx
const ItemsPage = lazy(() => import('@/pages/items/ItemsPage'));

{
  path: 'items',
  element: (
    <Suspense fallback={<Spinner />}>
      <ItemsPage />
    </Suspense>
  ),
}
```

---

### 7. Final Checklist

- [ ] Functional component (no class components)
- [ ] Props interface defined
- [ ] TypeScript strict — no `any`
- [ ] Custom hook for data-fetching logic
- [ ] React Query for server state
- [ ] CSS variables only — no hardcoded colors
- [ ] Keys on all list renders
- [ ] Loading and error states handled
- [ ] Lazy loading if it is a page component
- [ ] Named export (default only for pages)
