# Next.js API Standards

## Route Handler Pattern

```typescript
// app/api/resources/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getResources, createResource } from '@/lib/dal/resources';
import { auth } from '@/lib/auth';

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const resources = await getResources(session.user.id);
  return NextResponse.json(resources);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const resource = await createResource(session.user.id, parsed.data);
  return NextResponse.json(resource, { status: 201 });
}
```

## Data Access Layer Pattern

```typescript
// lib/dal/resources.ts
import { cache } from 'react';
import { db } from '@/lib/db';

export const getResources = cache(async (userId: string) => {
  return db.resource.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
});

export async function createResource(userId: string, data: CreateResourceInput) {
  return db.resource.create({ data: { ...data, userId } });
}
```

## Server Action Pattern

```typescript
// app/actions/resources.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createResource } from '@/lib/dal/resources';

const Schema = z.object({ title: z.string().min(1) });

export async function createResourceAction(formData: FormData) {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };

  const parsed = Schema.safeParse({ title: formData.get('title') });
  if (!parsed.success) return { success: false, error: 'Invalid input' };

  await createResource(session.user.id, parsed.data);
  revalidatePath('/resources');
  return { success: true };
}
```

## Anti-Patterns

- ❌ Raw ORM queries in route handlers — always use DAL
- ❌ Returning stack traces in error responses
- ❌ Missing auth check before data access
- ❌ Not calling `revalidatePath` after mutations
- ❌ Using `any` type in Zod schemas
