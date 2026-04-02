# Workflow: New Vue 3 Component

Follow this checklist every time you create a new Vue 3 component.

---

## Steps

### 1. Identify Component Type

| Type | Description | Location |
|------|-------------|----------|
| **View** | Route-level page, fetches data | `src/views/[feature]/` |
| **Shared** | Reusable across features | `src/components/shared/` |
| **UI Primitive** | Stateless design system element | `src/components/ui/` |
| **Layout** | App shell structure | `src/layouts/` |

---

### 2. Create the File

```
src/components/shared/[ComponentName].vue
```

Use PascalCase for file names.

---

### 3. Write the Component Shell

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed } from 'vue';

// 2. Props (typed interface)
interface Props {
  item: Item;
  selected?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  selected: false,
});

// 3. Emits (typed)
const emit = defineEmits<{
  select: [id: string];
}>();

// 4. Local state
const hovered = ref(false);
</script>

<template>
  <div
    class="bg-(--color-surface) border border-(--color-border) rounded-xl p-5 cursor-pointer transition"
    :class="{ 'ring-2 ring-(--color-primary)': selected }"
    @click="emit('select', item.id)"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <h3 class="font-medium text-(--color-text)">{{ item.name }}</h3>
    <p v-if="item.description" class="text-sm text-(--color-text-muted) mt-1">
      {{ item.description }}
    </p>
  </div>
</template>
```

---

### 4. For Data-Fetching Views, Use a Composable

```typescript
// composables/use-items.ts
import { ref, onMounted } from 'vue';
import { itemsApi } from '@/api/items.api';

export function useItems() {
  const items = ref<Item[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      items.value = await itemsApi.getAll();
    } catch {
      error.value = 'Failed to load items.';
    } finally {
      loading.value = false;
    }
  }

  onMounted(load);

  return { items, loading, error, reload: load };
}
```

```vue
<!-- views/items/ItemsView.vue -->
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useItems } from '@/composables/use-items';
import ItemCard from '@/components/shared/ItemCard.vue';

const router = useRouter();
const { items, loading, error } = useItems();

function view(id: string) {
  router.push(`/items/${id}`);
}
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-(--color-text)">Items</h1>
      <button
        @click="router.push('/items/new')"
        class="bg-(--color-primary) text-(--color-primary-fg) rounded-lg px-4 py-2 text-sm"
      >
        New Item
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-8 h-8 border-2 border-(--color-primary) border-t-transparent rounded-full animate-spin" />
    </div>

    <p v-else-if="error" class="text-(--color-danger) text-sm">{{ error }}</p>

    <div v-else-if="items.length === 0" class="flex flex-col items-center py-16 text-center">
      <p class="text-(--color-text-muted)">No items yet.</p>
    </div>

    <div v-else class="flex flex-col gap-3">
      <item-card
        v-for="item in items"
        :key="item.id"
        :item="item"
        @select="view"
      />
    </div>
  </div>
</template>
```

---

### 5. Apply Styles (CSS Variables Only)

```vue
<template>
  <!-- CORRECT -->
  <div class="bg-(--color-surface) text-(--color-text)">

  <!-- WRONG -->
  <div class="bg-white text-gray-900">  <!-- never -->
</template>
```

---

### 6. Register in Router (if View Component)

```typescript
// router/index.ts
{
  path: 'items',
  component: () => import('@/views/items/ItemsView.vue'),
},
```

---

### 7. Final Checklist

- [ ] `<script setup lang="ts">`
- [ ] `defineProps<{}>()` with typed interface
- [ ] `defineEmits<{}>()` with typed event map
- [ ] Composable (`use*`) for data-fetching logic
- [ ] CSS variables only — no hardcoded colors
- [ ] `:key` on all `v-for` loops
- [ ] `v-if` / `v-else-if` / `v-else` for states
- [ ] TypeScript strict — no `any`
- [ ] Loading and error states handled
- [ ] Added to router if it is a view
