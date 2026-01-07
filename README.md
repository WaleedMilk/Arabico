# Arabico

A Qur'anic Adaptive Reader that helps learners acquire Qur'anic Arabic primarily through contextual vocabulary exposure and review.

**Core Principle:** Words are learned in context; progress is tracked by familiarity, not completion of grammar lessons.

## Features

- **Mushaf Reader** - Navigate and read the Quran with word-level interactions
- **Tap-to-Gloss** - Tap any word to see its meaning and lemma
- **Vocabulary Tracking** - Color-coded familiarity levels (new, seen, learning, known)
- **Offline Support** - PWA with local data storage
- **Dark Mode** - Soft academia aesthetic in light and dark themes

## Tech Stack

- **Framework:** SvelteKit with Svelte 5
- **Styling:** Tailwind CSS v4
- **Storage:** Dexie.js (IndexedDB)
- **PWA:** @vite-pwa/sveltekit
- **Deployment:** Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── lib/
│   ├── components/     # Svelte components
│   │   ├── ui/         # Reusable UI components
│   │   └── reader/     # Quran reader components
│   ├── stores/         # Svelte 5 rune-based state
│   ├── db/             # Dexie database
│   ├── data/           # Quran data and utilities
│   └── types/          # TypeScript types
├── routes/             # SvelteKit routes
│   ├── surah/[id]/     # Surah reading view
│   └── vocabulary/     # Vocabulary review
└── app.css             # Global styles
```

## Familiarity Levels

| Level | Description | Visual |
|-------|-------------|--------|
| New | Never tapped | No highlight |
| Seen | Tapped once | Light sepia |
| Learning | Added to review | Strong sepia |
| Known | Consistently recalled | No highlight |
| Ignored | User hidden | Dimmed |

## Non-Goals

This project intentionally does not aim to be:
- A tajweed tutor
- A grammar course
- A memorization tracker
- A tafsir app

## Data Sources

- **Quran Text:** [Tanzil.net](https://tanzil.net) (Uthmani script)
- **Morphology:** Quranic Arabic Corpus

## License

Open source. Quran text from Tanzil.net with proper attribution.

---

Built with reverence for the sacred text.
