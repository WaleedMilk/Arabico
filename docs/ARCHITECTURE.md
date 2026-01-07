# Arabico Architecture

> AI Development Guide: This document describes the system architecture, patterns, and design decisions. Reference this when making changes to ensure consistency.

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | SvelteKit | 2.x | Full-stack web framework |
| UI | Svelte 5 | 5.x | Component framework with runes |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Local DB | Dexie | 4.x | IndexedDB wrapper |
| Cloud DB | Supabase | - | PostgreSQL + Auth |
| Build | Vite | 6.x | Build tool & dev server |
| Testing | Vitest | - | Unit testing |
| Types | TypeScript | 5.x | Static typing |

## Directory Structure

```
src/
├── lib/
│   ├── components/        # Svelte components organized by domain
│   │   ├── reader/        # Quran reading components
│   │   │   ├── AyahDisplay.svelte
│   │   │   ├── WordToken.svelte
│   │   │   └── WordDetailPanel.svelte
│   │   ├── review/        # Spaced repetition review
│   │   │   ├── ReviewSession.svelte
│   │   │   ├── FlashCard.svelte
│   │   │   ├── RecognitionCard.svelte
│   │   │   └── RecallCard.svelte
│   │   ├── navigation/    # Navigation components
│   │   │   └── MobileNav.svelte
│   │   ├── audio/         # Audio playback
│   │   │   └── AudioPlayer.svelte
│   │   └── ui/            # Reusable UI elements
│   │       └── ThemeToggle.svelte
│   ├── stores/            # Svelte 5 rune-based state management
│   │   ├── auth.svelte.ts
│   │   ├── vocabulary.svelte.ts
│   │   ├── review.svelte.ts
│   │   ├── engagement.svelte.ts
│   │   └── settings.svelte.ts
│   ├── db/                # Database layer
│   │   ├── index.ts       # Dexie schema & operations
│   │   └── supabase.ts    # Cloud sync layer
│   ├── data/              # Quran data loading
│   │   ├── quran-data.ts  # Lazy loader for surah JSON
│   │   └── surahs.ts      # Surah metadata
│   ├── review/            # SRS algorithm & queue
│   │   ├── srs-algorithm.ts
│   │   ├── srs-algorithm.test.ts
│   │   └── review-queue.ts
│   ├── audio/             # Audio utilities
│   │   └── word-audio.ts
│   ├── types/             # TypeScript definitions
│   │   ├── index.ts       # All app types
│   │   └── guards.ts      # Runtime type validation
│   └── config.ts          # Centralized configuration
├── routes/                # SvelteKit file-based routing
│   ├── +layout.svelte     # Root layout (theme, auth)
│   ├── +page.svelte       # Home (surah index)
│   ├── surah/[id]/        # Surah reader
│   ├── review/[mode]/     # Review sessions
│   └── vocabulary/        # Vocabulary list
├── test/                  # Test utilities
│   └── setup.ts           # Vitest setup
└── app.css                # Global styles & CSS variables
```

## Key Patterns

### Store Pattern (Svelte 5 Runes)

All stores use the same pattern for consistency:

```typescript
// src/lib/stores/example.svelte.ts
function createExampleStore() {
  // 1. Private reactive state using $state
  let items = $state<Item[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  return {
    // 2. Getters for reactive access (required for $state)
    get items() { return items; },
    get loading() { return loading; },
    get error() { return error; },

    // 3. Async initialization (called from +layout.svelte)
    async init() {
      loading = true;
      try {
        items = await loadFromDB();
      } catch (e) {
        error = e.message;
      } finally {
        loading = false;
      }
    },

    // 4. Mutation methods
    async addItem(item: Item) {
      items = [...items, item];
      await saveToDb(item);
    },

    // 5. Derived getters
    get itemCount() { return items.length; }
  };
}

export const exampleStore = createExampleStore();
```

**Why Svelte 5 Runes?**
- Simpler mental model than writable stores
- Better TypeScript integration
- Fine-grained reactivity
- Preparation for Svelte 5 stable

### Component Pattern

```svelte
<script lang="ts">
  // 1. Type imports first
  import type { MyType } from '$lib/types';

  // 2. Component imports
  import ChildComponent from './ChildComponent.svelte';

  // 3. Utility imports
  import { someHelper } from '$lib/utils';

  // 4. Props interface with JSDoc
  interface Props {
    /** The data to display */
    data: MyType;
    /** Optional flag with default */
    showDetails?: boolean;
    /** Event callback */
    onAction?: (result: ActionResult) => void;
  }

  // 5. Destructure props with defaults
  let { data, showDetails = false, onAction }: Props = $props();

  // 6. Local state
  let isExpanded = $state(false);

  // 7. Derived values
  let displayText = $derived(data.text.toUpperCase());

  // 8. Effects for side effects
  $effect(() => {
    console.log('Data changed:', data);
  });

  // 9. Event handlers
  function handleClick() {
    onAction?.({ success: true });
  }
</script>

<!-- 10. Template with semantic HTML -->
<div class="my-component">
  <ChildComponent {data} />
</div>

<!-- 11. Scoped styles using CSS variables -->
<style>
  .my-component {
    color: var(--text-primary);
    background: var(--bg-elevated);
  }

  @media (max-width: 400px) {
    .my-component {
      padding: 0.5rem;
    }
  }
</style>
```

### Database Pattern (Offline-First)

```
┌─────────────────────────────────────────┐
│         User Action                     │
│         (e.g., mark word as seen)       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Store Method                    │
│         vocabulary.markSeen()           │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌───────────────┐  ┌──────────────────┐
│  Dexie/IDB    │  │  Supabase        │
│  (Immediate)  │  │  (Background)    │
│  Always works │  │  When online     │
└───────────────┘  └──────────────────┘
```

**Key Principles:**
1. Write to IndexedDB immediately (fast, works offline)
2. Sync to Supabase in background (when online)
3. On load: merge local + cloud, prefer most recent
4. Handle conflicts with timestamps

### Data Flow

```
Reading Flow:
┌──────────────────────────────────────────────────────────┐
│ User taps word → WordToken.onclick                       │
│     → vocabulary.markSeen(wordId)                        │
│         → Update Dexie immediately                       │
│         → Queue Supabase sync (background)               │
│     → Update UI (familiarity color changes)              │
└──────────────────────────────────────────────────────────┘

Review Flow:
┌──────────────────────────────────────────────────────────┐
│ User starts review → reviewStore.startSession(mode)      │
│     → buildReviewQueue() from vocabulary                 │
│     → Filter due words, sort by priority                 │
│                                                          │
│ User answers → reviewStore.recordResponse(quality)       │
│     → calculateNextReview() (SRS algorithm)              │
│     → Update vocabulary entry                            │
│     → Check for promotion to "known"                     │
│     → Move to next card or complete session              │
└──────────────────────────────────────────────────────────┘
```

## Decision Records

### Why Svelte 5 Runes over Svelte 4 Stores?

**Decision:** Use Svelte 5 `$state` runes instead of writable stores

**Rationale:**
- Simpler syntax: `let x = $state(0)` vs `const x = writable(0)`
- No need for `$` prefix in templates when using getters
- Better TypeScript inference
- Fine-grained reactivity (only affected components update)
- Future-proof as Svelte 5 becomes stable

**Trade-offs:**
- Requires getters in store pattern
- Different mental model from Svelte 4

### Why Dexie + Supabase (Dual Storage)?

**Decision:** Use IndexedDB (via Dexie) as primary storage with Supabase cloud sync

**Rationale:**
- **Offline-first:** App works without internet (critical for learning)
- **Fast writes:** IndexedDB is synchronous-feeling
- **Cloud backup:** Supabase provides sync across devices
- **Dexie benefits:** Simple API, migrations, indexes, transactions

**Trade-offs:**
- Increased complexity with two data sources
- Need conflict resolution strategy
- More code to maintain

### Why SM-2 Algorithm with Extensions?

**Decision:** Use SM-2 spaced repetition with Quranic-specific enhancements

**Rationale:**
- SM-2 is proven, well-understood algorithm
- Simple to implement and debug
- Extensions for Quranic Arabic:
  - **Root family bonus:** Arabic words share roots; knowing one helps learn others
  - **Frequency multiplier:** Common Quran words (الله, في, من) need less drilling

**Trade-offs:**
- Not as sophisticated as FSRS or other modern algorithms
- May need tuning for optimal learning

## Configuration

All configuration is centralized in `src/lib/config.ts`:

```typescript
import { config } from '$lib/config';

// Access configuration
config.srs.easeFactor.default  // 2.5
config.ui.mobileBreakpoint     // 768
config.storageKeys.theme       // 'arabico-theme'
config.audio.getWordUrl(1, 1, 1) // URL for word audio
```

See `src/lib/config.ts` for all available configuration options.

## Testing

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
```

**Test Priority:**
1. `srs-algorithm.ts` - Core learning logic (most critical)
2. `review-queue.ts` - Queue building and sorting
3. Store methods - State mutations
4. Components - User interactions

## Adding New Features

### Adding a New Store

1. Create `src/lib/stores/newstore.svelte.ts`
2. Follow the store pattern (see above)
3. Initialize in `src/routes/+layout.svelte` if needed
4. Add types to `src/lib/types/index.ts`

### Adding a New Component

1. Use `npm run new:component <domain> <Name>`
2. Or manually create in `src/lib/components/<domain>/`
3. Follow component pattern (see above)
4. Add mobile styles with `@media (max-width: 400px)`

### Adding a New Route

1. Create `src/routes/newroute/+page.svelte`
2. Add navigation link in `MobileNav.svelte` if needed
3. Update `+layout.svelte` if route needs special handling

## Performance Considerations

- **Lazy load surah data:** Only fetch JSON when surah is opened
- **Virtual scrolling:** Consider for long vocabulary lists
- **Audio preloading:** Preload adjacent words for smooth playback
- **IndexedDB indexes:** Use indexes for common queries
