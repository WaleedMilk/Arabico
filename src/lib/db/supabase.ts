import { createClient } from '@supabase/supabase-js';
import type { FamiliarityLevel } from '$lib/types';

const supabaseUrl = 'https://xhizanisqxprrwifjpbm.supabase.co';
const supabaseKey = 'sb_publishable_0upcXfUbjnxVort2ItT4yA_F7G26Xa_';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types matching Supabase schema
export interface DbVocabularyEntry {
	id?: string;
	user_id: string;
	word_id: string;
	surface_form: string;
	lemma: string;
	root?: string;
	gloss: string;
	frequency_rank: number;
	first_seen: string;
	familiarity: FamiliarityLevel;
	last_reviewed?: string;
	review_count: number;
	created_at?: string;
	updated_at?: string;
}

export interface DbReadingProgress {
	id?: string;
	user_id: string;
	surah_id: number;
	last_ayah: number;
	completed: boolean;
	last_read_at: string;
	created_at?: string;
	updated_at?: string;
}

export interface DbUserSettings {
	id?: string;
	user_id: string;
	theme: 'light' | 'dark' | 'system';
	font_size: number;
	show_transliteration: boolean;
	show_translation: boolean;
	created_at?: string;
	updated_at?: string;
}

// Helper to get current user ID (anonymous or authenticated)
export async function getCurrentUserId(): Promise<string | null> {
	const { data: { session } } = await supabase.auth.getSession();

	if (session?.user) {
		return session.user.id;
	}

	// Check for anonymous ID in localStorage
	if (typeof window !== 'undefined') {
		let anonId = localStorage.getItem('arabico_anon_id');
		if (!anonId) {
			anonId = crypto.randomUUID();
			localStorage.setItem('arabico_anon_id', anonId);
		}
		return anonId;
	}

	return null;
}

// Vocabulary operations
export async function syncVocabularyToSupabase(
	userId: string,
	entries: DbVocabularyEntry[]
): Promise<void> {
	if (entries.length === 0) return;

	const { error } = await supabase
		.from('vocabulary')
		.upsert(
			entries.map(e => ({ ...e, user_id: userId })),
			{ onConflict: 'user_id,word_id' }
		);

	if (error) {
		console.error('Error syncing vocabulary:', error);
		throw error;
	}
}

export async function fetchVocabularyFromSupabase(
	userId: string
): Promise<DbVocabularyEntry[]> {
	const { data, error } = await supabase
		.from('vocabulary')
		.select('*')
		.eq('user_id', userId);

	if (error) {
		console.error('Error fetching vocabulary:', error);
		return [];
	}

	return data || [];
}

export async function updateWordFamiliarity(
	userId: string,
	wordId: string,
	familiarity: FamiliarityLevel
): Promise<void> {
	const { error } = await supabase
		.from('vocabulary')
		.update({
			familiarity,
			last_reviewed: new Date().toISOString(),
			updated_at: new Date().toISOString()
		})
		.eq('user_id', userId)
		.eq('word_id', wordId);

	if (error) {
		console.error('Error updating familiarity:', error);
		throw error;
	}
}

// Reading progress operations
export async function saveReadingProgress(
	userId: string,
	surahId: number,
	lastAyah: number,
	completed: boolean = false
): Promise<void> {
	const { error } = await supabase
		.from('reading_progress')
		.upsert({
			user_id: userId,
			surah_id: surahId,
			last_ayah: lastAyah,
			completed,
			last_read_at: new Date().toISOString()
		}, { onConflict: 'user_id,surah_id' });

	if (error) {
		console.error('Error saving reading progress:', error);
		throw error;
	}
}

export async function fetchReadingProgress(
	userId: string
): Promise<DbReadingProgress[]> {
	const { data, error } = await supabase
		.from('reading_progress')
		.select('*')
		.eq('user_id', userId);

	if (error) {
		console.error('Error fetching reading progress:', error);
		return [];
	}

	return data || [];
}

// User settings operations
export async function saveUserSettings(
	userId: string,
	settings: Partial<DbUserSettings>
): Promise<void> {
	const { error } = await supabase
		.from('user_settings')
		.upsert({
			user_id: userId,
			...settings,
			updated_at: new Date().toISOString()
		}, { onConflict: 'user_id' });

	if (error) {
		console.error('Error saving user settings:', error);
		throw error;
	}
}

export async function fetchUserSettings(
	userId: string
): Promise<DbUserSettings | null> {
	const { data, error } = await supabase
		.from('user_settings')
		.select('*')
		.eq('user_id', userId)
		.single();

	if (error) {
		if (error.code !== 'PGRST116') { // Not found is ok
			console.error('Error fetching user settings:', error);
		}
		return null;
	}

	return data;
}
