# Express Backend Standards

This document defines the authoritative patterns for Express/Fastify + TypeScript backend projects. Follow these standards for all route, controller, service, and middleware code.

---

## Project Structure

```
src/
├── app.ts                  ← Express app factory (no listen() call)
├── server.ts               ← Entry point (listen, graceful shutdown)
├── config/
│   └── index.ts            ← Typed config — reads process.env once
├── routes/
│   ├── index.ts            ← Mounts all routers on the Express app
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
│   ├── rate-limit.middleware.ts
│   └── error.middleware.ts
├── schemas/                ← Zod schemas, one per resource
│   ├── user.schema.ts
│   └── product.schema.ts
├── types/
│   ├── express.d.ts        ← Express Request augmentation
│   └── common.ts
└── utils/
    ├── async-handler.ts
    └── http-error.ts
```

---

## Config Pattern

```typescript
// src/config/index.ts
import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const config = {
  env: (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test',
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  databaseUrl: required('DATABASE_URL'),
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
};
```

---

## App Factory

```typescript
// src/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { router } from './routes';
import { notFoundHandler } from './middleware/not-found.middleware';
import { errorMiddleware } from './middleware/error.middleware';

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS — never wildcard in production
  app.use(cors({
    origin: config.env === 'production' ? config.corsOrigins : true,
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/v1', router);

  // Error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorMiddleware);

  return app;
}
```

---

## Route Pattern

```typescript
// src/routes/users.routes.ts
import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { requireRole } from '../middleware/roles.middleware';
import { createUserSchema, updateUserSchema, listUsersSchema } from '../schemas/user.schema';
import * as usersController from '../controllers/users.controller';

export const usersRouter = Router();

usersRouter.post(
  '/',
  authenticate,
  requireRole('admin'),
  validate(createUserSchema),
  asyncHandler(usersController.create),
);

usersRouter.get(
  '/',
  authenticate,
  validate(listUsersSchema),
  asyncHandler(usersController.findAll),
);

usersRouter.get(
  '/:id',
  authenticate,
  asyncHandler(usersController.findOne),
);

usersRouter.patch(
  '/:id',
  authenticate,
  requireRole('admin'),
  validate(updateUserSchema),
  asyncHandler(usersController.update),
);

usersRouter.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  asyncHandler(usersController.remove),
);
```

---

## Controller Pattern

```typescript
// src/controllers/users.controller.ts
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as usersService from '../services/users.service';

export async function create(req: Request, res: Response): Promise<void> {
  const user = await usersService.create(req.body, req.user!.sub);
  res.status(StatusCodes.CREATED).json(user);
}

export async function findAll(req: Request, res: Response): Promise<void> {
  const result = await usersService.findAll(req.query);
  res.status(StatusCodes.OK).json(result);
}

export async function findOne(req: Request, res: Response): Promise<void> {
  const user = await usersService.findOne(req.params.id);
  res.status(StatusCodes.OK).json(user);
}

export async function update(req: Request, res: Response): Promise<void> {
  const user = await usersService.update(req.params.id, req.body, req.user!.sub);
  res.status(StatusCodes.OK).json(user);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await usersService.remove(req.params.id, req.user!.sub);
  res.status(StatusCodes.NO_CONTENT).send();
}
```

---

## Zod Validation Schema Pattern

```typescript
// src/schemas/user.schema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    role: z.enum(['admin', 'editor', 'viewer']),
    metadata: z.record(z.string()).optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: createUserSchema.shape.body.partial(),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type ListUsersQuery = z.infer<typeof listUsersSchema>['query'];
```

---

## Validation Middleware

```typescript
// src/middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(StatusCodes.BAD_REQUEST).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
        });
      } else {
        next(error);
      }
    }
  };
}
```

---

## Async Handler Utility

```typescript
// src/utils/async-handler.ts
import { RequestHandler, Request, Response, NextFunction } from 'express';

export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

---

## HTTP Error Utility

```typescript
// src/utils/http-error.ts
import { StatusCodes } from 'http-status-codes';

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static notFound(message = 'Not found') {
    return new HttpError(StatusCodes.NOT_FOUND, message);
  }

  static conflict(message = 'Conflict') {
    return new HttpError(StatusCodes.CONFLICT, message);
  }

  static forbidden(message = 'Forbidden') {
    return new HttpError(StatusCodes.FORBIDDEN, message);
  }

  static badRequest(message = 'Bad request') {
    return new HttpError(StatusCodes.BAD_REQUEST, message);
  }

  static unauthorized(message = 'Unauthorized') {
    return new HttpError(StatusCodes.UNAUTHORIZED, message);
  }
}
```

---

## Error Middleware

```typescript
// src/middleware/error.middleware.ts
import { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';
import { config } from '../config';
import { HttpError } from '../utils/http-error';

export const errorMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
  const statusCode = err instanceof HttpError
    ? err.statusCode
    : StatusCodes.INTERNAL_SERVER_ERROR;

  const message = err instanceof HttpError || config.env === 'development'
    ? err.message
    : 'Internal Server Error';

  logger.error({ err, path: req.path, method: req.method }, 'Request error');

  res.status(statusCode).json({
    error: message,
    ...(config.env === 'development' && { stack: err.stack }),
  });
};
```

---

## Pagination Response Format

All paginated endpoints return:

```json
{
  "data": [...],
  "total": 150,
  "page": 2,
  "limit": 20
}
```

---

## Anti-Patterns

| Anti-Pattern | Correct Approach |
|-------------|-----------------|
| `console.log(...)` | Structured logger (`pino`, `winston`) |
| `process.env.VAR` in service | `config.varName` from `src/config/index.ts` |
| `: any` TypeScript | Proper types or `unknown` |
| Raw `new Error()` in service | `throw HttpError.notFound(...)` |
| Business logic in route file | Delegate to controller → service |
| Missing `asyncHandler` wrap | Always wrap async route handlers |
| Magic HTTP status numbers | `StatusCodes.NOT_FOUND` etc. |
| `cors({ origin: '*' })` in production | Explicit allowlist from config |
