/**
 * Parse the Quranic Corpus Morphology file (v0.4) and output per-surah JSON files.
 *
 * Input:  quranic-corpus-morphology-0.4.txt (tab-separated)
 * Output: static/data/morphology/{surahId}.json  (114 files)
 *
 * Run with: npx tsx scripts/parse-morphology.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Types (mirrors src/lib/types/morphology.ts but standalone for the script)
// ---------------------------------------------------------------------------

interface MorphologyFeatures {
	pos?: string;
	lemma?: string;
	root?: string;
	person?: '1' | '2' | '3';
	gender?: 'M' | 'F';
	number?: 'S' | 'D' | 'P';
	case?: 'NOM' | 'ACC' | 'GEN';
	tense?: 'PERF' | 'IMPF' | 'IMPV';
	voice?: 'ACT' | 'PASS';
	verbForm?: string;
	isParticiple?: boolean;
	mood?: 'IND' | 'SUBJ' | 'JUS';
}

interface MorphologyPart {
	form: string;
	tag: string;
	type: 'prefix' | 'stem' | 'suffix';
	features: MorphologyFeatures;
}

interface BuildPart extends MorphologyPart {
	rawFeatures: string;
}

interface WordMorphologyData {
	parts: MorphologyPart[];
	pos: string;
	lemma?: string;
	root?: string;
	person?: string;
	gender?: string;
	number?: string;
	case?: string;
	tense?: string;
	verbForm?: string;
	prefixes: string[];
	suffixes: string[];
}

interface SurahMorphology {
	[ayahWordKey: string]: WordMorphologyData;
}

interface Location {
	surah: number;
	ayah: number;
	word: number;
	part: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TENSE_CODES = new Set(['PERF', 'IMPF', 'IMPV']);
const VOICE_CODES = new Set(['ACT', 'PASS']);
const MOOD_CODES = new Set(['SUBJ', 'JUS']);
const CASE_CODES = new Set(['NOM', 'ACC', 'GEN']);
const VERB_FORM_RE = /^\(([IVX]+)\)$/;
const LOCATION_RE = /^\((\d+):(\d+):(\d+):(\d+)\)$/;

const PREFIX_MAP: Record<string, string> = {
	'w:CONJ+': 'wa+',
	'f:CONJ+': 'fa+',
	'l:P+': 'li+',
	'l:EMPH+': 'la+',
	'l:IMPV+': 'la+',
	'l:PRP+': 'li+',
	'w:P+': 'wa+',
	'w:CIRC+': 'wa+',
	'w:COM+': 'wa+',
	'w:SUP+': 'wa+',
	'w:REM+': 'wa+',
	'f:RSLT+': 'fa+',
	'f:CAUS+': 'fa+',
	'f:SUP+': 'fa+',
	'f:REM+': 'fa+',
	'ka+': 'ka+',
	'ta+': 'ta+',
	'sa+': 'sa+',
	'ya+': 'ya+',
	'ha+': 'ha+',
};

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function parsePGN(token: string, features: MorphologyFeatures): boolean {
	const match = token.match(/^([123]?)([MF]?)([SDP])$/);
	if (match) {
		const [, person, gender, number] = match;
		if (person) features.person = person as '1' | '2' | '3';
		if (gender) features.gender = gender as 'M' | 'F';
		if (number) features.number = number as 'S' | 'D' | 'P';
		return true;
	}
	if (token === 'M' || token === 'F') {
		features.gender = token as 'M' | 'F';
		return true;
	}
	return false;
}

function parseStemFeatures(featureStr: string): MorphologyFeatures {
	const features: MorphologyFeatures = {};
	const raw = featureStr.startsWith('STEM|') ? featureStr.slice(5) : featureStr;
	const tokens = raw.split('|');

	for (const token of tokens) {
		if (token.startsWith('POS:')) { features.pos = token.slice(4); continue; }
		if (token.startsWith('LEM:')) { features.lemma = token.slice(4); continue; }
		if (token.startsWith('ROOT:')) { features.root = token.slice(5); continue; }

		const vfMatch = token.match(VERB_FORM_RE);
		if (vfMatch) { features.verbForm = vfMatch[1]; continue; }

		if (TENSE_CODES.has(token)) { features.tense = token as MorphologyFeatures['tense']; continue; }
		if (VOICE_CODES.has(token)) { features.voice = token as MorphologyFeatures['voice']; continue; }
		if (token === 'PCPL') { features.isParticiple = true; continue; }
		if (MOOD_CODES.has(token)) { features.mood = token as MorphologyFeatures['mood']; continue; }
		if (CASE_CODES.has(token)) { features.case = token as MorphologyFeatures['case']; continue; }
		if (parsePGN(token, features)) { continue; }
		// Skip known non-structural tokens (INDEF, SP:..., VN, IMPN, etc.)
	}

	return features;
}

function parsePrefixName(featureStr: string): string {
	const raw = featureStr.startsWith('PREFIX|') ? featureStr.slice(7) : featureStr;
	return PREFIX_MAP[raw] || raw;
}

function parseSuffixName(featureStr: string): string {
	const raw = featureStr.startsWith('SUFFIX|') ? featureStr.slice(7) : featureStr;
	return raw;
}

function parseLocation(loc: string): Location | null {
	const m = loc.match(LOCATION_RE);
	if (!m) return null;
	return {
		surah: parseInt(m[1], 10),
		ayah: parseInt(m[2], 10),
		word: parseInt(m[3], 10),
		part: parseInt(m[4], 10),
	};
}

function getPartType(featureStr: string): 'prefix' | 'stem' | 'suffix' {
	if (featureStr.startsWith('PREFIX')) return 'prefix';
	if (featureStr.startsWith('SUFFIX')) return 'suffix';
	return 'stem';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
	const inputPath = path.resolve(__dirname, '..', 'quranic-corpus-morphology-0.4.txt');
	const outputDir = path.resolve(__dirname, '..', 'static', 'data', 'morphology');

	fs.mkdirSync(outputDir, { recursive: true });

	console.log(`Reading ${inputPath}...`);
	const content = fs.readFileSync(inputPath, 'utf-8');
	const lines = content.split('\n');

	// Pass 1: Parse all lines into parts grouped by word
	const allParts = new Map<string, { surah: number; parts: BuildPart[] }>();
	let dataLineCount = 0;
	let skippedLines = 0;

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#') || trimmed === 'LOCATION\tFORM\tTAG\tFEATURES') {
			continue;
		}

		const columns = trimmed.split('\t');
		if (columns.length < 4) { skippedLines++; continue; }

		const [locationStr, form, tag, featureStr] = columns;
		const loc = parseLocation(locationStr);
		if (!loc) { skippedLines++; continue; }

		dataLineCount++;

		const wordKey = `${loc.surah}:${loc.ayah}:${loc.word}`;
		const partType = getPartType(featureStr);

		let features: MorphologyFeatures = {};
		if (partType === 'stem') {
			features = parseStemFeatures(featureStr);
		} else if (partType === 'prefix') {
			features = { pos: tag };
		} else {
			// Suffix - parse pronoun reference if present
			if (featureStr.includes('PRON:')) {
				const pronMatch = featureStr.match(/PRON:(\w+)/);
				if (pronMatch) parsePGN(pronMatch[1], features);
			}
		}

		const part: BuildPart = { form, tag, type: partType, features, rawFeatures: featureStr };

		if (!allParts.has(wordKey)) {
			allParts.set(wordKey, { surah: loc.surah, parts: [] });
		}
		allParts.get(wordKey)!.parts.push(part);
	}

	console.log(`Parsed ${dataLineCount} data lines (${skippedLines} skipped).`);
	console.log(`Found ${allParts.size} unique words.`);

	// Pass 2: Aggregate parts into WordMorphologyData per surah
	const surahData = new Map<number, SurahMorphology>();

	for (const [wordKey, { surah, parts }] of allParts) {
		if (!surahData.has(surah)) surahData.set(surah, {});

		const stemPart = parts.find((p) => p.type === 'stem');
		const prefixParts = parts.filter((p) => p.type === 'prefix');
		const suffixParts = parts.filter((p) => p.type === 'suffix');
		const stemFeatures = stemPart?.features || {};

		const prefixes = prefixParts.map((pp) => parsePrefixName(pp.rawFeatures));
		const suffixes = suffixParts.map((sp) => parseSuffixName(sp.rawFeatures));

		// Strip surah from key to get "ayah:word"
		const [, ayah, word] = wordKey.split(':');
		const key = `${ayah}:${word}`;

		// Build clean parts (without rawFeatures) for JSON output
		const cleanParts: MorphologyPart[] = parts.map(({ rawFeatures, ...rest }) => rest);

		const wordData: WordMorphologyData = {
			parts: cleanParts,
			pos: stemFeatures.pos || stemPart?.tag || '',
			prefixes,
			suffixes,
		};

		// Conditionally add optional fields to keep JSON smaller
		if (stemFeatures.lemma) wordData.lemma = stemFeatures.lemma;
		if (stemFeatures.root) wordData.root = stemFeatures.root;
		if (stemFeatures.person) wordData.person = stemFeatures.person;
		if (stemFeatures.gender) wordData.gender = stemFeatures.gender;
		if (stemFeatures.number) wordData.number = stemFeatures.number;
		if (stemFeatures.case) wordData.case = stemFeatures.case;
		if (stemFeatures.tense) wordData.tense = stemFeatures.tense;
		if (stemFeatures.verbForm) wordData.verbForm = stemFeatures.verbForm;

		surahData.get(surah)![key] = wordData;
	}

	// Pass 3: Write 114 JSON files
	let filesWritten = 0;
	for (let i = 1; i <= 114; i++) {
		const data = surahData.get(i) || {};
		const outputPath = path.join(outputDir, `${i}.json`);
		fs.writeFileSync(outputPath, JSON.stringify(data));
		filesWritten++;
	}

	console.log(`Wrote ${filesWritten} JSON files to ${outputDir}`);

	// Print stats
	const wordCounts = Array.from(surahData.entries())
		.map(([id, data]) => ({ id, count: Object.keys(data).length }))
		.sort((a, b) => b.count - a.count);

	console.log('\nTop 5 surahs by word count:');
	for (const { id, count } of wordCounts.slice(0, 5)) {
		console.log(`  Surah ${id}: ${count} words`);
	}

	const surahIds = new Set(Array.from(surahData.keys()));
	const missingSurahs = [];
	for (let i = 1; i <= 114; i++) {
		if (!surahIds.has(i)) missingSurahs.push(i);
	}
	if (missingSurahs.length > 0) {
		console.log(`\nNote: ${missingSurahs.length} surahs had no morphology data (empty JSON written).`);
	} else {
		console.log('\nAll 114 surahs have morphology data.');
	}
}

main();
