# Component Development Guide

> AI Development Guide: Follow these patterns when creating or modifying components to maintain consistency across the codebase.

## Quick Start

Generate a new component:
```bash
npm run new:component reader MyComponent
```

This creates `src/lib/components/reader/MyComponent.svelte` with boilerplate.

## File Organization

Place components in the appropriate domain folder:

| Domain | Path | Purpose |
|--------|------|---------|
| `reader` | `src/lib/components/reader/` | Quran reading (words, ayahs, panels) |
| `review` | `src/lib/components/review/` | Review cards and sessions |
| `navigation` | `src/lib/components/navigation/` | Nav bars, menus |
| `audio` | `src/lib/components/audio/` | Audio players, controls |
| `ui` | `src/lib/components/ui/` | Reusable UI elements |

## Component Template

```svelte
<script lang="ts">
  // =============================================
  // 1. IMPORTS
  // Order: types → components → utilities → stores
  // =============================================
  import type { MyType, CallbackData } from '$lib/types';
  import ChildComponent from './ChildComponent.svelte';
  import { formatDate } from '$lib/utils';
  import { vocabulary } from '$lib/stores/vocabulary.svelte';

  // =============================================
  // 2. PROPS INTERFACE
  // Always define with JSDoc comments
  // =============================================
  interface Props {
    /** The primary data for this component */
    data: MyType;
    /** Whether to show expanded view */
    expanded?: boolean;
    /** Callback when user takes action */
    onAction?: (result: CallbackData) => void;
  }

  // =============================================
  // 3. PROPS DESTRUCTURING
  // Provide defaults for optional props
  // =============================================
  let { data, expanded = false, onAction }: Props = $props();

  // =============================================
  // 4. LOCAL STATE
  // Use $state for reactive local variables
  // =============================================
  let isLoading = $state(false);
  let selectedIndex = $state(-1);

  // =============================================
  // 5. DERIVED VALUES
  // Use $derived for computed properties
  // =============================================
  let displayName = $derived(data.name.toUpperCase());
  let isSelected = $derived(selectedIndex >= 0);

  // Complex derivations use $derived.by
  let processedItems = $derived.by(() => {
    return data.items
      .filter(item => item.active)
      .sort((a, b) => a.order - b.order);
  });

  // =============================================
  // 6. EFFECTS
  // Use $effect for side effects
  // =============================================
  $effect(() => {
    // Runs when dependencies change
    console.log('Data updated:', data.id);
  });

  // Cleanup effects
  $effect(() => {
    const handler = () => { /* ... */ };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  });

  // =============================================
  // 7. EVENT HANDLERS
  // Name with handle* prefix
  // =============================================
  function handleClick() {
    selectedIndex = 0;
    onAction?.({ type: 'click', data });
  }

  async function handleSubmit() {
    isLoading = true;
    try {
      await vocabulary.update(data);
      onAction?.({ type: 'success' });
    } finally {
      isLoading = false;
    }
  }

  // =============================================
  // 8. HELPER FUNCTIONS
  // Pure functions for template logic
  // =============================================
  function formatValue(value: number): string {
    return value.toFixed(2);
  }
</script>

<!-- =============================================
     9. TEMPLATE
     Use semantic HTML and kebab-case classes
     ============================================= -->
<div class="my-component" class:expanded class:loading={isLoading}>
  <!-- Header section -->
  <header class="component-header">
    <h2>{displayName}</h2>
    {#if isSelected}
      <span class="badge">Selected</span>
    {/if}
  </header>

  <!-- Main content -->
  <main class="component-body">
    {#each processedItems as item (item.id)}
      <ChildComponent
        data={item}
        onSelect={() => selectedIndex = item.index}
      />
    {:else}
      <p class="empty-state">No items found</p>
    {/each}
  </main>

  <!-- Actions -->
  <footer class="component-footer">
    <button
      onclick={handleClick}
      disabled={isLoading}
      class="action-btn"
    >
      {isLoading ? 'Loading...' : 'Submit'}
    </button>
  </footer>
</div>

<!-- =============================================
     10. STYLES
     Use CSS custom properties for theming
     ============================================= -->
<style>
  .my-component {
    /* Use CSS variables from app.css */
    background: var(--bg-elevated);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 1rem;
  }

  /* State modifiers */
  .my-component.expanded {
    padding: 1.5rem;
  }

  .my-component.loading {
    opacity: 0.7;
    pointer-events: none;
  }

  /* Child elements */
  .component-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .badge {
    background: var(--accent-color);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
  }

  .empty-state {
    color: var(--text-muted);
    text-align: center;
    padding: 2rem;
  }

  .action-btn {
    background: var(--accent-color);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    transition: background 0.2s;
  }

  .action-btn:hover:not(:disabled) {
    background: var(--accent-color-hover, #8b6914);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* =============================================
     MOBILE STYLES
     Always add responsive adjustments
     ============================================= */
  @media (max-width: 768px) {
    .my-component {
      padding: 0.75rem;
    }
  }

  @media (max-width: 400px) {
    .component-header h2 {
      font-size: 1rem;
    }

    .action-btn {
      width: 100%;
      padding: 0.875rem;
    }
  }
</style>
```

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | PascalCase | `WordToken.svelte` |
| CSS classes | kebab-case | `.word-token`, `.card-header` |
| Props | camelCase | `showAnswer`, `onReveal` |
| Events | on* prefix | `onSelect`, `onComplete` |
| Handlers | handle* prefix | `handleClick`, `handleSubmit` |
| State | descriptive camelCase | `isLoading`, `selectedWord` |
| Derived | descriptive camelCase | `displayText`, `filteredItems` |

## CSS Guidelines

### Use CSS Custom Properties

Always use variables from `app.css` for colors:

```css
/* Good */
color: var(--text-primary);
background: var(--bg-elevated);
border-color: var(--border-color);

/* Bad - hardcoded colors */
color: #2D241C;
background: white;
```

### Available CSS Variables

```css
/* Backgrounds */
var(--bg-primary)      /* Page background */
var(--bg-secondary)    /* Card backgrounds */
var(--bg-elevated)     /* Elevated surfaces */

/* Text */
var(--text-primary)    /* Main text */
var(--text-secondary)  /* Secondary text */
var(--text-muted)      /* Muted/hint text */

/* Borders & Accents */
var(--border-color)    /* Borders, dividers */
var(--accent-color)    /* Primary accent (gold) */

/* Familiarity Colors */
var(--text-new)        /* New words */
var(--text-learning)   /* Learning words */
var(--text-known)      /* Known words */
var(--text-ignored)    /* Ignored words */
```

### Mobile-First Approach

1. Design for mobile first
2. Add desktop enhancements with `@media (min-width: ...)`
3. Always test at 375px viewport

```css
/* Base mobile styles */
.component {
  padding: 0.75rem;
  font-size: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    padding: 1.5rem;
  }
}

/* Small phone adjustments */
@media (max-width: 400px) {
  .component {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
}
```

## Event Handling

### Callback Props Pattern

```svelte
<script lang="ts">
  interface Props {
    onSelect?: (item: Item) => void;
    onComplete?: () => void;
  }

  let { onSelect, onComplete }: Props = $props();

  function handleSelect(item: Item) {
    // Call callback if provided
    onSelect?.(item);
  }
</script>
```

### Keyboard Accessibility

```svelte
<div
  role="button"
  tabindex="0"
  onclick={handleClick}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Interactive content
</div>
```

## Arabic Text

### RTL Handling

```svelte
<p class="arabic-text" dir="rtl">
  {arabicContent}
</p>

<style>
  .arabic-text {
    font-family: var(--font-arabic);
    direction: rtl;
    text-align: right;
    font-size: 1.5rem;
    line-height: 2;
  }
</style>
```

### Inline Arabic with English

```svelte
<p>
  The word <span class="font-arabic" dir="rtl">{word}</span> means "{translation}"
</p>
```

## Common Patterns

### Loading States

```svelte
{#if isLoading}
  <div class="loading-spinner">Loading...</div>
{:else if error}
  <div class="error-state">{error}</div>
{:else if items.length === 0}
  <div class="empty-state">No items found</div>
{:else}
  {#each items as item}
    <Item {item} />
  {/each}
{/if}
```

### Conditional Classes

```svelte
<div
  class="card"
  class:active={isActive}
  class:disabled={isDisabled}
  class:highlight={shouldHighlight}
>
```

### Slot Content

```svelte
<!-- Parent -->
<Card>
  <span slot="header">Title</span>
  <p>Body content</p>
  <button slot="footer">Action</button>
</Card>

<!-- Card.svelte -->
<div class="card">
  <header><slot name="header" /></header>
  <main><slot /></main>
  <footer><slot name="footer" /></footer>
</div>
```

## Testing Components

```typescript
// MyComponent.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import MyComponent from './MyComponent.svelte';

describe('MyComponent', () => {
  it('renders with data', () => {
    const { getByText } = render(MyComponent, {
      props: { data: { name: 'Test' } }
    });
    expect(getByText('TEST')).toBeInTheDocument();
  });

  it('calls onAction when clicked', async () => {
    const onAction = vi.fn();
    const { getByRole } = render(MyComponent, {
      props: { data: { name: 'Test' }, onAction }
    });

    await fireEvent.click(getByRole('button'));
    expect(onAction).toHaveBeenCalled();
  });
});
```

## Checklist for New Components

- [ ] File in correct domain folder
- [ ] Props interface with JSDoc comments
- [ ] Default values for optional props
- [ ] Uses CSS custom properties (no hardcoded colors)
- [ ] Mobile responsive styles (@media queries)
- [ ] Keyboard accessible (if interactive)
- [ ] Loading/error/empty states handled
- [ ] Arabic text has `dir="rtl"` and correct font
- [ ] Event handlers use `handle*` naming
- [ ] No console.log statements (use config.dev.debug)
