import type { Ayah } from '$lib/types';

// Sample data for Al-Fatihah (Surah 1) with word tokenization
// In production, this would come from Tanzil.net data
export const alFatihah: Ayah[] = [
	{
		id: 1,
		text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
		translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
		words: [
			{ id: '1:1:1', text: 'بِسْمِ' },
			{ id: '1:1:2', text: 'اللَّهِ' },
			{ id: '1:1:3', text: 'الرَّحْمَٰنِ' },
			{ id: '1:1:4', text: 'الرَّحِيمِ' }
		]
	},
	{
		id: 2,
		text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
		translation: '[All] praise is [due] to Allah, Lord of the worlds.',
		words: [
			{ id: '1:2:1', text: 'الْحَمْدُ' },
			{ id: '1:2:2', text: 'لِلَّهِ' },
			{ id: '1:2:3', text: 'رَبِّ' },
			{ id: '1:2:4', text: 'الْعَالَمِينَ' }
		]
	},
	{
		id: 3,
		text: 'الرَّحْمَٰنِ الرَّحِيمِ',
		translation: 'The Entirely Merciful, the Especially Merciful.',
		words: [
			{ id: '1:3:1', text: 'الرَّحْمَٰنِ' },
			{ id: '1:3:2', text: 'الرَّحِيمِ' }
		]
	},
	{
		id: 4,
		text: 'مَالِكِ يَوْمِ الدِّينِ',
		translation: 'Sovereign of the Day of Recompense.',
		words: [
			{ id: '1:4:1', text: 'مَالِكِ' },
			{ id: '1:4:2', text: 'يَوْمِ' },
			{ id: '1:4:3', text: 'الدِّينِ' }
		]
	},
	{
		id: 5,
		text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
		translation: 'It is You we worship and You we ask for help.',
		words: [
			{ id: '1:5:1', text: 'إِيَّاكَ' },
			{ id: '1:5:2', text: 'نَعْبُدُ' },
			{ id: '1:5:3', text: 'وَإِيَّاكَ' },
			{ id: '1:5:4', text: 'نَسْتَعِينُ' }
		]
	},
	{
		id: 6,
		text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
		translation: 'Guide us to the straight path.',
		words: [
			{ id: '1:6:1', text: 'اهْدِنَا' },
			{ id: '1:6:2', text: 'الصِّرَاطَ' },
			{ id: '1:6:3', text: 'الْمُسْتَقِيمَ' }
		]
	},
	{
		id: 7,
		text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
		translation: 'The path of those upon whom You have bestowed favor, not of those who have earned [Your] anger or of those who are astray.',
		words: [
			{ id: '1:7:1', text: 'صِرَاطَ' },
			{ id: '1:7:2', text: 'الَّذِينَ' },
			{ id: '1:7:3', text: 'أَنْعَمْتَ' },
			{ id: '1:7:4', text: 'عَلَيْهِمْ' },
			{ id: '1:7:5', text: 'غَيْرِ' },
			{ id: '1:7:6', text: 'الْمَغْضُوبِ' },
			{ id: '1:7:7', text: 'عَلَيْهِمْ' },
			{ id: '1:7:8', text: 'وَلَا' },
			{ id: '1:7:9', text: 'الضَّالِّينَ' }
		]
	}
];

// Word glosses for Al-Fatihah (simplified)
export const wordGlosses: Record<string, { gloss: string; lemma: string }> = {
	'1:1:1': { gloss: 'In the name of', lemma: 'اسم' },
	'1:1:2': { gloss: 'Allah', lemma: 'الله' },
	'1:1:3': { gloss: 'the Most Gracious', lemma: 'رحمن' },
	'1:1:4': { gloss: 'the Most Merciful', lemma: 'رحيم' },
	'1:2:1': { gloss: 'All praise', lemma: 'حمد' },
	'1:2:2': { gloss: 'is for Allah', lemma: 'الله' },
	'1:2:3': { gloss: 'Lord', lemma: 'رب' },
	'1:2:4': { gloss: 'of the worlds', lemma: 'عالم' },
	'1:3:1': { gloss: 'the Most Gracious', lemma: 'رحمن' },
	'1:3:2': { gloss: 'the Most Merciful', lemma: 'رحيم' },
	'1:4:1': { gloss: 'Master/Owner', lemma: 'ملك' },
	'1:4:2': { gloss: 'of the Day', lemma: 'يوم' },
	'1:4:3': { gloss: 'of Judgment', lemma: 'دين' },
	'1:5:1': { gloss: 'You alone', lemma: 'إيا' },
	'1:5:2': { gloss: 'we worship', lemma: 'عبد' },
	'1:5:3': { gloss: 'and You alone', lemma: 'إيا' },
	'1:5:4': { gloss: 'we ask for help', lemma: 'استعان' },
	'1:6:1': { gloss: 'Guide us', lemma: 'هدى' },
	'1:6:2': { gloss: 'to the path', lemma: 'صراط' },
	'1:6:3': { gloss: 'the straight', lemma: 'مستقيم' },
	'1:7:1': { gloss: 'The path', lemma: 'صراط' },
	'1:7:2': { gloss: 'of those whom', lemma: 'الذي' },
	'1:7:3': { gloss: 'You have blessed', lemma: 'أنعم' },
	'1:7:4': { gloss: 'upon them', lemma: 'على' },
	'1:7:5': { gloss: 'not', lemma: 'غير' },
	'1:7:6': { gloss: 'those who earned anger', lemma: 'غضب' },
	'1:7:7': { gloss: 'upon them', lemma: 'على' },
	'1:7:8': { gloss: 'and not', lemma: 'لا' },
	'1:7:9': { gloss: 'those who are astray', lemma: 'ضل' }
};

// Function to get ayahs for a surah (will be expanded)
export function getSurahAyahs(surahId: number): Ayah[] | null {
	if (surahId === 1) {
		return alFatihah;
	}
	return null;
}

// Function to get word gloss
export function getWordGloss(wordId: string): { gloss: string; lemma: string } | null {
	return wordGlosses[wordId] || null;
}
