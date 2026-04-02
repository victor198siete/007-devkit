# Next.js 14 App Router Architecture Standards

## Project Structure

```
src/
├── app/                         # App Router root
│   ├── layout.tsx               # Root layout (html, body, providers)
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles + CSS variable tokens
│   ├── error.tsx                # Global error boundary
│   ├── loading.tsx              # Global loading UI
│   ├── not-found.tsx            # 404 page
│   ├── api/                     # Route Handlers
│   │   └── [resource]/
│   │       ├── route.ts         # GET (list), POST
│   │       └── [id]/
│   │           └── route.ts     # GET, PATCH, DELETE
│   └── (dashboard)/             # Route group (no URL segment)
│       ├── layout.tsx           # Dashboard shell
│       └── [feature]/
│           ├── page.tsx         # List page (RSC)
│           ├── [id]/
│           │   └── page.tsx     # Detail page (RSC)
│           ├── new/
│           │   └── page.tsx     # Create form page
│           ├── actions.ts       # Server Actions
│           ├── loading.tsx      # Suspense boundary
│           └── error.tsx        # Error boundary
├── components/
│   ├── ui/                      # Primitive Client Components
│   └── shared/                  # Composite components
├── lib/
│   ├── db.ts                    # Database client (Prisma, Drizzle, etc.)
│   ├── auth.ts                  # Auth helpers
│   └── data/                    # Data access layer
│       └── items.ts             # getItems(), getItemById(), etc.
└── types/
    └── index.ts                 # Shared TypeScript types
```

---

## Rendering Strategy Decision Tree

```
Does the component need:
├── Event handlers / browser APIs / hooks?
│   └── YES → 'use client'
└── NO → Server Component (default)
    └── Does it fetch data?
        ├── YES → async component, await fetch/DB directly
        └── NO → pure RSC markup
```

---

## File Conventions

| File | Purpose |
|------|---------|
| `layout.tsx` | Shared UI for a route segment and its children |
| `page.tsx` | Unique UI for a route (makes route publicly accessible) |
| `loading.tsx` | Instant loading UI with Suspense |
| `error.tsx` | Error UI boundary (`'use client'`) |
| `not-found.tsx` | 404 UI |
| `route.ts` | API Route Handler |
| `actions.ts` | Server Actions (`'use server'`) |
| `middleware.ts` | Runs before requests (auth, redirects) |

---

## Server Components (RSC)

```tsx
// app/(dashboard)/items/page.tsx
import { Suspense } from 'react';
import { getItems } from '@/lib/data/items';
import { ItemsTable } from '@/components/shared/ItemsTable';
import { ItemsTableSkeleton } from '@/components/shared/ItemsTableSkeleton';

export const metadata = { title: 'Items' };

export default async function ItemsPage() {
  // Direct data fetch — no useEffect, no API call from client
  const items = await getItems();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-(--color-text)">Items</h1>
      <Suspense fallback={<ItemsTableSkeleton />}>
        <ItemsTable items={items} />
      </Suspense>
    </div>
  );
}
```

---

## Client Components

```tsx
// components/shared/SearchBar.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  paramName?: string;
}

export function SearchBar({ placeholder = 'Search...', paramName = 'q' }: SearchBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    startTransition(() => {
      const params = new URLSearchParams();
      if (v) params.set(paramName, v);
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <input
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) outline-none focus:ring-2 focus:ring-(--color-primary)"
    />
  );
}
```

---

## Server Actions

```tsx
// app/(dashboard)/items/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';

// Schema validation
const CreateItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

// Return type for progressive enhancement
type ActionResult = {
  error?: Record<string, string[]>;
  message?: string;
};

export async function createItem(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = CreateItemSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    await db.item.create({ data: parsed.data });
  } catch (e) {
    return { message: 'Database error. Please try again.' };
  }

  revalidatePath('/items');
  redirect('/items');
}
```

---

## Data Access Layer

```typescript
// lib/data/items.ts
import { cache } from 'react';
import { db } from '@/lib/db';

// React cache deduplicates requests in the same render
export const getItems = cache(async () => {
  return db.item.findMany({ orderBy: { createdAt: 'desc' } });
});

export const getItemById = cache(async (id: string) => {
  return db.item.findUnique({ where: { id } });
});
```

---

## Route Handlers

```typescript
// app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getItems } from '@/lib/data/items';
import { db } from '@/lib/db';

export async function GET() {
  const items = await getItems();
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const item = await db.item.create({ data: body });
  return NextResponse.json(item, { status: 201 });
}
```

---

## Middleware

```typescript
// middleware.ts (project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  const isAuth = Boolean(token);
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');

  if (!isAuth && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Error and Loading Boundaries

```tsx
// app/(dashboard)/items/loading.tsx
export default function Loading() {
  return (
    <div className="p-6 flex flex-col gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-(--color-surface) rounded-xl h-16 animate-pulse" />
      ))}
    </div>
  );
}

// app/(dashboard)/items/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6 text-center">
      <h2 className="text-lg font-semibold text-(--color-danger)">Something went wrong</h2>
      <p className="text-sm text-(--color-text-muted) mt-1">{error.message}</p>
      <button onClick={reset}
        className="mt-4 bg-(--color-primary) text-(--color-primary-fg) rounded-lg px-4 py-2 text-sm">
        Try again
      </button>
    </div>
  );
}
```
