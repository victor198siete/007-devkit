# Workflow: New Nuxt 3 Page or Component

Follow this checklist when creating a new page or component in Nuxt 3.

---

## New Page

### 1. Create the file in `pages/`

Nuxt auto-generates the route from the file path:

| Goal | File |
|------|------|
| `/items` list | `pages/items/index.vue` |
| `/items/new` form | `pages/items/new.vue` |
| `/items/:id` detail | `pages/items/[id].vue` |
| `/items/:id/edit` form | `pages/items/[id]/edit.vue` |

### 2. Write the page

```vue
<!-- pages/items/index.vue -->
<script setup lang="ts">
// No imports needed — Vue/Nuxt composables are auto-imported

definePageMeta({
  layout: 'dashboard',      // use a layout from layouts/
  middleware: ['auth'],     // protect the route
});

useSeoMeta({ title: 'Items | MyApp' });

const { data: items, pending, error, refresh } =
  await useFetch<Item[]>('/api/items');
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-(--color-text)">Items</h1>
      <NuxtLink
        to="/items/new"
        class="bg-(--color-primary) text-(--color-primary-fg) rounded-lg px-4 py-2 text-sm font-medium"
      >
        New Item
      </NuxtLink>
    </div>

    <div v-if="pending" class="flex justify-center py-12">
      <div class="w-8 h-8 border-2 border-(--color-primary) border-t-transparent rounded-full animate-spin" />
    </div>

    <p v-else-if="error" class="text-(--color-danger) text-sm">{{ error.message }}</p>

    <div v-else-if="!items?.length" class="flex flex-col items-center py-16 text-center">
      <p class="text-(--color-text-muted)">No items yet.</p>
      <NuxtLink to="/items/new" class="mt-4 text-sm text-(--color-primary) underline">
        Create your first item
      </NuxtLink>
    </div>

    <div v-else class="flex flex-col gap-3">
      <NuxtLink
        v-for="item in items"
        :key="item.id"
        :to="`/items/${item.id}`"
        class="bg-(--color-surface) border border-(--color-border) rounded-xl p-5 hover:shadow-md transition block"
      >
        <h3 class="font-medium text-(--color-text)">{{ item.name }}</h3>
      </NuxtLink>
    </div>
  </div>
</template>
```

---

## New Reusable Component

### 1. Create in `components/`

```
components/shared/ItemCard.vue
```

Components in `components/` are auto-imported — no `import` statement needed.

### 2. Write the component

```vue
<!-- components/shared/ItemCard.vue -->
<script setup lang="ts">
interface Props {
  item: Item;
  selected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
});

const emit = defineEmits<{
  select: [id: string];
}>();
</script>

<template>
  <div
    class="bg-(--color-surface) border border-(--color-border) rounded-xl p-5 cursor-pointer transition hover:shadow-md"
    :class="{ 'ring-2 ring-(--color-primary)': selected }"
    @click="emit('select', item.id)"
  >
    <h3 class="font-medium text-(--color-text)">{{ item.name }}</h3>
    <p v-if="item.description" class="text-sm text-(--color-text-muted) mt-1">
      {{ item.description }}
    </p>
  </div>
</template>
```

### 3. Use it in a page (no import needed)

```vue
<!-- pages/items/index.vue -->
<template>
  <item-card
    v-for="item in items"
    :key="item.id"
    :item="item"
    @select="navigateTo(`/items/${item.id}`)"
  />
</template>
```

---

## Final Checklist

- [ ] Page in correct `pages/` path for desired URL
- [ ] `definePageMeta()` with layout and middleware
- [ ] `useSeoMeta()` or `useHead()` for page title
- [ ] `useFetch` or `useAsyncData` for data (no `onMounted` fetch)
- [ ] No manual Vue/Nuxt imports (auto-imported)
- [ ] `<NuxtLink>` for all internal navigation
- [ ] `v-if` / `v-else-if` / `v-else` for loading/error/data states
- [ ] `:key` on all `v-for` loops
- [ ] CSS variables only — no hardcoded colors
- [ ] TypeScript strict — typed props
