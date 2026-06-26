"""
Export wordfreq Zipf scores for top 100K lemmas per language to JSON.

Usage:
    pip install wordfreq
    python scripts/export_wordfreq.py

Output:
    lib/db/seeds/data/wordfreq_en.json
    lib/db/seeds/data/wordfreq_es.json
    lib/db/seeds/data/wordfreq_fr.json
    lib/db/seeds/data/wordfreq_ru.json

Each file is a flat JSON object: { "lemma": zipfScore, ... }
Consumed by lib/db/seeds/subtlex.ts to populate words.dictionaryFrequency.

Normalization (applied in TypeScript, not here):
    dictionaryFrequency = Math.min(100, Math.round((zipfScore / 7) * 100))
"""

import json
import os
import sys

try:
    from wordfreq import top_n_list, zipf_frequency
except ImportError:
    print("wordfreq not installed. Run: pip install wordfreq")
    sys.exit(1)

LANGUAGES = ["en", "es", "fr", "ru"]
TOP_N = 100_000
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "lib", "db", "seeds", "data")


def export_language(lang: str) -> None:
    print(f"[{lang}] Fetching top {TOP_N:,} tokens...")
    tokens = top_n_list(lang, TOP_N)

    print(f"[{lang}] Computing Zipf scores for {len(tokens):,} tokens...")
    freq_map: dict[str, float] = {}
    for token in tokens:
        score = zipf_frequency(token, lang)
        if score > 0:
            freq_map[token] = round(score, 4)

    out_path = os.path.join(OUTPUT_DIR, f"wordfreq_{lang}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(freq_map, f, ensure_ascii=False, separators=(",", ":"))

    print(f"[{lang}] Written {len(freq_map):,} entries -> {out_path}")


def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for lang in LANGUAGES:
        export_language(lang)
    print("\nDone. Commit the 4 JSON files, then run: npm run db:seed:freq")



if __name__ == "__main__":
    main()
