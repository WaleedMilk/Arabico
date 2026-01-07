/**
 * Download QuranWBW JSON data for all 114 surahs
 * Run with: node scripts/download-quran-data.js
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://raw.githubusercontent.com/qazasaz/quranwbw/master/surahs/data';
const OUTPUT_DIR = path.join(__dirname, '..', 'static', 'data', 'surahs');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function downloadFile(url, filepath) {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(filepath);
		https.get(url, (response) => {
			if (response.statusCode === 302 || response.statusCode === 301) {
				// Follow redirect
				https.get(response.headers.location, (res) => {
					res.pipe(file);
					file.on('finish', () => {
						file.close();
						resolve();
					});
				}).on('error', reject);
			} else if (response.statusCode === 200) {
				response.pipe(file);
				file.on('finish', () => {
					file.close();
					resolve();
				});
			} else {
				reject(new Error(`Failed to download: ${response.statusCode}`));
			}
		}).on('error', reject);
	});
}

async function downloadAllSurahs() {
	console.log('Downloading QuranWBW data for all 114 surahs...\n');

	for (let surah = 1; surah <= 114; surah++) {
		const url = `${BASE_URL}/${surah}.json`;
		const filepath = path.join(OUTPUT_DIR, `${surah}.json`);

		// Skip if already exists
		if (fs.existsSync(filepath)) {
			console.log(`✓ Surah ${surah} already exists, skipping`);
			continue;
		}

		try {
			await downloadFile(url, filepath);
			console.log(`✓ Downloaded Surah ${surah}`);
		} catch (error) {
			console.error(`✗ Failed to download Surah ${surah}:`, error.message);
		}

		// Small delay to be nice to GitHub
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	console.log('\n✓ Download complete!');
	console.log(`Files saved to: ${OUTPUT_DIR}`);
}

downloadAllSurahs().catch(console.error);
