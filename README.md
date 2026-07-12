# Arabico

Arabico is an adaptive reader for learning Arabic through classical source
texts, using contextual vocabulary exposure and spaced review instead of
rote grammar drills.

**Core Principle:** Words are learned in context; progress is tracked by
familiarity, not completion of grammar lessons.

## Features

- **Word-by-Word Reader** - Navigate and read classical Arabic texts with word-level interactions
- **Tap-to-Gloss** - Tap any word to see its meaning and lemma
- **Vocabulary Tracking** - Color-coded familiarity levels (new, seen, learning, known)
- **Offline Support** - PWA with local data storage
- **Dark Mode** - Soft academia aesthetic in light and dark themes

## Tech Stack

- **Framework:** SvelteKit with Svelte 5
- **Styling:** Tailwind CSS v4
- **Storage:** Dexie.js (IndexedDB)
- **PWA:** @vite-pwa/sveltekit
- **Deployment:** GitHub Pages (static build)

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

## Deployment

The app builds to a fully static site via `@sveltejs/adapter-static` and
deploys to GitHub Pages through `.github/workflows/deploy.yml` on every push
to `main`. To enable it on a fork: go to **Settings → Pages** and set
**Source** to **GitHub Actions**.

## Project Structure

```
src/
├── lib/
│   ├── components/     # Svelte components
│   │   ├── ui/         # Reusable UI components
│   │   └── reader/     # Reader components
│   ├── stores/         # Svelte 5 rune-based state
│   ├── db/             # Dexie database
│   ├── data/           # Text data and utilities
│   └── types/          # TypeScript types
├── routes/             # SvelteKit routes
│   ├── surah/[id]/     # Chapter reading view
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
- A pronunciation/recitation tutor
- A full grammar course
- A memorization tracker
- A commentary/exegesis app

## Data Sources

The current text corpus is the Quran, used here as a source text for
Arabic vocabulary acquisition.

- **Text:** [Tanzil.net](https://tanzil.net) (Uthmani script)
- **Morphology:** Quranic Arabic Corpus

## Roadmap

- Cross-device sync via a backend (not yet implemented in this build; all
  progress is currently stored locally in the browser)
- Support for additional classical Arabic source texts

## License

[MIT](LICENSE). Quran text from Tanzil.net used with attribution per their
usage terms.
