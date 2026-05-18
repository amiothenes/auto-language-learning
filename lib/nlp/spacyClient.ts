export interface SpacyToken {
  surface: string;
  lemma: string;
  pos: string;
  morph: Record<string, string>;
  position: number;
  sentence_index: number;
  is_word: boolean;
}

export interface SpacySentence {
  text: string;
  start: number;
  index: number;
}

export interface SpacyResult {
  tokens: SpacyToken[];
  sentences: SpacySentence[];
}

export async function processWithSpacy(
  text: string,
  languageCode: string
): Promise<SpacyResult> {
  const url = process.env.NLP_SERVICE_URL ?? 'http://localhost:8000';

  const res = await fetch(`${url}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language: languageCode }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`NLP service error ${res.status}: ${body}`);
  }

  return res.json() as Promise<SpacyResult>;
}
