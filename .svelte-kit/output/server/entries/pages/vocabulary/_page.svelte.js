import { U as head } from "../../../chunks/index2.js";
import "../../../chunks/index3.js";
import { e as escape_html } from "../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let stats = { seen: 0, learning: 0, known: 0 };
    let totalWords = stats.seen + stats.learning + stats.known;
    head("el09kd", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Vocabulary - Arabico</title>`);
      });
    });
    $$renderer2.push(`<div class="space-y-8"><header class="text-center"><h1 class="text-2xl font-medium text-[var(--text-primary)] mb-2">Your Vocabulary</h1> <p class="text-[var(--text-muted)]">Track your Quranic Arabic word learning progress</p></header> <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4"><div class="text-3xl font-medium text-[var(--text-primary)]">${escape_html(totalWords)}</div> <div class="text-sm text-[var(--text-muted)]">Total Words Encountered</div></div> <div class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4"><div class="text-3xl font-medium text-gold">${escape_html(stats.learning)}</div> <div class="text-sm text-[var(--text-muted)]">Learning</div></div> <div class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4"><div class="text-3xl font-medium text-green-600 dark:text-green-400">${escape_html(stats.known)}</div> <div class="text-sm text-[var(--text-muted)]">Known</div></div> <div class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4"><div class="text-3xl font-medium text-[var(--text-secondary)]">${escape_html(stats.seen)}</div> <div class="text-sm text-[var(--text-muted)]">Seen</div></div></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-8 text-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mx-auto h-12 w-12 text-[var(--text-muted)] mb-4"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"></path></svg> <h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">Review Mode Coming Soon</h3> <p class="text-[var(--text-muted)] max-w-md mx-auto mb-4">The contextual vocabulary review system is under development. Soon you'll be able to review words in their Quranic context.</p> <a href="/surah/1" class="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sepia-600">Start Reading <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"></path></svg></a></div></div>`);
  });
}
export {
  _page as default
};
