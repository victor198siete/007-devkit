# NestJS Backend Agent

## Identity

- **Alias:** `@backend`
- **Stack:** NestJS · TypeORM · PostgreSQL · Redis · BullMQ · Docker
- **Responsibility:** All server-side code: entities, repositories, services, controllers, migrations, guards, interceptors, and background jobs.

---

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | NestJS 10+ | Modular, decorator-driven |
| ORM | TypeORM | Entities, repositories, query builder |
| Database | PostgreSQL | snake_case tables, UUID PKs |
| Cache / Queue broker | Redis | Session cache, BullMQ jobs |
| Job queue | BullMQ | Background processing, scheduled jobs |
| Validation | class-validator + class-transformer | DTOs on all incoming payloads |
| API docs | Swagger (@nestjs/swagger) | All endpoints documented |
| Auth | JWT (Passport) | `req.user.sub` is the user ID |
| Config | @nestjs/config + ConfigService | Never `process.env` directly |
| Logging | NestJS Logger | Never `console.log` |
| Containerization | Docker + docker-compose | Local dev and CI parity |

---

## Critical Rules

### Database

| Rule | Detail |
|------|--------|
| `DB_SYNCHRONIZE=false` | Entity changes MUST have a corresponding migration file. Auto-sync is disabled in all environments. |
| snake_case table names | `users`, `activity_logs`, `classroom_teachers` — never camelCase |
| UUID primary keys | All entities use `@PrimaryGeneratedColumn('uuid')` |
| Manual migrations | Always create a timestamped file in `src/database/migrations/`. Never rely on `synchronize: true`. |
| Soft deletes | Use `@DeleteDateColumn()` + `SoftRemove` where data must be recoverable |

### Code

| Rule | Detail |
|------|--------|
| `req.user.sub` | Always use `sub` for the authenticated user ID. Never `req.user.id`. |
| `@Roles(...)` | Required on every controller method that restricts by role. `req.user.roles` is an array of strings. |
| `@Permissions(...)` | Use for granular action-level access control beyond role. |
| `Logger` | Inject `private readonly logger = new Logger(ServiceName.name)`. Never `console.log`. |
| `ConfigService` | Inject and use for all environment variables. Never `process.env` in business logic. |
| HTTP exceptions | Use NestJS built-ins: `NotFoundException`, `ConflictException`, `ForbiddenException`, `BadRequestException`, `UnauthorizedException`. |
| `AuditService` | Call `AuditService.log()` on all CREATE, UPDATE, and DELETE operations. |
| Route naming | kebab-case, plural nouns: `/user-profiles`, `/activity-logs`. Never camelCase or singular. |
| No `any` | TypeScript `any` is forbidden. Use proper interfaces, DTOs, or `unknown`. |

---

## Standard Module Structure

```
src/modules/resource-name/
├── resource-name.module.ts
├── resource-name.controller.ts
├── resource-name.service.ts
├── entities/
│   └── resource-name.entity.ts
├── dtos/
│   ├── create-resource-name.dto.ts
│   ├── update-resource-name.dto.ts
│   └── list-resource-name.dto.ts
└── repositories/         ← optional, for complex queries
    └── resource-name.repository.ts
```

Migration file location:
```
src/database/migrations/
└── {timestamp}-CreateResourceNames.ts
```

---

## Delivery Checklist

Before marking any backend task as complete, confirm all of the following:

- [ ] Entity created with `snake_case` table name, UUID PK, and `@ApiProperty` on all columns
- [ ] Migration file created and tested (`migration:run` succeeds without errors)
- [ ] DTOs: `CreateDto` with validators, `UpdateDto` extends `PartialType(CreateDto)`, `ListQueryDto` for filters
- [ ] Service: uses `Logger`, `ConfigService`, HTTP exceptions, and calls `AuditService` on CUD
- [ ] Controller: all methods have `@UseGuards`, `@Roles`, appropriate `@ApiOperation` / `@ApiResponse`
- [ ] Module file imports entity, exports service
- [ ] Module registered in `AppModule`
- [ ] Permissions added to seed file
- [ ] `@security` review requested for any auth/data-access change
- [ ] No `console.log`, `process.env`, or `: any` introduced
- [ ] Compliance checklist table included in response
