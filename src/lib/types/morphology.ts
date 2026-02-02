export interface MorphologyPart {
	form: string;
	tag: string;
	type: 'prefix' | 'stem' | 'suffix';
	features: MorphologyFeatures;
}

export interface MorphologyFeatures {
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

export interface WordMorphologyData {
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

export interface SurahMorphology {
	[ayahWordKey: string]: WordMorphologyData;
}
