# Workflow: New NestJS Module

Follow these 10 steps in order when creating a new backend module. Do not skip steps or reorder them — later steps depend on earlier ones being complete and tested.

---

## Pre-flight

Before starting, confirm:
- [ ] Session initialized (`agents/workflows/init-session.md` completed)
- [ ] Module name agreed with `@pm` (singular noun, e.g., `classroom`, `activity-log`)
- [ ] API contract defined (routes, DTOs, roles, permissions)
- [ ] No existing module does the same thing (`ls src/modules/`)

---

## Step 1 — Create Folder Structure

```bash
mkdir -p src/modules/<module-name>/entities
mkdir -p src/modules/<module-name>/dtos
# Optional: only if complex query logic is needed
mkdir -p src/modules/<module-name>/repositories
```

Create empty placeholder files to establish the structure before filling them in:

```
src/modules/<module-name>/
├── <module-name>.module.ts
├── <module-name>.controller.ts
├── <module-name>.service.ts
├── entities/
│   └── <module-name>.entity.ts
└── dtos/
    ├── create-<module-name>.dto.ts
    ├── update-<module-name>.dto.ts
    └── list-<module-name>.dto.ts
```

---

## Step 2 — Create the TypeORM Entity

File: `src/modules/<module-name>/entities/<module-name>.entity.ts`

Requirements:
- `@Entity('<table_name>')` — snake_case plural table name
- `@PrimaryGeneratedColumn('uuid')` — UUID primary key
- All columns: explicit `name` in snake_case
- `@CreateDateColumn`, `@UpdateDateColumn` on every entity
- `@DeleteDateColumn` if soft delete is needed
- Sensitive fields: `@Exclude()` + `select: false`
- All public properties: `@ApiProperty` or `@ApiPropertyOptional`
- Relations: `@ManyToOne`, `@OneToMany`, etc. with `@JoinColumn({ name: 'fk_column' })`

Verify the entity compiles without errors before proceeding.

---

## Step 3 — Create the Repository (if needed)

File: `src/modules/<module-name>/repositories/<module-name>.repository.ts`

Create a custom repository only when:
- Pagination + filtering logic is complex
- Multiple joined tables are needed
- The query cannot be expressed cleanly with the standard TypeORM repository

If the standard `Repository<Entity>` is sufficient, skip this step and inject it directly in the service.

Required method pattern for paginated lists:

```typescript
async findAllPaginated(tenantId: string, query: ListDto): Promise<PaginatedResult<Entity>>
```

---

## Step 4 — Create the DTOs

### `create-<module-name>.dto.ts`
- All required fields with `@IsNotEmpty()` or appropriate validators
- Optional fields with `@IsOptional()`
- All fields decorated with `@ApiProperty` / `@ApiPropertyOptional`
- UUIDs validated with `@IsUUID()`
- String lengths validated with `@MaxLength()`

### `update-<module-name>.dto.ts`
```typescript
export class Update<ModuleName>Dto extends PartialType(Create<ModuleName>Dto) {}
```
Never repeat field definitions.

### `list-<module-name>.dto.ts`
- `page: number` (default: 1)
- `limit: number` (default: 20, max: 100)
- `search?: string` (optional, for text filters)
- Any domain-specific filters (e.g., `status`, `classroomId`)
- All numeric fields decorated with `@Type(() => Number)` for query string coercion

---

## Step 5 — Create the Service

File: `src/modules/<module-name>/<module-name>.service.ts`

Requirements:
- `private readonly logger = new Logger(<ServiceName>.name)`
- Constructor injects: `Repository<Entity>`, `ConfigService`, `AuditService`
- Methods: `create`, `findAll`, `findOne`, `update`, `remove`
- `findOne` throws `NotFoundException` when entity not found
- `create` throws `ConflictException` when duplicate detected (if applicable)
- `AuditService.log()` called on every CREATE, UPDATE, DELETE
- `this.logger.log()` for informational messages
- `this.logger.error()` for caught errors
- No `console.log`, no `process.env`, no `: any`

---

## Step 6 — Create the Controller

File: `src/modules/<module-name>/<module-name>.controller.ts`

Requirements:
- `@ApiTags('<Module Name>')` and `@ApiBearerAuth()`
- `@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)` at class level
- Every method has `@Roles(...)` and `@Permissions(...)`
- UUIDs from path params validated with `ParseUUIDPipe`
- Authenticated user ID via `@CurrentUser('sub')` — never from body
- All methods documented with `@ApiOperation` and `@ApiResponse`
- Routes: kebab-case, plural (`/resource-names`)

Standard CRUD methods:
- `POST /` — create
- `GET /` — list (with `@Query() query: ListDto`)
- `GET /:id` — findOne
- `PATCH /:id` — update
- `DELETE /:id` — remove (soft delete)

---

## Step 7 — Create the Module File

File: `src/modules/<module-name>/<module-name>.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { <ModuleName>Entity } from './entities/<module-name>.entity';
import { <ModuleName>Service } from './<module-name>.service';
import { <ModuleName>Controller } from './<module-name>.controller';

@Module({
  imports: [TypeOrmModule.forFeature([<ModuleName>Entity])],
  controllers: [<ModuleName>Controller],
  providers: [<ModuleName>Service],
  exports: [<ModuleName>Service],  // export only if other modules need it
})
export class <ModuleName>Module {}
```

---

## Step 8 — Register in AppModule

File: `src/app.module.ts`

Add the new module to the `imports` array in `AppModule`:

```typescript
import { <ModuleName>Module } from './modules/<module-name>/<module-name>.module';

@Module({
  imports: [
    // ... existing modules
    <ModuleName>Module,
  ],
})
export class AppModule {}
```

Verify the application still starts without errors after this change.

---

## Step 9 — Generate and Run Migration

```bash
# Generate migration based on entity changes
npx typeorm migration:generate src/database/migrations/Create<ModuleNames>

# Review the generated file — ensure:
# - Table name is snake_case plural
# - All columns use snake_case names
# - Foreign keys reference correct tables
# - No unintended DROP statements

# Run the migration
npx typeorm migration:run

# Verify in the database that the table was created correctly
```

Migration file naming: `{timestamp}-Create<PluralModuleNames>.ts`

If the migration contains errors, revert and fix the entity before re-generating:
```bash
npx typeorm migration:revert
```

---

## Step 10 — Add Permissions to Seed

File: `src/database/seeds/data/permissions.seed.ts`

Add the new permissions to the permissions array:

```typescript
// <module-name> permissions
{ name: '<module-name>:create', description: 'Create <module name>' },
{ name: '<module-name>:read',   description: 'Read <module name>' },
{ name: '<module-name>:update', description: 'Update <module name>' },
{ name: '<module-name>:delete', description: 'Delete <module name>' },
```

Assign permissions to appropriate roles in the role-permission mapping.

Run the seed:
```bash
npx ts-node src/database/seeds/seed.ts
```

---

## Verification Checklist

After completing all 10 steps, confirm every item:

- [ ] Entity compiles; no TypeScript errors
- [ ] Migration generated, reviewed, and applied successfully
- [ ] Table and columns in DB match entity definition (snake_case)
- [ ] All DTOs have validators and `@ApiProperty` decorators
- [ ] `UpdateDto` extends `PartialType(CreateDto)`
- [ ] Service uses `Logger`, `ConfigService`, `AuditService`
- [ ] Service throws appropriate HTTP exceptions
- [ ] Controller has guards, roles, permissions on every method
- [ ] `ParseUUIDPipe` used for all `:id` params
- [ ] Module file imports entity, declares controller and service
- [ ] Module registered in `AppModule`
- [ ] Permissions added to seed and seed executed
- [ ] Application starts without errors (`npm run start:dev`)
- [ ] Swagger UI shows new endpoints at `/api/docs`
- [ ] No `console.log`, `process.env`, or `: any` introduced
- [ ] `@security` invoked if module handles sensitive data or has complex auth rules
