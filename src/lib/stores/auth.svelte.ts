import { browser } from '$app/environment';
import { supabase } from '$lib/db/supabase';
import type { User, Session } from '@supabase/supabase-js';

function createAuthStore() {
	let user = $state<User | null>(null);
	let session = $state<Session | null>(null);
	let isLoading = $state(true);
	let isAnonymous = $state(true);

	return {
		get user() {
			return user;
		},
		get session() {
			return session;
		},
		get isLoading() {
			return isLoading;
		},
		get isAnonymous() {
			return isAnonymous;
		},
		get isAuthenticated() {
			return !!user && !isAnonymous;
		},

		async init() {
			if (!browser) return;

			// Get initial session
			const { data: { session: initialSession } } = await supabase.auth.getSession();
			session = initialSession;
			user = initialSession?.user ?? null;
			isAnonymous = !initialSession?.user;
			isLoading = false;

			// Listen for auth changes
			supabase.auth.onAuthStateChange((_event, newSession) => {
				session = newSession;
				user = newSession?.user ?? null;
				isAnonymous = !newSession?.user;
			});
		},

		async signInWithEmail(email: string, password: string) {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (error) throw error;
			return data;
		},

		async signUpWithEmail(email: string, password: string) {
			const { data, error } = await supabase.auth.signUp({
				email,
				password
			});

			if (error) throw error;
			return data;
		},

		async signInWithGoogle() {
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: browser ? window.location.origin : undefined
				}
			});

			if (error) throw error;
			return data;
		},

		async signOut() {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;

			// Clear local anonymous ID if signing out
			if (browser) {
				localStorage.removeItem('arabico_anon_id');
			}
		},

		async resetPassword(email: string) {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: browser ? `${window.location.origin}/auth/reset-password` : undefined
			});

			if (error) throw error;
		},

		// Get display name or email
		getDisplayName(): string {
			if (!user) return 'Guest';
			return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
		}
	};
}

export const auth = createAuthStore();
