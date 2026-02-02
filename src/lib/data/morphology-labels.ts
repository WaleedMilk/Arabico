export const POS_LABELS: Record<string, string> = {
	N: 'Noun',
	V: 'Verb',
	ADJ: 'Adjective',
	PN: 'Proper Noun',
	PRON: 'Pronoun',
	REL: 'Relative Pronoun',
	DEM: 'Demonstrative',
	P: 'Preposition',
	CONJ: 'Conjunction',
	NEG: 'Negative Particle',
	INL: 'Initials',
	DET: 'Determiner',
	COND: 'Conditional',
	INTG: 'Interrogative',
	T: 'Time Adverb',
	LOC: 'Location Adverb',
	ACC: 'Accusative Particle',
	CERT: 'Certainty Particle',
	RES: 'Restriction Particle',
	SUP: 'Supplementary Particle',
	EXH: 'Exhortation Particle',
	AVR: 'Aversion Particle',
	EMPH: 'Emphatic Particle',
	INC: 'Inceptive Particle',
	SUR: 'Surprise Particle',
	ANS: 'Answer Particle',
	FUT: 'Future Particle',
	RET: 'Retraction Particle',
	PREV: 'Preventive Particle',
	EXP: 'Explanation Particle',
	AMD: 'Amendment Particle',
	SUB: 'Subordinating Conjunction',
	VOC: 'Vocative Particle',
	IMPN: 'Imperative Noun'
};

export const CASE_LABELS: Record<string, string> = {
	NOM: 'Nominative',
	ACC: 'Accusative',
	GEN: 'Genitive'
};

export const GENDER_LABELS: Record<string, string> = {
	M: 'Masculine',
	F: 'Feminine'
};

export const NUMBER_LABELS: Record<string, string> = {
	S: 'Singular',
	D: 'Dual',
	P: 'Plural'
};

export const TENSE_LABELS: Record<string, string> = {
	PERF: 'Perfect',
	IMPF: 'Imperfect',
	IMPV: 'Imperative'
};

export const MOOD_LABELS: Record<string, string> = {
	IND: 'Indicative',
	SUBJ: 'Subjunctive',
	JUS: 'Jussive'
};

export const VERB_FORM_LABELS: Record<string, string> = {
	I: 'Form I',
	II: 'Form II',
	III: 'Form III',
	IV: 'Form IV',
	V: 'Form V',
	VI: 'Form VI',
	VII: 'Form VII',
	VIII: 'Form VIII',
	IX: 'Form IX',
	X: 'Form X',
	XI: 'Form XI',
	XII: 'Form XII'
};

export const PREFIX_LABELS: Record<string, string> = {
	'Al+': 'Definite Article (al-)',
	'bi+': 'Preposition (bi)',
	'ka+': 'Preposition (ka)',
	'ta+': 'Preposition (ta)',
	'sa+': 'Future (sa)',
	'ya+': 'Vocative (ya)',
	'ha+': 'Vocative (ha)',
	'wa+': 'Conjunction (wa)',
	'fa+': 'Conjunction (fa)',
	'la+': 'Emphatic (la)',
	'li+': 'Preposition (li)'
};

export const SUFFIX_LABELS: Record<string, string> = {
	'PRON:1S': '1st Person Singular (I/me/my)',
	'PRON:1P': '1st Person Plural (we/us/our)',
	'PRON:2MS': '2nd Person Masc. Singular (you/your)',
	'PRON:2FS': '2nd Person Fem. Singular (you/your)',
	'PRON:2MP': '2nd Person Masc. Plural (you/your)',
	'PRON:2FP': '2nd Person Fem. Plural (you/your)',
	'PRON:2D': '2nd Person Dual (you two)',
	'PRON:3MS': '3rd Person Masc. Singular (he/him/his)',
	'PRON:3FS': '3rd Person Fem. Singular (she/her)',
	'PRON:3MP': '3rd Person Masc. Plural (they/them/their)',
	'PRON:3FP': '3rd Person Fem. Plural (they/them/their)',
	'PRON:3D': '3rd Person Dual (they two)'
};
