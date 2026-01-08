/**
 * Common Vocabulary Loader for Arabico
 *
 * Loads and indexes the curated 80% vocabulary file for priority translations.
 * Handles both regular words (nouns, particles) and verbs with conjugation info.
 *
 * Key features:
 * - Arabic normalization for lookup (preserves diacritics for display)
 * - Verb root extraction and matching
 * - Builds indexes for fast lookups
 */

// ============================================
// Types
// ============================================

export interface CommonWord {
	arabic: string;
	english: string;
	category: string;
	frequency?: number;
	grammar?: string;
	isVerb: false;
}

export interface VerbForms {
	past: string;
	imperfect: string;
	imperative: string;
	activeParticiple: string;
	verbalNoun?: string;
}

export interface CommonVerb {
	root: string; // The root form (e.g., "قَالَ")
	rootLetters: string; // Spaced letters (e.g., "ق و ل")
	meaning: string;
	category: string;
	frequency?: number;
	isVerb: true;
	forms: VerbForms;
}

export type VocabEntry = CommonWord | CommonVerb;

export interface VerbMatch {
	verb: CommonVerb;
	matchedForm: keyof VerbForms | 'conjugated';
	baseForm: string;
}

export interface VocabularyIndex {
	byNormalizedArabic: Map<string, CommonWord>;
	byRoot: Map<string, CommonVerb>;
	byVerbForm: Map<string, VerbMatch>; // All verb forms → their root entry
}

// Raw JSON structure from vocabulary file
interface RawVocabularyTable {
	category: string;
	words?: Array<{
		arabic?: string;
		english?: string;
		grammar?: string;
		frequency?: number;
		root?: string;
		meaning?: string;
		forms?: {
			past?: string;
			imperfect?: string;
			imperative?: string;
			active_participle?: string;
			verbal_noun?: string;
		};
	}>;
}

interface RawVocabularyFile {
	vocabulary_tables: RawVocabularyTable[];
}

// ============================================
// Arabic Text Utilities
// ============================================

// Tashkeel (diacritical marks) to remove for normalization
const TASHKEEL = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

// Tatweel (kashida) elongation character
const TATWEEL = /\u0640/g;

// Alef variants
const ALEF_VARIANTS: Record<string, string> = {
	'\u0623': '\u0627', // أ → ا
	'\u0625': '\u0627', // إ → ا
	'\u0622': '\u0627', // آ → ا
	'\u0671': '\u0627' // ٱ → ا
};

// Yaa variants
const YAA_ALEF_MAQSURA = /\u0649/g; // ى → ي

// Taa marbuta
const TAA_MARBUTA = /\u0629/g; // ة → ه

/**
 * Normalize Arabic text for lookup purposes ONLY.
 * Display should always preserve original diacritics.
 */
export function normalizeForLookup(text: string): string {
	let normalized = text;

	// Remove tashkeel
	normalized = normalized.replace(TASHKEEL, '');

	// Remove tatweel
	normalized = normalized.replace(TATWEEL, '');

	// Normalize alef variants
	for (const [variant, replacement] of Object.entries(ALEF_VARIANTS)) {
		normalized = normalized.replaceAll(variant, replacement);
	}

	// Normalize yaa/alef maqsura
	normalized = normalized.replace(YAA_ALEF_MAQSURA, '\u064A');

	// Normalize taa marbuta to haa
	normalized = normalized.replace(TAA_MARBUTA, '\u0647');

	// Trim whitespace
	normalized = normalized.trim();

	return normalized;
}

/**
 * Extract root letters from Arabic word (for display as spaced letters)
 */
export function extractRootLetters(rootForm: string): string {
	const normalized = normalizeForLookup(rootForm);
	// Get consonants only (letters that aren't long vowels)
	const consonants = normalized.replace(/[اوي]/g, '');
	return consonants.split('').join(' ');
}

/**
 * Common Arabic verb prefixes
 */
const VERB_PREFIXES = [
	'يَ',
	'يُ',
	'يِ',
	'ي',
	'تَ',
	'تُ',
	'تِ',
	'ت',
	'أَ',
	'أُ',
	'أ',
	'نَ',
	'نُ',
	'ن',
	'سَ',
	'سَيَ',
	'سَتَ',
	'سَأَ',
	'سَنَ',
	'س',
	'لِ',
	'لِيَ',
	'ل',
	'فَ',
	'فَيَ',
	'ف',
	'وَ',
	'وَيَ',
	'و'
];

/**
 * Common Arabic verb suffixes
 */
const VERB_SUFFIXES = [
	'ُونَ',
	'ُون',
	'ِينَ',
	'ِين',
	'َانِ',
	'َان',
	'ُوا',
	'وا',
	'ْنَ',
	'نَ',
	'َتْ',
	'ت',
	'ْتُ',
	'ْتَ',
	'ْتِ',
	'ْتُمْ',
	'ْتُم',
	'ْنَا',
	'نا',
	'ا' // Alef for dual/plural
];

/**
 * Try to extract the base form from a conjugated verb
 * by stripping common prefixes and suffixes
 */
export function stripVerbAffixes(word: string): string {
	let stripped = word;

	// Try to remove prefixes
	for (const prefix of VERB_PREFIXES) {
		if (stripped.startsWith(prefix) && stripped.length > prefix.length + 2) {
			stripped = stripped.slice(prefix.length);
			break;
		}
	}

	// Try to remove suffixes
	for (const suffix of VERB_SUFFIXES) {
		if (stripped.endsWith(suffix) && stripped.length > suffix.length + 2) {
			stripped = stripped.slice(0, -suffix.length);
			break;
		}
	}

	return stripped;
}

// ============================================
// Vocabulary Loading & Indexing
// ============================================

let vocabularyIndex: VocabularyIndex | null = null;
let loadingPromise: Promise<VocabularyIndex> | null = null;

/**
 * Load and index the common vocabulary file
 */
export async function loadCommonVocabulary(): Promise<VocabularyIndex> {
	// Return cached index if available
	if (vocabularyIndex) {
		return vocabularyIndex;
	}

	// Return existing promise if already loading
	if (loadingPromise) {
		return loadingPromise;
	}

	loadingPromise = (async () => {
		try {
			const response = await fetch('/data/common-vocabulary.json');
			if (!response.ok) {
				throw new Error(`Failed to load vocabulary: ${response.status}`);
			}

			const data: RawVocabularyFile = await response.json();
			vocabularyIndex = buildIndex(data);
			return vocabularyIndex;
		} catch (error) {
			console.error('Error loading common vocabulary:', error);
			// Return empty index on error
			vocabularyIndex = {
				byNormalizedArabic: new Map(),
				byRoot: new Map(),
				byVerbForm: new Map()
			};
			return vocabularyIndex;
		} finally {
			loadingPromise = null;
		}
	})();

	return loadingPromise;
}

/**
 * Build lookup indexes from raw vocabulary data
 */
function buildIndex(data: RawVocabularyFile): VocabularyIndex {
	const byNormalizedArabic = new Map<string, CommonWord>();
	const byRoot = new Map<string, CommonVerb>();
	const byVerbForm = new Map<string, VerbMatch>();

	for (const table of data.vocabulary_tables) {
		if (!table.words) continue;

		for (const word of table.words) {
			// Check if it's a verb entry (has root and forms)
			if (word.root && word.forms && word.meaning) {
				const verb: CommonVerb = {
					root: word.root,
					rootLetters: extractRootLetters(word.root),
					meaning: word.meaning,
					category: table.category,
					frequency: word.frequency,
					isVerb: true,
					forms: {
						past: word.forms.past || word.root,
						imperfect: word.forms.imperfect || '',
						imperative: word.forms.imperative || '',
						activeParticiple: word.forms.active_participle || '',
						verbalNoun: word.forms.verbal_noun
					}
				};

				// Index by normalized root
				const normalizedRoot = normalizeForLookup(word.root);
				byRoot.set(normalizedRoot, verb);

				// Index all verb forms for quick lookup
				const formEntries: [keyof VerbForms, string][] = [
					['past', verb.forms.past],
					['imperfect', verb.forms.imperfect],
					['imperative', verb.forms.imperative],
					['activeParticiple', verb.forms.activeParticiple]
				];

				if (verb.forms.verbalNoun) {
					formEntries.push(['verbalNoun', verb.forms.verbalNoun]);
				}

				for (const [formType, formValue] of formEntries) {
					if (formValue) {
						const normalizedForm = normalizeForLookup(formValue);
						byVerbForm.set(normalizedForm, {
							verb,
							matchedForm: formType,
							baseForm: formValue
						});
					}
				}
			}
			// Regular word entry (noun, particle, etc.)
			else if (word.arabic && word.english) {
				// Handle entries with multiple forms separated by /
				const arabicForms = word.arabic.split(/[\/،,]/);

				for (const arabicForm of arabicForms) {
					const trimmed = arabicForm.trim();
					if (!trimmed || trimmed.includes('...')) continue; // Skip placeholder entries

					const commonWord: CommonWord = {
						arabic: trimmed,
						english: word.english,
						category: table.category,
						frequency: word.frequency,
						grammar: word.grammar || undefined,
						isVerb: false
					};

					const normalized = normalizeForLookup(trimmed);
					// Only add if not already present (first definition wins)
					if (!byNormalizedArabic.has(normalized)) {
						byNormalizedArabic.set(normalized, commonWord);
					}
				}
			}
		}
	}

	return { byNormalizedArabic, byRoot, byVerbForm };
}

// ============================================
// Lookup Functions
// ============================================

/**
 * Look up a regular word (noun, particle) by Arabic text
 */
export function lookupWord(arabic: string): CommonWord | null {
	if (!vocabularyIndex) return null;

	const normalized = normalizeForLookup(arabic);
	return vocabularyIndex.byNormalizedArabic.get(normalized) || null;
}

/**
 * Look up a verb by its root form
 */
export function lookupVerbByRoot(root: string): CommonVerb | null {
	if (!vocabularyIndex) return null;

	const normalized = normalizeForLookup(root);
	return vocabularyIndex.byRoot.get(normalized) || null;
}

/**
 * Look up a verb by any of its conjugated forms
 */
export function lookupVerbByForm(arabicForm: string): VerbMatch | null {
	if (!vocabularyIndex) return null;

	const normalized = normalizeForLookup(arabicForm);

	// Direct match to known form
	const directMatch = vocabularyIndex.byVerbForm.get(normalized);
	if (directMatch) {
		return directMatch;
	}

	// Try stripping affixes and matching
	const stripped = stripVerbAffixes(arabicForm);
	const strippedNormalized = normalizeForLookup(stripped);

	const strippedMatch = vocabularyIndex.byVerbForm.get(strippedNormalized);
	if (strippedMatch) {
		return {
			...strippedMatch,
			matchedForm: 'conjugated'
		};
	}

	return null;
}

/**
 * Get translation for an Arabic word with priority:
 * 1. Common vocabulary (nouns/particles)
 * 2. Verb forms
 * Returns null if not found in common vocabulary
 */
export function getCommonTranslation(
	arabic: string
): { translation: string; isVerb: boolean; verbMatch?: VerbMatch } | null {
	// Try regular word lookup first
	const word = lookupWord(arabic);
	if (word) {
		return {
			translation: word.english,
			isVerb: false
		};
	}

	// Try verb lookup
	const verbMatch = lookupVerbByForm(arabic);
	if (verbMatch) {
		return {
			translation: verbMatch.verb.meaning,
			isVerb: true,
			verbMatch
		};
	}

	return null;
}

/**
 * Check if vocabulary is loaded
 */
export function isVocabularyLoaded(): boolean {
	return vocabularyIndex !== null;
}

/**
 * Get vocabulary statistics
 */
export function getVocabularyStats(): { words: number; verbs: number; verbForms: number } {
	if (!vocabularyIndex) {
		return { words: 0, verbs: 0, verbForms: 0 };
	}

	return {
		words: vocabularyIndex.byNormalizedArabic.size,
		verbs: vocabularyIndex.byRoot.size,
		verbForms: vocabularyIndex.byVerbForm.size
	};
}
