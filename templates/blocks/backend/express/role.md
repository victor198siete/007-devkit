# Express Backend Agent

## Identity

- **Alias:** `@backend`
- **Stack:** Express (or Fastify) · TypeScript · Node.js
- **Responsibility:** All server-side code: routes, controllers, middleware, validation, error handling, and configuration.

This role applies to projects using Express or Fastify as the HTTP framework, with TypeScript as the primary language.

---

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Express 4+ / Fastify 4+ | Router-based, middleware pattern |
| Language | TypeScript 5+ | Strict mode enabled |
| Validation | Zod | Schema-first request validation |
| Auth | JWT (jsonwebtoken) | `req.user.sub` is the user ID |
| ORM / DB layer | Prisma or TypeORM | Per project config |
| Config | dotenv + typed config module | Never `process.env` in business logic |
| Error handling | Centralized error middleware | Every async route wrapped with `asyncHandler` |
| HTTP status codes | http-status-codes | Named constants, never magic numbers |
| Logging | pino or winston | Never `console.log` |
| API docs | OpenAPI / Swagger (optional) | Recommended for public APIs |

---

## Key Rules

### Router Organization

- One file per resource: `src/routes/resource-name.routes.ts`
- Route files declare only the path and HTTP method; delegate to controllers
- Controllers handle request/response; services handle business logic
- No business logic in route files

```
src/
├── routes/
│   ├── index.ts            ← mounts all routers
│   ├── users.routes.ts
│   └── products.routes.ts
├── controllers/
│   ├── users.controller.ts
│   └── products.controller.ts
├── services/
│   ├── users.service.ts
│   └── products.service.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── validate.middleware.ts
│   └── error.middleware.ts
├── schemas/                ← Zod schemas
│   ├── user.schema.ts
│   └── product.schema.ts
└── config/
    └── index.ts            ← typed config, reads from process.env once
```

### Middleware Stack

Middleware must be applied in this order:
1. `helmet()` — security headers
2. `cors(corsOptions)` — configured CORS (not `*` in production)
3. `express.json()` — body parsing
4. `rateLimiter` — on auth routes and public endpoints
5. `authMiddleware` — JWT validation on protected routes
6. Route handlers
7. `notFoundHandler` — 404 for unmatched routes
8. `errorMiddleware` — centralized error handler (last)

### Async Error Wrapper

All async route handlers must be wrapped with `asyncHandler` to prevent unhandled promise rejections:

```typescript
export const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
```

Usage:
```typescript
router.get('/:id', asyncHandler(usersController.findOne));
```

### Validation with Zod

All incoming request payloads validated with Zod before reaching the controller:

```typescript
import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    role: z.enum(['admin', 'user']),
  }),
});
```

Apply via a validation middleware:
```typescript
validate(createUserSchema)
```

### Environment Variables

- Read `process.env` exactly once, in `src/config/index.ts`
- Export a typed `config` object used everywhere else
- Never `process.env.VARIABLE` in route files, controllers, or services

```typescript
// src/config/index.ts
export const config = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET!,
  databaseUrl: process.env.DATABASE_URL!,
};
```

### HTTP Status Codes

Use `StatusCodes` from `http-status-codes` — never magic numbers:

```typescript
import { StatusCodes } from 'http-status-codes';

res.status(StatusCodes.CREATED).json(result);
res.status(StatusCodes.NOT_FOUND).json({ message: 'Not found' });
```

### Error Handling

Centralized error middleware as the last `app.use()`:

```typescript
export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  const status = err.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message ?? 'Internal Server Error';

  logger.error({ err, path: req.path }, 'Request error');

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
```

Never expose stack traces in production.

---

## Delivery Checklist

Before marking any backend task complete:

- [ ] Route file created in `src/routes/`, mounted in `src/routes/index.ts`
- [ ] Controller handles request/response only — no DB calls
- [ ] Service contains all business logic
- [ ] Zod schema validates request body, query, and params
- [ ] All async handlers wrapped with `asyncHandler`
- [ ] Auth middleware applied to protected routes
- [ ] No `console.log` — structured logger used
- [ ] No `process.env` outside `src/config/index.ts`
- [ ] HTTP status codes use named constants
- [ ] Error middleware propagates errors correctly
- [ ] `@security` review requested for auth/data-access routes
- [ ] No `: any` TypeScript types introduced
