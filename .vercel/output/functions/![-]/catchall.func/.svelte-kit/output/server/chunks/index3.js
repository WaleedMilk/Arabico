import Dexie from "dexie";
class ArabicoDB extends Dexie {
  vocabulary;
  progress;
  settings;
  constructor() {
    super("ArabicoDB");
    this.version(1).stores({
      vocabulary: "++id, wordId, lemma, familiarity, frequencyRank, lastReviewed",
      progress: "++id, surahId, timestamp",
      settings: "key"
    });
  }
}
const db = new ArabicoDB();
const vocabularyDB = {
  async getByWordId(wordId) {
    return db.vocabulary.where("wordId").equals(wordId).first();
  },
  async getByLemma(lemma) {
    return db.vocabulary.where("lemma").equals(lemma).toArray();
  },
  async getByFamiliarity(level) {
    return db.vocabulary.where("familiarity").equals(level).toArray();
  },
  async upsert(entry) {
    const existing = await this.getByWordId(entry.wordId);
    if (existing && existing.id !== void 0) {
      await db.vocabulary.update(existing.id, entry);
      return existing.id;
    }
    return db.vocabulary.add(entry);
  },
  async updateFamiliarity(wordId, familiarity) {
    const entry = await this.getByWordId(wordId);
    if (entry) {
      await db.vocabulary.update(entry.id, {
        familiarity,
        lastReviewed: /* @__PURE__ */ new Date(),
        reviewCount: (entry.reviewCount || 0) + 1
      });
    }
  },
  async getWordsForReview(limit = 20) {
    return db.vocabulary.where("familiarity").anyOf(["seen", "learning"]).sortBy("lastReviewed").then((words) => words.slice(0, limit));
  },
  async getStats() {
    const stats = {
      new: 0,
      seen: 0,
      learning: 0,
      known: 0,
      ignored: 0
    };
    const all = await db.vocabulary.toArray();
    for (const entry of all) {
      stats[entry.familiarity]++;
    }
    return stats;
  }
};
export {
  vocabularyDB as v
};
