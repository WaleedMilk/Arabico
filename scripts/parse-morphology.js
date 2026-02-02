/**
 * Parse the Quranic Corpus Morphology file (v0.4) and output per-surah JSON files.
 *
 * Input:  quranic-corpus-morphology-0.4.txt (tab-separated)
 * Output: static/data/morphology/{surahId}.json  (114 files)
 *
 * Run with: node scripts/parse-morphology.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TENSE_CODES = new Set(['PERF', 'IMPF', 'IMPV']);
const VOICE_CODES = new Set(['ACT', 'PASS']);
const MOOD_CODES = new Set(['SUBJ', 'JUS']);
const CASE_CODES = new Set(['NOM', 'ACC', 'GEN']);
const VERB_FORM_RE = /^\(([IVX]+)\)$/;
const LOCATION_RE = /^\((\d+):(\d+):(\d+):(\d+)\)$/;

const PREFIX_MAP = {
	'w:CONJ+': 'wa+', 'f:CONJ+': 'fa+', 'l:P+': 'li+',
	'l:EMPH+': 'la+', 'l:IMPV+': 'la+', 'l:PRP+': 'li+',
	'w:P+': 'wa+', 'w:CIRC+': 'wa+', 'w:COM+': 'wa+',
	'w:SUP+': 'wa+', 'w:REM+': 'wa+',
	'f:RSLT+': 'fa+', 'f:CAUS+': 'fa+', 'f:SUP+': 'fa+', 'f:REM+': 'fa+',
	'ka+': 'ka+', 'ta+': 'ta+', 'sa+': 'sa+', 'ya+': 'ya+', 'ha+': 'ha+'
};

function parsePGN(token, features) {
	const match = token.match(/^([123]?)([MF]?)([SDP])$/);
	if (match) {
		const [, person, gender, number] = match;
		if (person) features.person = person;
		if (gender) features.gender = gender;
		if (number) features.number = number;
		return true;
	}
	if (token === 'M' || token === 'F') {
		features.gender = token;
		return true;
	}
	return false;
}

function parseStemFeatures(featureStr) {
	const features = {};
	const raw = featureStr.startsWith('STEM|') ? featureStr.slice(5) : featureStr;
	const tokens = raw.split('|');

	for (const token of tokens) {
		if (token.startsWith('POS:')) { features.pos = token.slice(4); continue; }
		if (token.startsWith('LEM:')) { features.lemma = token.slice(4); continue; }
		if (token.startsWith('ROOT:')) { features.root = token.slice(5); continue; }
		const vfMatch = token.match(VERB_FORM_RE);
		if (vfMatch) { features.verbForm = vfMatch[1]; continue; }
		if (TENSE_CODES.has(token)) { features.tense = token; continue; }
		if (VOICE_CODES.has(token)) { features.voice = token; continue; }
		if (token === 'PCPL') { features.isParticiple = true; continue; }
		if (MOOD_CODES.has(token)) { features.mood = token; continue; }
		if (CASE_CODES.has(token)) { features.case = token; continue; }
		if (parsePGN(token, features)) { continue; }
	}

	return features;
}

function parsePrefixName(featureStr) {
	const raw = featureStr.startsWith('PREFIX|') ? featureStr.slice(7) : featureStr;
	return PREFIX_MAP[raw] || raw;
}

function parseSuffixName(featureStr) {
	const raw = featureStr.startsWith('SUFFIX|') ? featureStr.slice(7) : featureStr;
	return raw;
}

function parseLocation(loc) {
	const m = loc.match(LOCATION_RE);
	if (!m) return null;
	return { surah: parseInt(m[1], 10), ayah: parseInt(m[2], 10), word: parseInt(m[3], 10), part: parseInt(m[4], 10) };
}

function getPartType(featureStr) {
	if (featureStr.startsWith('PREFIX')) return 'prefix';
	if (featureStr.startsWith('SUFFIX')) return 'suffix';
	return 'stem';
}

function main() {
	const inputPath = path.resolve(__dirname, '..', 'quranic-corpus-morphology-0.4.txt');
	const outputDir = path.resolve(__dirname, '..', 'static', 'data', 'morphology');

	fs.mkdirSync(outputDir, { recursive: true });

	console.log('Reading ' + inputPath + '...');
	const content = fs.readFileSync(inputPath, 'utf-8');
	const lines = content.split('\n');

	const allParts = new Map();
	let dataLineCount = 0;
	let skippedLines = 0;

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#') || trimmed === 'LOCATION\tFORM\tTAG\tFEATURES') continue;

		const columns = trimmed.split('\t');
		if (columns.length < 4) { skippedLines++; continue; }

		const [locationStr, form, tag, featureStr] = columns;
		const loc = parseLocation(locationStr);
		if (!loc) { skippedLines++; continue; }

		dataLineCount++;

		const wordKey = loc.surah + ':' + loc.ayah + ':' + loc.word;
		const partType = getPartType(featureStr);

		let features = {};
		if (partType === 'stem') {
			features = parseStemFeatures(featureStr);
		} else if (partType === 'prefix') {
			features = { pos: tag };
		} else {
			if (featureStr.includes('PRON:')) {
				const pronMatch = featureStr.match(/PRON:(\w+)/);
				if (pronMatch) parsePGN(pronMatch[1], features);
			}
		}

		const part = { form, tag, type: partType, features, rawFeatures: featureStr };

		if (!allParts.has(wordKey)) {
			allParts.set(wordKey, { surah: loc.surah, parts: [] });
		}
		allParts.get(wordKey).parts.push(part);
	}

	console.log('Parsed ' + dataLineCount + ' data lines (' + skippedLines + ' skipped).');
	console.log('Found ' + allParts.size + ' unique words.');

	const surahData = new Map();

	for (const [wordKey, { surah, parts }] of allParts) {
		if (!surahData.has(surah)) surahData.set(surah, {});

		const stemPart = parts.find(p => p.type === 'stem');
		const prefixParts = parts.filter(p => p.type === 'prefix');
		const suffixParts = parts.filter(p => p.type === 'suffix');
		const stemFeatures = stemPart ? stemPart.features : {};

		const prefixes = prefixParts.map(pp => parsePrefixName(pp.rawFeatures));
		const suffixes = suffixParts.map(sp => parseSuffixName(sp.rawFeatures));

		const [, ayah, word] = wordKey.split(':');
		const key = ayah + ':' + word;

		const cleanParts = parts.map(p => {
			return { form: p.form, tag: p.tag, type: p.type, features: p.features };
		});

		const wordData = {
			parts: cleanParts,
			pos: stemFeatures.pos || (stemPart ? stemPart.tag : ''),
			prefixes,
			suffixes
		};

		if (stemFeatures.lemma) wordData.lemma = stemFeatures.lemma;
		if (stemFeatures.root) wordData.root = stemFeatures.root;
		if (stemFeatures.person) wordData.person = stemFeatures.person;
		if (stemFeatures.gender) wordData.gender = stemFeatures.gender;
		if (stemFeatures.number) wordData.number = stemFeatures.number;
		if (stemFeatures.case) wordData.case = stemFeatures.case;
		if (stemFeatures.tense) wordData.tense = stemFeatures.tense;
		if (stemFeatures.verbForm) wordData.verbForm = stemFeatures.verbForm;

		surahData.get(surah)[key] = wordData;
	}

	let filesWritten = 0;
	for (let i = 1; i <= 114; i++) {
		const data = surahData.get(i) || {};
		const outputPath = path.join(outputDir, i + '.json');
		fs.writeFileSync(outputPath, JSON.stringify(data));
		filesWritten++;
	}

	console.log('Wrote ' + filesWritten + ' JSON files to ' + outputDir);

	const wordCounts = Array.from(surahData.entries())
		.map(([id, data]) => ({ id, count: Object.keys(data).length }))
		.sort((a, b) => b.count - a.count);

	console.log('');
	console.log('Top 5 surahs by word count:');
	for (const { id, count } of wordCounts.slice(0, 5)) {
		console.log('  Surah ' + id + ': ' + count + ' words');
	}

	const surahIds = new Set(Array.from(surahData.keys()));
	const missingSurahs = [];
	for (let i = 1; i <= 114; i++) {
		if (!surahIds.has(i)) missingSurahs.push(i);
	}
	if (missingSurahs.length > 0) {
		console.log('');
		console.log('Note: ' + missingSurahs.length + ' surahs had no morphology data (empty JSON written).');
	} else {
		console.log('');
		console.log('All 114 surahs have morphology data.');
	}
}

main();
