# Workflow: /write-tests

> Universal guide for writing tests: unit, integration, and end-to-end.
> Tests verify observable behavior — what a unit returns, throws, and calls — not implementation internals.

---

## Required Information

1. **What is being tested?** — module, service, function, component, endpoint
2. **Test type:** [ ] Unit  [ ] Integration  [ ] End-to-End (E2E)
3. **Layer:** [ ] Backend (server/API)  [ ] Frontend (web app)  [ ] Mobile
4. **Relevant edge cases?** — null values, auth errors, concurrent writes, empty state

---

## Backend — Unit Tests

### File Structure

```
src/modules/<name>/
├── <name>.service.spec.ts       ← primary: business logic tests
├── <name>.controller.spec.ts    ← optional: route/guard binding tests
└── <name>.repository.spec.ts    ← optional: complex query tests
```

### Service Test Pattern

The service is the core of business logic. Mock all dependencies; test only the service's behavior.

```typescript
// Example using NestJS Testing — adapt to your framework's DI or plain instantiation
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsRepository } from './items.repository';

describe('ItemsService', () => {
  let service: ItemsService;

  const mockRepository = {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        { provide: ItemsRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findById', () => {
    it('returns the item when it exists', async () => {
      const item = { id: 'uuid-1', name: 'Test Item' };
      mockRepository.findById.mockResolvedValue(item);

      const result = await service.findById('uuid-1');

      expect(result).toEqual(item);
      expect(mockRepository.findById).toHaveBeenCalledWith('uuid-1');
    });

    it('throws NotFoundException when item does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and returns the item', async () => {
      const dto = { name: 'New Item', description: 'A description' };
      const created = { id: 'uuid-new', ...dto };

      mockRepository.create.mockReturnValue(created);
      mockRepository.save.mockResolvedValue(created);

      const result = await service.create(dto, { userId: 'user-1' });

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(created);
    });

    it('throws ConflictException when a duplicate exists', async () => {
      mockRepository.findAll.mockResolvedValue([{ name: 'New Item' }]);

      await expect(service.create({ name: 'New Item' }, { userId: 'user-1' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('deletes the item when it exists', async () => {
      const item = { id: 'uuid-1' };
      mockRepository.findById.mockResolvedValue(item);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.delete('uuid-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('uuid-1');
    });

    it('throws NotFoundException when item does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete('nonexistent-id'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
```

---

## Frontend — Unit Tests

### File Structure

```
src/<feature>/
├── <feature>.service.spec.ts      ← HTTP and state logic
└── <feature>-list.component.spec.ts  ← rendering and interaction
```

### Service Test Pattern (Framework-Agnostic)

```typescript
// Plain instantiation — works for any service class with injected HTTP client
import { ItemsService } from './items.service';

describe('ItemsService', () => {
  let service: ItemsService;

  const mockHttpClient = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    service = new ItemsService(mockHttpClient as any);
  });

  afterEach(() => jest.clearAllMocks());

  it('getAll calls the correct endpoint', async () => {
    const mockResponse = { data: [], total: 0 };
    mockHttpClient.get.mockResolvedValue(mockResponse);

    const result = await service.getAll();

    expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/items');
    expect(result).toEqual(mockResponse);
  });

  it('getById calls the correct endpoint with the id', async () => {
    const item = { id: 'uuid-1', name: 'Test' };
    mockHttpClient.get.mockResolvedValue(item);

    const result = await service.getById('uuid-1');

    expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/items/uuid-1');
    expect(result).toEqual(item);
  });
});
```

### Component / Hook Test Pattern

```typescript
// Example using Angular TestBed — adapt as needed for React (Testing Library), Vue, etc.
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemsListComponent } from './items-list.component';
import { ItemsService } from '../items.service';

describe('ItemsListComponent', () => {
  let component: ItemsListComponent;
  let fixture: ComponentFixture<ItemsListComponent>;

  const mockService = {
    getAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemsListComponent],
      providers: [
        { provide: ItemsService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => jest.clearAllMocks());

  it('renders without errors', () => {
    expect(component).toBeTruthy();
  });

  it('calls getAll on initialization', async () => {
    await fixture.whenStable();
    expect(mockService.getAll).toHaveBeenCalledTimes(1);
  });

  it('displays items when loaded', async () => {
    mockService.getAll.mockResolvedValue({
      data: [{ id: 'uuid-1', name: 'Item A' }],
      total: 1,
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Item A');
  });
});
```

---

## Test Cases to ALWAYS Cover

Every unit being tested must have tests for these scenarios:

| Scenario | Test Assertion |
|----------|---------------|
| Happy path | Returns expected result with valid input |
| Not found | Throws / returns a 404-equivalent error |
| Duplicate / conflict | Throws / returns a 409-equivalent error |
| Auth error | Throws / returns a 401 or 403-equivalent error |
| Validation error | Throws / returns a 400-equivalent error |
| Empty collection | Returns empty array and correct total (not null/undefined) |
| Partial update | Only the specified fields are changed |

For services that write data, also verify:

| Scenario | Assertion |
|----------|-----------|
| Correct dependency called | `expect(mockDep.method).toHaveBeenCalledWith(...)` |
| Correct arguments passed | Verify the exact shape passed to the dependency |
| Side effects triggered | e.g. audit log, notification dispatch, cache invalidation |

---

## Commands to Run Tests

Adapt to your project's test runner. Common patterns:

```bash
# Run all tests
npm test
# or
npx jest

# Run tests for a specific file or pattern
npx jest items.service
npx jest --testPathPattern="src/modules/items"

# Run with coverage report
npx jest --coverage

# Watch mode during development
npx jest --watch

# NestJS Nx monorepo examples
npx nx test api
npx nx test web -- --testPathPattern="items"
npx nx test api -- --coverage
```

---

## What NOT to Test

- Framework internals (lifecycle hooks, DI container wiring, router behavior)
- Third-party library behavior (ORM internals, HTTP client internals, validation library)
- Private methods or properties directly — test them through the public interface
- `console.log` calls
- Configuration values — test the behavior that depends on config, not the config itself
- Implementation details that can change without affecting observable behavior

---

## Test Quality Checklist

- [ ] Happy path covered for every public method
- [ ] Not found case covered
- [ ] Conflict/duplicate case covered where applicable
- [ ] Auth error case covered where applicable
- [ ] Mocks reset between tests (`afterEach(() => jest.clearAllMocks())`)
- [ ] No `console.log` in test files
- [ ] No skipped tests (`it.skip`, `xit`) left in the codebase
- [ ] Tests are deterministic — no dependency on execution order or external state
- [ ] All tests pass: `<test command>`
