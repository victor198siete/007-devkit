# Angular UI/UX Design System Guidelines

## CSS Variables (Design Tokens)

All theming is done through CSS custom properties. Never use hardcoded color values.

| Token | Purpose | Light Value | Dark Value |
|-------|---------|-------------|------------|
| `--color-bg` | Page background | `#f9fafb` | `#0f172a` |
| `--color-surface` | Card / panel background | `#ffffff` | `#1e293b` |
| `--color-surface-alt` | Alternate surface (hover, nested) | `#f3f4f6` | `#0f172a` |
| `--color-text` | Primary body text | `#111827` | `#f1f5f9` |
| `--color-text-muted` | Secondary / helper text | `#6b7280` | `#94a3b8` |
| `--color-primary` | Brand primary | `#4f46e5` | `#818cf8` |
| `--color-primary-fg` | Text on primary bg | `#ffffff` | `#0f172a` |
| `--color-secondary` | Brand secondary | `#0ea5e9` | `#38bdf8` |
| `--color-danger` | Error / destructive action | `#ef4444` | `#f87171` |
| `--color-warning` | Warning state | `#f59e0b` | `#fbbf24` |
| `--color-success` | Success state | `#10b981` | `#34d399` |
| `--color-border` | Default border | `#e5e7eb` | `#334155` |

### Rule

```css
/* CORRECT */
.card { background-color: var(--color-surface); }
.title { color: var(--color-text); }
.cta { background-color: var(--color-primary); color: var(--color-primary-fg); }

/* WRONG */
.card { background-color: #ffffff; }       /* never */
.title { color: #111827; }                 /* never */
.cta { background-color: indigo; }        /* never */
```

---

## Dark Mode

Dark mode uses a class on `<html>`:

```html
<!-- Light mode (default) -->
<html>

<!-- Dark mode -->
<html class="dark">
```

### ThemeService Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'theme';

  readonly theme = signal<'light' | 'dark'>(
    (localStorage.getItem(this.storageKey) as 'light' | 'dark') ?? 'light'
  );

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.classList.toggle('dark', t === 'dark');
      localStorage.setItem(this.storageKey, t);
    });
  }

  toggle() {
    this.theme.update(t => (t === 'light' ? 'dark' : 'light'));
  }
}
```

### CSS Token Definition

```css
:root {
  --color-bg: #f9fafb;
  --color-surface: #ffffff;
  --color-text: #111827;
  --color-text-muted: #6b7280;
  --color-primary: #4f46e5;
  --color-primary-fg: #ffffff;
  --color-border: #e5e7eb;
  --color-danger: #ef4444;
  --color-success: #10b981;
  --color-warning: #f59e0b;
}

html.dark {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-text: #f1f5f9;
  --color-text-muted: #94a3b8;
  --color-primary: #818cf8;
  --color-primary-fg: #0f172a;
  --color-border: #334155;
  --color-danger: #f87171;
  --color-success: #34d399;
  --color-warning: #fbbf24;
}
```

---

## Typography

| Use | Tailwind Class | Size |
|-----|---------------|------|
| Page title | `text-2xl font-bold` | 1.5rem |
| Section heading | `text-xl font-semibold` | 1.25rem |
| Card title | `text-lg font-medium` | 1.125rem |
| Body / default | `text-base` | 1rem |
| Secondary text | `text-sm text-(--color-text-muted)` | 0.875rem |
| Caption / label | `text-xs text-(--color-text-muted)` | 0.75rem |

```html
<h1 class="text-2xl font-bold text-(--color-text)">Page Title</h1>
<p class="text-sm text-(--color-text-muted)">Helper text</p>
```

---

## Spacing

| Context | Value |
|---------|-------|
| Page padding | `p-6` (1.5rem) |
| Section gap | `gap-6` (1.5rem) |
| Card padding | `p-5` (1.25rem) |
| Form field gap | `gap-4` (1rem) |
| Inline item gap | `gap-2` (0.5rem) |

---

## Borders and Radius

| Element | Class |
|---------|-------|
| Cards | `rounded-xl` (0.75rem) |
| Inputs | `rounded-lg` (0.5rem) |
| Badges / pills | `rounded-full` |
| Modals | `rounded-2xl` (1rem) |
| Buttons | `rounded-lg` |

---

## Card Pattern

```html
<div class="
  bg-(--color-surface)
  border border-(--color-border)
  rounded-xl
  p-5
  shadow-sm
">
  <h3 class="text-lg font-medium text-(--color-text)">Card Title</h3>
  <p class="text-sm text-(--color-text-muted) mt-1">Card description</p>
</div>
```

---

## Input Pattern

```html
<input
  type="text"
  class="
    w-full
    bg-(--color-surface)
    border border-(--color-border)
    text-(--color-text)
    rounded-lg
    px-3 py-2
    text-sm
    outline-none
    focus:ring-2 focus:ring-(--color-primary)
    focus:border-(--color-primary)
    placeholder:text-(--color-text-muted)
    transition
  "
  placeholder="Enter value..."
/>
```

---

## Button Patterns

### Primary Button

```html
<button class="
  bg-(--color-primary)
  text-(--color-primary-fg)
  rounded-lg
  px-4 py-2
  text-sm font-medium
  hover:opacity-90
  active:scale-95
  transition
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Save
</button>
```

### Secondary Button

```html
<button class="
  bg-transparent
  border border-(--color-border)
  text-(--color-text)
  rounded-lg
  px-4 py-2
  text-sm font-medium
  hover:bg-(--color-surface-alt)
  transition
">
  Cancel
</button>
```

### Destructive Button

```html
<button class="
  bg-(--color-danger)
  text-white
  rounded-lg
  px-4 py-2
  text-sm font-medium
  hover:opacity-90
  transition
">
  Delete
</button>
```

---

## Modal Pattern

```html
<!-- Backdrop -->
<div class="
  fixed inset-0
  bg-black/40
  backdrop-blur-sm
  z-50
  flex items-center justify-center
">
  <!-- Panel -->
  <div class="
    bg-(--color-surface)
    border border-(--color-border)
    rounded-2xl
    p-6
    w-full max-w-md
    shadow-xl
  ">
    <h2 class="text-xl font-semibold text-(--color-text)">Modal Title</h2>
    <div class="mt-4 text-sm text-(--color-text-muted)">
      <!-- content -->
    </div>
    <div class="mt-6 flex justify-end gap-3">
      <!-- action buttons -->
    </div>
  </div>
</div>
```

---

## Badge / Status Pattern

```html
<!-- Success -->
<span class="
  inline-flex items-center gap-1
  bg-green-100 text-green-700
  dark:bg-green-900/30 dark:text-green-400
  text-xs font-medium
  px-2 py-0.5
  rounded-full
">Active</span>

<!-- Danger -->
<span class="
  bg-red-100 text-red-700
  dark:bg-red-900/30 dark:text-red-400
  text-xs font-medium
  px-2 py-0.5
  rounded-full
">Error</span>
```

> Prefer CSS variable tokens when your theme defines status colors.

---

## Empty State Pattern

```html
<div class="flex flex-col items-center justify-center py-16 text-center">
  <app-icon name="inbox" class="w-12 h-12 text-(--color-text-muted) mb-4" />
  <h3 class="text-lg font-medium text-(--color-text)">No items yet</h3>
  <p class="text-sm text-(--color-text-muted) mt-1 max-w-xs">
    Get started by creating your first item.
  </p>
  <button class="mt-6 bg-(--color-primary) text-(--color-primary-fg) rounded-lg px-4 py-2 text-sm">
    Create Item
  </button>
</div>
```

---

## Loading State Pattern

```html
@if (loading()) {
  <div class="flex items-center justify-center py-12">
    <div class="w-8 h-8 border-2 border-(--color-primary) border-t-transparent rounded-full animate-spin"></div>
  </div>
}
```
