import { U as head, V as ensure_array_like, W as attr, X as stringify } from "../../chunks/index2.js";
import { t as toArabicNumerals, s as surahList } from "../../chunks/surahs.js";
import { e as escape_html } from "../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    head("1uha8ag", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Arabico - Surah Index</title>`);
      });
    });
    $$renderer2.push(`<div class="space-y-8"><section class="py-8 text-center"><h1 class="font-arabic text-4xl text-[var(--text-primary)] mb-2">القرآن الكريم</h1> <p class="text-lg text-[var(--text-secondary)] italic">The Noble Quran</p> <p class="mt-4 text-[var(--text-muted)] max-w-lg mx-auto">Learn Quranic Arabic through contextual vocabulary exposure.
			Tap any word to see its meaning and track your progress.</p></section> <section><h2 class="text-xl font-medium text-[var(--text-primary)] mb-4">Surahs</h2> <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
    const each_array = ensure_array_like(surahList);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let surah = each_array[$$index];
      $$renderer2.push(`<a${attr("href", `/surah/${stringify(surah.id)}`)} class="group flex items-center gap-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 transition-all hover:border-[var(--accent-color)] hover:shadow-md"><div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sepia-100 dark:bg-sepia-800"><span class="font-arabic text-sm text-[var(--accent-color)]">${escape_html(toArabicNumerals(surah.id))}</span></div> <div class="min-w-0 flex-1"><div class="flex items-baseline justify-between gap-2"><h3 class="truncate font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">${escape_html(surah.englishName)}</h3> <span class="font-arabic text-lg text-[var(--text-secondary)] flex-shrink-0">${escape_html(surah.name)}</span></div> <div class="flex items-center gap-2 text-sm text-[var(--text-muted)]"><span>${escape_html(surah.englishNameTranslation)}</span> <span>·</span> <span>${escape_html(surah.numberOfAyahs)} verses</span></div></div> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5 flex-shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent-color)]"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"></path></svg></a>`);
    }
    $$renderer2.push(`<!--]--></div></section> <section class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6"><h2 class="text-lg font-medium text-[var(--text-primary)] mb-3">How to Use</h2> <ul class="space-y-2 text-[var(--text-secondary)]"><li class="flex items-start gap-2"><span class="text-gold">•</span> <span><strong>Tap any word</strong> to see its English meaning and lemma</span></li> <li class="flex items-start gap-2"><span class="text-gold">•</span> <span><strong>Words are colored</strong> based on your familiarity level</span></li> <li class="flex items-start gap-2"><span class="text-gold">•</span> <span><strong>Add words to review</strong> to build your personal vocabulary</span></li> <li class="flex items-start gap-2"><span class="text-gold">•</span> <span><strong>Progress is saved</strong> automatically in your browser</span></li></ul></section></div>`);
  });
}
export {
  _page as default
};
