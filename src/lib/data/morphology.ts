import type { SurahMorphology, WordMorphologyData } from '$lib/types/morphology';

const morphologyCache = new Map<number, SurahMorphology>();
const loadingPromises = new Map<number, Promise<SurahMorphology | null>>();

export async function loadSurahMorphology(surahId: number): Promise<SurahMorphology | null> {
	if (morphologyCache.has(surahId)) {
		return morphologyCache.get(surahId)!;
	}

	if (loadingPromises.has(surahId)) {
		return loadingPromises.get(surahId)!;
	}

	const promise = fetch(`/data/morphology/${surahId}.json`)
		.then((res) => {
			if (!res.ok) return null;
			return res.json() as Promise<SurahMorphology>;
		})
		.then((data) => {
			if (data) morphologyCache.set(surahId, data);
			loadingPromises.delete(surahId);
			return data;
		})
		.catch(() => {
			loadingPromises.delete(surahId);
			return null;
		});

	loadingPromises.set(surahId, promise);
	return promise;
}

export function getMorphologyForWord(
	surahId: number,
	ayahNum: number,
	wordIndex: number
): WordMorphologyData | null {
	const cache = morphologyCache.get(surahId);
	if (!cache) return null;
	return cache[`${ayahNum}:${wordIndex}`] ?? null;
}
