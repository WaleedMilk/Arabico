import { U as head } from "../../chunks/index2.js";
import "../../chunks/index3.js";
import "clsx";
function ThemeToggle($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<button class="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-sepia-100 dark:hover:bg-sepia-800" aria-label="Toggle theme">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5 text-sepia-600"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"></path></svg>`);
    }
    $$renderer2.push(`<!--]--></button>`);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { children } = $$props;
    head("12qhfyh", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Arabico - Quranic Reader</title>`);
      });
      $$renderer3.push(`<meta name="description" content="A vocabulary-first Quranic adaptive reader"/>`);
    });
    $$renderer2.push(`<div class="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300"><header class="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/80 backdrop-blur-sm"><nav class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3"><a href="/" class="flex items-center gap-2"><span class="font-arabic text-2xl text-[var(--accent-color)]">عربي</span> <span class="text-lg font-medium tracking-wide text-[var(--text-secondary)]">Arabico</span></a> <div class="flex items-center gap-4"><a href="/" class="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">Surahs</a> <a href="/vocabulary" class="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">Vocabulary</a> `);
    ThemeToggle($$renderer2);
    $$renderer2.push(`<!----></div></nav></header> <main class="mx-auto max-w-4xl px-4 py-6">`);
    children($$renderer2);
    $$renderer2.push(`<!----></main> <footer class="border-t border-[var(--border-color)] py-6 text-center text-sm text-[var(--text-muted)]"><p>Quran text from <a href="https://tanzil.net" class="underline hover:text-[var(--text-secondary)]" target="_blank" rel="noopener">Tanzil.net</a></p> <p class="mt-1">Built with reverence for the sacred text</p></footer></div>`);
  });
}
export {
  _layout as default
};
