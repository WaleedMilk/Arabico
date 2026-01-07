import { Y as attr_class, W as attr, X as stringify, V as ensure_array_like, Z as store_get, U as head, _ as unsubscribe_stores } from "../../../../chunks/index2.js";
import { g as getContext, e as escape_html } from "../../../../chunks/context.js";
import "clsx";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import { t as toArabicNumerals, g as getSurahById } from "../../../../chunks/surahs.js";
import { v as vocabularyDB } from "../../../../chunks/index3.js";
function createVocabularyStore() {
  let familiarityCache = /* @__PURE__ */ new Map();
  let isLoaded = false;
  async function loadCache() {
    return;
  }
  return {
    get cache() {
      return familiarityCache;
    },
    get isLoaded() {
      return isLoaded;
    },
    async init() {
      await loadCache();
    },
    getFamiliarity(wordId) {
      return familiarityCache.get(wordId) || "new";
    },
    async markSeen(wordId, surfaceForm, lemma, gloss, location) {
      return;
    },
    async updateFamiliarity(wordId, level) {
      return;
    },
    async addToReview(wordId) {
      await this.updateFamiliarity(wordId, "learning");
    },
    async markKnown(wordId) {
      await this.updateFamiliarity(wordId, "known");
    },
    async ignore(wordId) {
      await this.updateFamiliarity(wordId, "ignored");
    },
    async getStats() {
      return vocabularyDB.getStats();
    }
  };
}
const vocabulary = createVocabularyStore();
const getStores = () => {
  const stores$1 = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores$1.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores$1.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores$1.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
const alFatihah = [
  {
    id: 1,
    text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    words: [
      { id: "1:1:1", text: "بِسْمِ" },
      { id: "1:1:2", text: "اللَّهِ" },
      { id: "1:1:3", text: "الرَّحْمَٰنِ" },
      { id: "1:1:4", text: "الرَّحِيمِ" }
    ]
  },
  {
    id: 2,
    text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    translation: "[All] praise is [due] to Allah, Lord of the worlds.",
    words: [
      { id: "1:2:1", text: "الْحَمْدُ" },
      { id: "1:2:2", text: "لِلَّهِ" },
      { id: "1:2:3", text: "رَبِّ" },
      { id: "1:2:4", text: "الْعَالَمِينَ" }
    ]
  },
  {
    id: 3,
    text: "الرَّحْمَٰنِ الرَّحِيمِ",
    translation: "The Entirely Merciful, the Especially Merciful.",
    words: [
      { id: "1:3:1", text: "الرَّحْمَٰنِ" },
      { id: "1:3:2", text: "الرَّحِيمِ" }
    ]
  },
  {
    id: 4,
    text: "مَالِكِ يَوْمِ الدِّينِ",
    translation: "Sovereign of the Day of Recompense.",
    words: [
      { id: "1:4:1", text: "مَالِكِ" },
      { id: "1:4:2", text: "يَوْمِ" },
      { id: "1:4:3", text: "الدِّينِ" }
    ]
  },
  {
    id: 5,
    text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    translation: "It is You we worship and You we ask for help.",
    words: [
      { id: "1:5:1", text: "إِيَّاكَ" },
      { id: "1:5:2", text: "نَعْبُدُ" },
      { id: "1:5:3", text: "وَإِيَّاكَ" },
      { id: "1:5:4", text: "نَسْتَعِينُ" }
    ]
  },
  {
    id: 6,
    text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
    translation: "Guide us to the straight path.",
    words: [
      { id: "1:6:1", text: "اهْدِنَا" },
      { id: "1:6:2", text: "الصِّرَاطَ" },
      { id: "1:6:3", text: "الْمُسْتَقِيمَ" }
    ]
  },
  {
    id: 7,
    text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
    translation: "The path of those upon whom You have bestowed favor, not of those who have earned [Your] anger or of those who are astray.",
    words: [
      { id: "1:7:1", text: "صِرَاطَ" },
      { id: "1:7:2", text: "الَّذِينَ" },
      { id: "1:7:3", text: "أَنْعَمْتَ" },
      { id: "1:7:4", text: "عَلَيْهِمْ" },
      { id: "1:7:5", text: "غَيْرِ" },
      { id: "1:7:6", text: "الْمَغْضُوبِ" },
      { id: "1:7:7", text: "عَلَيْهِمْ" },
      { id: "1:7:8", text: "وَلَا" },
      { id: "1:7:9", text: "الضَّالِّينَ" }
    ]
  }
];
function getSurahAyahs(surahId) {
  if (surahId === 1) {
    return alFatihah;
  }
  return null;
}
function SurahHeader($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { surah, showBismillah = true } = $$props;
    let shouldShowBismillah = showBismillah && surah.id !== 9 && surah.id !== 1;
    $$renderer2.push(`<header class="surah-header mb-8 border-b border-[var(--border-color)] pb-8 text-center"><div class="mb-4 flex items-center justify-center gap-4"><div class="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--border-color)]"></div> <svg class="h-6 w-6 text-gold" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"></path></svg> <div class="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--border-color)]"></div></div> <h1 class="surah-name-arabic font-arabic text-4xl text-[var(--text-primary)] mb-2">سورة ${escape_html(surah.name)}</h1> <h2 class="text-xl text-[var(--text-secondary)] font-medium mb-1">${escape_html(surah.englishName)}</h2> <p class="text-[var(--text-muted)] italic">${escape_html(surah.englishNameTranslation)}</p> <div class="mt-4 flex items-center justify-center gap-4 text-sm text-[var(--text-muted)]"><span class="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"></path></svg> ${escape_html(surah.revelationType)}</span> <span>•</span> <span>${escape_html(surah.numberOfAyahs)} verses</span></div> `);
    if (shouldShowBismillah) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="bismillah mt-8 font-arabic text-2xl text-[var(--text-primary)]" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></header>`);
  });
}
function WordToken($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { word } = $$props;
    let familiarity = vocabulary.getFamiliarity(word.id);
    const familiarityClasses = {
      new: "",
      seen: "bg-[var(--highlight-seen)]",
      learning: "bg-[var(--highlight-learning)]",
      known: "",
      ignored: "bg-[var(--highlight-ignored)] opacity-60"
    };
    let familiarityClass = familiarityClasses[familiarity] || "";
    $$renderer2.push(`<span${attr_class(`word-token cursor-pointer rounded px-1 py-0.5 transition-all duration-150 hover:bg-[var(--highlight-learning)] focus:outline-none focus:ring-2 focus:ring-gold/50 ${stringify(familiarityClass)}`)} role="button" tabindex="0"${attr("data-word-id", word.id)}${attr("data-familiarity", familiarity)}>${escape_html(word.text)}</span>`);
  });
}
function AyahDisplay($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { ayah } = $$props;
    $$renderer2.push(`<div class="ayah-container group relative py-4"${attr("data-ayah-id", ayah.id)}><div class="quran-text leading-[2.75] text-[var(--text-primary)]" dir="rtl"><!--[-->`);
    const each_array = ensure_array_like(ayah.words);
    for (let index = 0, $$length = each_array.length; index < $$length; index++) {
      let word = each_array[index];
      WordToken($$renderer2, {
        word,
        ayah: ayah.id
      });
      $$renderer2.push(`<!---->  `);
    }
    $$renderer2.push(`<!--]--> <span class="ayah-number inline-flex items-center justify-center text-gold">﴿${escape_html(toArabicNumerals(ayah.id))}﴾</span></div> `);
    if (ayah.translation) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="mt-3 text-sm text-[var(--text-muted)] italic leading-relaxed">${escape_html(ayah.translation)}</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function WordPopover($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    function parseSurahId(id) {
      if (!id) return 0;
      const parsed = parseInt(id, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    let surahId = parseSurahId(store_get($$store_subs ??= {}, "$page", page).params.id);
    let surah = getSurahById(surahId);
    let ayahs = getSurahAyahs(surahId);
    head("xhvt04", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(surah ? `${surah.englishName} - Arabico` : "Surah Not Found")}</title>`);
      });
    });
    if (surah) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="surah-reader">`);
      SurahHeader($$renderer2, { surah, showBismillah: surah.id !== 1 });
      $$renderer2.push(`<!----> `);
      if (ayahs) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="space-y-2"><!--[-->`);
        const each_array = ensure_array_like(ayahs);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let ayah = each_array[$$index];
          AyahDisplay($$renderer2, { ayah });
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-8 text-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mx-auto h-12 w-12 text-[var(--text-muted)] mb-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path></svg> <h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">Coming Soon</h3> <p class="text-[var(--text-muted)] max-w-md mx-auto">This surah's word-by-word data is being prepared. Currently, only Surah Al-Fatihah is available for demonstration.</p> <a href="/surah/1" class="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sepia-600">Try Al-Fatihah <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"></path></svg></a></div>`);
      }
      $$renderer2.push(`<!--]--> <nav class="mt-8 flex items-center justify-between border-t border-[var(--border-color)] pt-6">`);
      if (surahId > 1) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<a${attr("href", `/surah/${stringify(surahId - 1)}`)} class="flex items-center gap-2 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"></path></svg> <span>Previous Surah</span></a>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div></div>`);
      }
      $$renderer2.push(`<!--]--> <a href="/" class="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">All Surahs</a> `);
      if (surahId < 114) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<a${attr("href", `/surah/${stringify(surahId + 1)}`)} class="flex items-center gap-2 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"><span>Next Surah</span> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"></path></svg></a>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div></div>`);
      }
      $$renderer2.push(`<!--]--></nav></div> `);
      WordPopover($$renderer2);
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="py-12 text-center"><h1 class="text-2xl font-medium text-[var(--text-primary)] mb-2">Surah Not Found</h1> <p class="text-[var(--text-muted)] mb-4">The requested surah does not exist.</p> <a href="/" class="inline-flex items-center gap-2 text-[var(--accent-color)] hover:underline"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"></path></svg> Back to Surah Index</a></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
