# Nuxt 3 Architecture Standards

## Project Structure

```
├── app.vue                  # Root component (optional)
├── nuxt.config.ts           # Nuxt configuration
├── pages/                   # File-based routing (auto-registered)
│   ├── index.vue            # / route
│   ├── items/
│   │   ├── index.vue        # /items
│   │   ├── new.vue          # /items/new
│   │   └── [id].vue         # /items/:id (dynamic)
│   └── auth/
│       └── login.vue        # /auth/login
├── components/              # Auto-imported components
│   ├── ui/
│   │   ├── AppButton.vue
│   │   └── AppInput.vue
│   └── shared/
│       ├── PageHeader.vue
│       └── EmptyState.vue
├── composables/             # Auto-imported composables (use* prefix)
│   ├── use-items.ts
│   └── use-auth.ts
├── stores/                  # Pinia stores (auto-imported with module)
│   ├── auth.store.ts
│   └── items.store.ts
├── layouts/                 # App shell layouts
│   ├── default.vue          # Default layout
│   └── dashboard.vue        # Dashboard layout
├── middleware/              # Route middleware
│   └── auth.ts
├── server/
│   ├── api/                 # API route handlers
│   │   └── items/
│   │       ├── index.get.ts
│   │       ├── index.post.ts
│   │       └── [id].get.ts
│   ├── middleware/          # Server middleware
│   └── utils/               # Server utilities
├── public/                  # Static files
└── assets/
    └── css/
        └── main.css         # Global styles + CSS variables
```

---

## File-Based Routing

Nuxt 3 generates routes automatically from the `pages/` directory:

| File | Route |
|------|-------|
| `pages/index.vue` | `/` |
| `pages/items/index.vue` | `/items` |
| `pages/items/new.vue` | `/items/new` |
| `pages/items/[id].vue` | `/items/:id` |
| `pages/items/[id]/edit.vue` | `/items/:id/edit` |
| `pages/[...slug].vue` | Catch-all route |

---

## Page Components

```vue
<!-- pages/items/[id].vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth'],
});

const route = useRoute();
const id = computed(() => route.params.id as string);

const { data: item, pending, error } = await useAsyncData(
  `item-${id.value}`,
  () => $fetch<Item>(`/api/items/${id.value}`)
);

useSeoMeta({
  title: () => `${item.value?.name ?? 'Item'} | MyApp`,
});
</script>

<template>
  <div class="p-6">
    <div v-if="pending" class="flex justify-center py-12">
      <div class="w-8 h-8 border-2 border-(--color-primary) border-t-transparent rounded-full animate-spin" />
    </div>
    <p v-else-if="error" class="text-(--color-danger)">{{ error.message }}</p>
    <template v-else-if="item">
      <h1 class="text-2xl font-bold text-(--color-text)">{{ item.name }}</h1>
    </template>
  </div>
</template>
```

---

## Layouts

```vue
<!-- layouts/dashboard.vue -->
<script setup lang="ts">
// Layout-level logic
const authStore = useAuthStore();
</script>

<template>
  <div class="min-h-screen bg-(--color-bg) flex">
    <sidebar-nav />
    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</template>
```

---

## Middleware

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore();

  if (!authStore.isAuthenticated) {
    return navigateTo('/auth/login');
  }
});
```

---

## Server Routes

```typescript
// server/api/items/index.get.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  return db.items.findMany({ where: query.search ? { name: { contains: String(query.search) } } : undefined });
});

// server/api/items/index.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const item = await db.items.create({ data: body });
  setResponseStatus(event, 201);
  return item;
});

// server/api/items/[id].patch.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!;
  const body = await readBody(event);
  return db.items.update({ where: { id }, data: body });
});

// server/api/items/[id].delete.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!;
  await db.items.delete({ where: { id } });
  return { success: true };
});
```

---

## Composables

```typescript
// composables/use-item-form.ts
import type { CreateItemDto } from '~/types/item';

export function useItemForm() {
  const router = useRouter();

  const form = reactive<CreateItemDto>({
    name: '',
    description: '',
  });

  const saving = ref(false);
  const errors = ref<Record<string, string>>({});

  async function submit() {
    saving.value = true;
    errors.value = {};
    try {
      await $fetch('/api/items', {
        method: 'POST',
        body: form,
      });
      await router.push('/items');
    } catch (e: any) {
      errors.value = e.data?.errors ?? { _: 'Something went wrong.' };
    } finally {
      saving.value = false;
    }
  }

  return { form, saving, errors, submit };
}
```

---

## Pinia Stores (with auto-import)

```typescript
// stores/items.store.ts
export const useItemsStore = defineStore('items', () => {
  const items = ref<Item[]>([]);

  async function fetch() {
    const data = await $fetch<Item[]>('/api/items');
    items.value = data;
  }

  return { items, fetch };
});
```

In components (auto-imported):

```vue
<script setup lang="ts">
const store = useItemsStore();
await store.fetch();
</script>
```

---

## `nuxt.config.ts` Conventions

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/image',
  ],
  typescript: {
    strict: true,
  },
  imports: {
    // Pinia stores auto-imported
    dirs: ['stores'],
  },
  runtimeConfig: {
    // Private (server-only)
    dbUrl: process.env.DATABASE_URL,
    // Public (exposed to client)
    public: {
      apiBase: process.env.API_BASE_URL ?? '/api',
    },
  },
});
```
