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

function stripBracketAnnotations(raw: string): string {
  return raw.replace(/\[[^\]]*\]/g, '');
}

const TIMEOUT_MS = 45_000; // 45s — covers Railway cold-start model loading (~15-30s)
const MAX_RETRIES = 2;

export async function processWithSpacy(
  text: string,
  languageCode: string
): Promise<SpacyResult> {
  const url = process.env.NLP_SERVICE_URL ?? 'http://localhost:8000';
  const cleanedText = stripBracketAnnotations(text);
  const body = JSON.stringify({ text: cleanedText, language: languageCode });

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const apiKey = process.env.NLP_API_KEY;
      if (apiKey) headers['X-API-Key'] = apiKey;

      const res = await fetch(`${url}/process`, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`NLP service error ${res.status}: ${errBody}`);
      }

      return res.json() as Promise<SpacyResult>;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Only retry on timeout or network errors, not on 4xx/5xx
      const isRetryable = lastError.name === 'TimeoutError' || lastError.name === 'TypeError';
      if (!isRetryable || attempt === MAX_RETRIES) break;
    }
  }

  throw lastError ?? new Error('NLP service unreachable');
}
