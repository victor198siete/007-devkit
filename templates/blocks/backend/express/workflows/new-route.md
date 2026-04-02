# Workflow: New Express Route / Endpoint

Follow these steps when adding a new resource or endpoint to an Express/Fastify + TypeScript project.

---

## Pre-flight

Before starting:
- [ ] Session initialized (`agents/workflows/init-session.md` completed)
- [ ] Resource name agreed (singular noun for code, plural for URL: `user` → `/users`)
- [ ] HTTP method and path confirmed
- [ ] Auth/authorization requirements confirmed (public? JWT required? Role restricted?)
- [ ] Request/response shape defined

---

## Step 1 — Define the Zod Schema

File: `src/schemas/<resource-name>.schema.ts`

Create schemas for every operation that accepts input:

```typescript
import { z } from 'zod';

// Create schema
export const create<Resource>Schema = z.object({
  body: z.object({
    // required fields
    name: z.string().min(1).max(255),
    // optional fields
    description: z.string().optional(),
  }),
});

// Update schema (partial body)
export const update<Resource>Schema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: create<Resource>Schema.shape.body.partial(),
});

// List query schema
export const list<Resource>Schema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
  }),
});

// Export inferred types for use in service layer
export type Create<Resource>Input = z.infer<typeof create<Resource>Schema>['body'];
export type Update<Resource>Input = z.infer<typeof update<Resource>Schema>['body'];
export type List<Resource>Query = z.infer<typeof list<Resource>Schema>['query'];
```

---

## Step 2 — Create the Service

File: `src/services/<resource-name>.service.ts`

The service contains all business logic and data access. It must not import `Request` or `Response` from Express.

```typescript
import { HttpError } from '../utils/http-error';
import { logger } from '../utils/logger';
import { config } from '../config';
import type { Create<Resource>Input, List<Resource>Query, Update<Resource>Input } from '../schemas/<resource-name>.schema';

export async function create(input: Create<Resource>Input, actorId: string) {
  // Check for duplicates if needed
  // const existing = await db.resource.findUnique({ where: { name: input.name } });
  // if (existing) throw HttpError.conflict('<Resource> with that name already exists');

  // Create record
  // const record = await db.resource.create({ data: { ...input } });

  logger.info({ id: record.id, actorId }, '<Resource> created');
  return record;
}

export async function findAll(query: List<Resource>Query) {
  const { page, limit, search } = query;
  // Paginated query with optional search filter
  // const [data, total] = await Promise.all([...]);
  return { data, total, page, limit };
}

export async function findOne(id: string) {
  // const record = await db.resource.findUnique({ where: { id } });
  if (!record) throw HttpError.notFound(`<Resource> ${id} not found`);
  return record;
}

export async function update(id: string, input: Update<Resource>Input, actorId: string) {
  await findOne(id); // validates existence
  // const updated = await db.resource.update({ where: { id }, data: input });
  logger.info({ id, actorId }, '<Resource> updated');
  return updated;
}

export async function remove(id: string, actorId: string) {
  await findOne(id); // validates existence
  // await db.resource.delete({ where: { id } });
  logger.info({ id, actorId }, '<Resource> deleted');
}
```

---

## Step 3 — Create the Controller

File: `src/controllers/<resource-name>.controller.ts`

Controllers handle request/response only. No business logic, no DB calls.

```typescript
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as service from '../services/<resource-name>.service';

export async function create(req: Request, res: Response): Promise<void> {
  const result = await service.create(req.body, req.user!.sub);
  res.status(StatusCodes.CREATED).json(result);
}

export async function findAll(req: Request, res: Response): Promise<void> {
  const result = await service.findAll(req.query as any);
  res.status(StatusCodes.OK).json(result);
}

export async function findOne(req: Request, res: Response): Promise<void> {
  const result = await service.findOne(req.params.id);
  res.status(StatusCodes.OK).json(result);
}

export async function update(req: Request, res: Response): Promise<void> {
  const result = await service.update(req.params.id, req.body, req.user!.sub);
  res.status(StatusCodes.OK).json(result);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await service.remove(req.params.id, req.user!.sub);
  res.status(StatusCodes.NO_CONTENT).send();
}
```

---

## Step 4 — Create the Route File

File: `src/routes/<resource-name>.routes.ts`

```typescript
import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/roles.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  create<Resource>Schema,
  update<Resource>Schema,
  list<Resource>Schema,
} from '../schemas/<resource-name>.schema';
import * as controller from '../controllers/<resource-name>.controller';

export const <resourceName>Router = Router();

<resourceName>Router.post(
  '/',
  authenticate,
  requireRole('admin'),          // adjust roles as needed
  validate(create<Resource>Schema),
  asyncHandler(controller.create),
);

<resourceName>Router.get(
  '/',
  authenticate,
  validate(list<Resource>Schema),
  asyncHandler(controller.findAll),
);

<resourceName>Router.get(
  '/:id',
  authenticate,
  asyncHandler(controller.findOne),
);

<resourceName>Router.patch(
  '/:id',
  authenticate,
  requireRole('admin'),
  validate(update<Resource>Schema),
  asyncHandler(controller.update),
);

<resourceName>Router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  asyncHandler(controller.remove),
);
```

---

## Step 5 — Mount in Route Index

File: `src/routes/index.ts`

```typescript
import { Router } from 'express';
import { usersRouter } from './<existing>.routes';
import { <resourceName>Router } from './<resource-name>.routes';

export const router = Router();

router.use('/users', usersRouter);
// ... existing routes
router.use('/<resource-names>', <resourceName>Router);
```

---

## Step 6 — Run and Verify

```bash
# TypeScript compile check
npx tsc --noEmit

# Start dev server
npm run dev

# Test the new endpoints manually or with a REST client
# Verify:
# - 201 on successful create
# - 400 on invalid input (Zod validation)
# - 401 on missing/invalid JWT
# - 403 on insufficient role
# - 404 on non-existent resource
# - 409 on duplicate (if applicable)
```

---

## Verification Checklist

- [ ] Zod schema covers all input shapes (body, params, query)
- [ ] Types exported from schema and used in service
- [ ] Service throws `HttpError.*` for all error cases
- [ ] Service does not import Request/Response
- [ ] Controller delegates entirely to service
- [ ] All controller methods are `async` and return `Promise<void>`
- [ ] Route file: auth middleware applied, role guard applied, validate called, asyncHandler used
- [ ] Route mounted in `src/routes/index.ts`
- [ ] Application starts without errors
- [ ] All error cases return correct HTTP status codes
- [ ] No `console.log`, `process.env` direct access, or `: any` introduced
- [ ] `@security` review requested if route handles auth, PII, or financial data
