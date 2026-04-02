# Vue 3 Architecture Standards

## Project Structure

```
src/
├── api/                     # API client functions (one file per resource)
│   └── items.api.ts
├── composables/             # Shared composable hooks (use* prefix)
│   ├── use-items.ts
│   ├── use-auth.ts
│   └── use-pagination.ts
├── stores/                  # Pinia stores (one per domain)
│   ├── auth.store.ts
│   └── items.store.ts
├── components/
│   ├── ui/                  # Primitive: Button, Input, Badge, Modal
│   └── shared/              # Composite: PageHeader, EmptyState, Spinner
├── views/                   # Route-level page components
│   ├── items/
│   │   ├── ItemsView.vue
│   │   ├── ItemDetailView.vue
│   │   └── ItemFormView.vue
│   └── auth/
│       └── LoginView.vue
├── layouts/                 # App shell layouts
│   └── DashboardLayout.vue
├── router/
│   └── index.ts             # Vue Router config (lazy routes)
├── types/                   # TypeScript interfaces
│   └── item.ts
└── lib/
    └── utils.ts             # Utility functions
```

---

## Component Rules

### `<script setup>` Always

```vue
<!-- Every component uses script setup with TypeScript -->
<script setup lang="ts">
// imports, composables, props, emits, logic here
</script>

<template>
  <!-- template here -->
</template>
```

No `export default { setup() {} }`. No Options API.

### Single File Component (SFC) Structure

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed, onMounted } from 'vue';
import { useItemsStore } from '@/stores/items.store';

// 2. Props
interface Props {
  id: string;
}
const props = defineProps<Props>();

// 3. Emits
const emit = defineEmits<{ updated: [item: Item] }>();

// 4. Composables / stores
const store = useItemsStore();

// 5. Local state
const loading = ref(false);

// 6. Computed
const item = computed(() => store.items.find(i => i.id === props.id));

// 7. Lifecycle
onMounted(async () => {
  if (!item.value) await store.fetchAll();
});

// 8. Methods
function handleUpdate(updated: Item) {
  emit('updated', updated);
}
</script>

<template>
  <!-- Use kebab-case for component names in template -->
  <div v-if="loading" class="flex justify-center py-12">
    <spinner />
  </div>
  <div v-else-if="item">
    <h1 class="text-2xl font-bold text-(--color-text)">{{ item.name }}</h1>
  </div>
</template>
```

---

## State Management

### Local State: `ref` and `reactive`

```vue
<script setup lang="ts">
import { ref, reactive, computed } from 'vue';

// Primitives — use ref
const count = ref(0);
const name = ref('');

// Objects — can use reactive
const form = reactive({
  name: '',
  description: '',
});

// Derived state — computed
const isValid = computed(() => form.name.length >= 2);
</script>
```

### Global State: Pinia (Setup Store Pattern)

```typescript
// stores/[domain].store.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useItemsStore = defineStore('[domain]', () => {
  // State
  const items = ref<Item[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const count = computed(() => items.value.length);

  // Actions
  async function fetchAll() {
    loading.value = true;
    error.value = null;
    try {
      items.value = await itemsApi.getAll();
    } catch (e) {
      error.value = 'Failed to load.';
    } finally {
      loading.value = false;
    }
  }

  return { items, loading, error, count, fetchAll };
});
```

---

## Composables

```typescript
// composables/use-pagination.ts
import { ref, computed } from 'vue';

export function usePagination(pageSize = 10) {
  const page = ref(1);
  const total = ref(0);

  const totalPages = computed(() => Math.ceil(total.value / pageSize));
  const offset = computed(() => (page.value - 1) * pageSize);

  function next() { if (page.value < totalPages.value) page.value++; }
  function prev() { if (page.value > 1) page.value--; }
  function goTo(n: number) { page.value = Math.max(1, Math.min(n, totalPages.value)); }

  return { page, total, totalPages, offset, next, prev, goTo };
}
```

Rules:
- All composables in `src/composables/`
- File names: `use-[name].ts` (kebab-case)
- Always return a plain object (not reactive wrap)
- Single responsibility per composable

---

## Routing

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DashboardLayout.vue'),
    children: [
      {
        path: 'items',
        component: () => import('@/views/items/ItemsView.vue'),
      },
      {
        path: 'items/new',
        component: () => import('@/views/items/ItemFormView.vue'),
      },
      {
        path: 'items/:id',
        component: () => import('@/views/items/ItemDetailView.vue'),
      },
    ],
  },
  {
    path: '/login',
    component: () => import('@/views/auth/LoginView.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
```

---

## Template Conventions

```vue
<template>
  <!-- Conditional rendering -->
  <spinner v-if="loading" />
  <empty-state v-else-if="items.length === 0" />
  <items-list v-else :items="items" />

  <!-- List rendering — always :key -->
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>

  <!-- Dynamic classes -->
  <button
    :class="[
      'rounded-lg px-4 py-2 text-sm',
      variant === 'primary'
        ? 'bg-(--color-primary) text-(--color-primary-fg)'
        : 'border border-(--color-border) text-(--color-text)',
    ]"
  >
    {{ label }}
  </button>

  <!-- Two-way binding -->
  <input v-model="form.name" type="text" />
</template>
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase `.vue` | `ItemCard.vue` |
| Views (pages) | PascalCase `View.vue` | `ItemsView.vue` |
| Layouts | PascalCase `Layout.vue` | `DashboardLayout.vue` |
| Composables | `use-*.ts` | `use-items.ts` |
| Stores | `*.store.ts` | `items.store.ts` |
| API clients | `*.api.ts` | `items.api.ts` |
| Types | `*.ts` | `item.ts` |
