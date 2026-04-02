# NestJS Backend Standards

This document defines the authoritative patterns for all NestJS backend code in this project. Every agent and contributor must follow these standards. Deviations require explicit justification and `@pm` sign-off.

---

## Module Structure

Every feature lives in its own module under `src/modules/`:

```
src/modules/resource-name/
├── resource-name.module.ts        ← NestJS module definition
├── resource-name.controller.ts    ← HTTP layer, guards, Swagger
├── resource-name.service.ts       ← Business logic
├── entities/
│   └── resource-name.entity.ts   ← TypeORM entity
├── dtos/
│   ├── create-resource-name.dto.ts
│   ├── update-resource-name.dto.ts
│   └── list-resource-name.dto.ts
└── repositories/                  ← Only when query complexity warrants it
    └── resource-name.repository.ts
```

Modules are registered in `AppModule`. Each module imports only what it needs — avoid importing `CommonModule` or similar barrel modules unless they are intentionally shared.

---

## Entity Patterns

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('resource_names')   // snake_case, plural
export class ResourceName {
  @ApiProperty({ example: 'uuid-v4' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Example value' })
  @Column({ name: 'display_name', length: 255 })
  displayName: string;

  @ApiPropertyOptional()
  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  // Sensitive fields excluded from serialized responses
  @Exclude()
  @Column({ name: 'internal_token', select: false })
  internalToken: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', select: false })
  deletedAt: Date | null;
}
```

Rules:
- Table name: `snake_case` plural in `@Entity('...')`
- All column names: `snake_case` via `{ name: '...' }` option
- Primary key: `@PrimaryGeneratedColumn('uuid')` — no integer IDs
- Timestamps: `@CreateDateColumn`, `@UpdateDateColumn` on every entity
- Soft delete: `@DeleteDateColumn` when data must be recoverable
- Sensitive fields: `@Exclude()` + `select: false` where applicable
- All public properties decorated with `@ApiProperty` or `@ApiPropertyOptional`

---

## DTO Patterns

### Create DTO

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateResourceNameDto {
  @ApiProperty({ example: 'My Resource', description: 'Display name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  displayName: string;

  @ApiPropertyOptional({ example: 'A description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-v4' })
  @IsUUID()
  @IsOptional()
  relatedEntityId?: string;
}
```

### Update DTO

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateResourceNameDto } from './create-resource-name.dto';

export class UpdateResourceNameDto extends PartialType(CreateResourceNameDto) {}
```

### List Query DTO

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListResourceNameDto {
  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}
```

Rules:
- All fields decorated with `@ApiProperty` / `@ApiPropertyOptional`
- All fields validated with `class-validator`
- `UpdateDto` always extends `PartialType(CreateDto)`
- Never use `Partial<SomeClass>` manually
- DTOs are plain classes — no business logic

---

## Repository Patterns

Use the built-in TypeORM repository for simple CRUD. Create a custom repository only when the query complexity justifies it.

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceName } from '../entities/resource-name.entity';
import { ListResourceNameDto } from '../dtos/list-resource-name.dto';

@Injectable()
export class ResourceNameRepository {
  constructor(
    @InjectRepository(ResourceName)
    private readonly repo: Repository<ResourceName>,
  ) {}

  async findAllPaginated(
    tenantId: string,
    query: ListResourceNameDto,
  ): Promise<{ data: ResourceName[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, search } = query;

    const qb = this.repo
      .createQueryBuilder('r')
      .where('r.tenant_id = :tenantId', { tenantId });

    if (search) {
      qb.andWhere('r.display_name ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await qb
      .orderBy('r.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }
}
```

---

## Service Patterns

```typescript
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ResourceName } from './entities/resource-name.entity';
import { CreateResourceNameDto } from './dtos/create-resource-name.dto';
import { UpdateResourceNameDto } from './dtos/update-resource-name.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ResourceNameService {
  private readonly logger = new Logger(ResourceNameService.name);

  constructor(
    @InjectRepository(ResourceName)
    private readonly repo: Repository<ResourceName>,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateResourceNameDto, actorId: string): Promise<ResourceName> {
    const existing = await this.repo.findOne({ where: { displayName: dto.displayName } });
    if (existing) throw new ConflictException('Resource with that name already exists');

    const entity = this.repo.create(dto);
    const saved = await this.repo.save(entity);

    await this.auditService.log({ action: 'CREATE', entity: 'ResourceName', entityId: saved.id, actorId });
    this.logger.log(`Created ResourceName ${saved.id} by user ${actorId}`);

    return saved;
  }

  async findAll(tenantId: string): Promise<ResourceName[]> {
    return this.repo.find({ where: { tenantId } });
  }

  async findOne(id: string): Promise<ResourceName> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`ResourceName ${id} not found`);
    return entity;
  }

  async update(id: string, dto: UpdateResourceNameDto, actorId: string): Promise<ResourceName> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    const saved = await this.repo.save(entity);

    await this.auditService.log({ action: 'UPDATE', entity: 'ResourceName', entityId: id, actorId });
    this.logger.log(`Updated ResourceName ${id} by user ${actorId}`);

    return saved;
  }

  async remove(id: string, actorId: string): Promise<void> {
    const entity = await this.findOne(id);
    await this.repo.softRemove(entity);

    await this.auditService.log({ action: 'DELETE', entity: 'ResourceName', entityId: id, actorId });
    this.logger.log(`Soft-deleted ResourceName ${id} by user ${actorId}`);
  }
}
```

Rules:
- `private readonly logger = new Logger(ClassName.name)` in every service
- `ConfigService` injected for any env-based configuration
- All HTTP exceptions use NestJS built-ins with descriptive messages
- `AuditService.log()` called on every CREATE, UPDATE, DELETE
- No `console.log`, no `process.env`, no `: any`

---

## Controller Patterns

```typescript
import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ResourceNameService } from './resource-name.service';
import { CreateResourceNameDto } from './dtos/create-resource-name.dto';
import { UpdateResourceNameDto } from './dtos/update-resource-name.dto';
import { ListResourceNameDto } from './dtos/list-resource-name.dto';

@ApiTags('Resource Names')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('resource-names')
export class ResourceNameController {
  constructor(private readonly service: ResourceNameService) {}

  @Post()
  @Roles('admin', 'teacher')
  @Permissions('resource-names:create')
  @ApiOperation({ summary: 'Create a resource name' })
  @ApiResponse({ status: 201, type: ResourceName })
  create(
    @Body() dto: CreateResourceNameDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.create(dto, userId);
  }

  @Get()
  @Roles('admin', 'teacher', 'parent')
  @Permissions('resource-names:read')
  @ApiOperation({ summary: 'List resource names' })
  findAll(@Query() query: ListResourceNameDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles('admin', 'teacher', 'parent')
  @Permissions('resource-names:read')
  @ApiOperation({ summary: 'Get a resource name by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'teacher')
  @Permissions('resource-names:update')
  @ApiOperation({ summary: 'Update a resource name' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResourceNameDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles('admin')
  @Permissions('resource-names:delete')
  @ApiOperation({ summary: 'Delete a resource name' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.remove(id, userId);
  }
}
```

Rules:
- All controllers decorated with `@ApiTags`, `@ApiBearerAuth`, `@UseGuards`
- Every method has `@Roles(...)` and `@Permissions(...)`
- UUIDs validated with `ParseUUIDPipe`
- Authenticated user accessed via `@CurrentUser('sub')` — never from body or query
- Routes: kebab-case, plural (`/resource-names`, `/activity-logs`)

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

Create a `PaginatedResponseDto<T>` wrapper class for Swagger documentation.

---

## Security

### Guards

Always compose all three guards on controllers:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
```

### Decorators

- `@Roles('admin', 'teacher')` — restricts by role
- `@Permissions('resource:action')` — restricts by specific permission string
- `@TenantId()` — injects the current tenant ID (for multi-tenant queries)
- `@CurrentUser('sub')` — injects the authenticated user's ID

### Tenant Isolation

All queries on tenant-scoped data must filter by `tenantId`. Never return cross-tenant data. The `tenantId` comes from the JWT payload — not from the request body or URL parameter.

---

## Migrations

Never use `synchronize: true`. Every schema change requires a migration file.

```bash
# Generate migration (review before running)
npx typeorm migration:generate src/database/migrations/MigrationName

# Run pending migrations
npx typeorm migration:run

# Revert last migration
npx typeorm migration:revert
```

File naming convention: `{timestamp}-{PascalCaseDescription}.ts`

Example: `1774000000001-CreateClassrooms.ts`

---

## Anti-Patterns

| Anti-Pattern | Correct Approach |
|-------------|-----------------|
| `console.log(...)` | `this.logger.log(...)` / `this.logger.error(...)` |
| `process.env.VARIABLE` | `this.config.get<string>('VARIABLE')` |
| `: any` | Proper TypeScript types or `unknown` |
| `synchronize: true` | Migration files in `src/database/migrations/` |
| `req.user.id` | `req.user.sub` |
| `new HttpException(msg, 404)` | `new NotFoundException(msg)` |
| Skipping `@Roles`/`@Permissions` | Explicit decorator on every method |
| Raw `process.env` in entity/service | Always via `ConfigService` |
| Manual `Partial<CreateDto>` | `UpdateDto extends PartialType(CreateDto)` |
