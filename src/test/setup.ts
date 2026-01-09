/**
 * @fileoverview Test setup for Vitest
 *
 * This file runs before all tests and sets up:
 * - DOM testing utilities
 * - IndexedDB mocking (for Dexie)
 * - localStorage mocking
 * - Common test utilities
 */

import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock IndexedDB for Dexie
import 'fake-indexeddb/auto';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
		get length() {
			return Object.keys(store).length;
		},
		key: vi.fn((index: number) => Object.keys(store)[index] ?? null)
	};
})();

vi.stubGlobal('localStorage', localStorageMock);

// Mock matchMedia for responsive tests
vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
	matches: false,
	media: query,
	onchange: null,
	addListener: vi.fn(),
	removeListener: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	dispatchEvent: vi.fn()
})));

// Reset mocks between tests
beforeEach(() => {
	vi.clearAllMocks();
	localStorageMock.clear();
});

// Export utilities for tests
export { localStorageMock };
