import type { TranslationMeaning } from '../db/schema/wordTranslations';

const ENDPOINT = process.env.AZURE_TRANSLATOR_ENDPOINT ?? 'https://api.cognitive.microsofttranslator.com';
const KEY = process.env.AZURE_TRANSLATOR_KEY ?? '';
const REGION = process.env.AZURE_TRANSLATOR_REGION ?? '';

/** False when the Azure key env var is missing — every lookup then returns null without calling Azure. */
export function isAzureConfigured(): boolean {
  return KEY !== '';
}

function headers() {
  return {
    'Ocp-Apim-Subscription-Key': KEY,
    'Ocp-Apim-Subscription-Region': REGION,
    'Content-Type': 'application/json',
  };
}

const MAX_RETRIES = 3;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
// A quota-exhausted 429 can send a Retry-After of minutes or hours — never park
// a worker that long inside a time-limited serverless job.
const MAX_BACKOFF_MS = 10_000;

/**
 * Azure Translator throttles hard under bursty concurrent load — the
 * vocabulary import's bulk-translate job can fire dozens of lookups at
 * once, so a 429/5xx here is usually transient rather than a real failure.
 * Retries with backoff (honoring Retry-After when Azure sends one) before
 * giving up, instead of permanently skipping the word for this run.
 */
async function fetchWithRetry(url: string, init: RequestInit, attempt = 0): Promise<Response> {
  const res = await fetch(url, init);
  if (res.ok || !RETRYABLE_STATUSES.has(res.status) || attempt >= MAX_RETRIES) {
    return res;
  }

  const retryAfterSeconds = Number(res.headers.get('Retry-After'));
  const requestedMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
    ? retryAfterSeconds * 1000
    : 500 * 2 ** attempt; // 500ms, 1000ms, 2000ms
  // Random jitter so parallel workers that were throttled together don't all retry in the same instant.
  const backoffMs = Math.min(requestedMs, MAX_BACKOFF_MS) + Math.random() * 500;

  console.warn(`[Azure] ${res.status} from ${new URL(url).pathname} — retry ${attempt + 1}/${MAX_RETRIES} in ${Math.round(backoffMs)}ms`);
  await new Promise((resolve) => setTimeout(resolve, backoffMs));
  return fetchWithRetry(url, init, attempt + 1);
}

type AzureDictLookupEntry = {
  normalizedTarget: string;
  displayTarget: string;
  posTag: string;
  confidence: number;
  prefixWord: string;
};

type AzureDictLookupResponse = {
  normalizedSource: string;
  displaySource: string;
  translations: AzureDictLookupEntry[];
}[];

// Groups raw Azure entries into the TranslationMeaning shape used in word_translations.meanings
function groupByPOS(entries: AzureDictLookupEntry[]): TranslationMeaning[] {
  const map = new Map<string, { definitions: string[]; totalConfidence: number; count: number }>();
  for (const e of entries) {
    const existing = map.get(e.posTag);
    if (existing) {
      if (!existing.definitions.includes(e.displayTarget)) {
        existing.definitions.push(e.displayTarget);
      }
      existing.totalConfidence += e.confidence;
      existing.count += 1;
    } else {
      map.set(e.posTag, { definitions: [e.displayTarget], totalConfidence: e.confidence, count: 1 });
    }
  }
  return Array.from(map.entries())
    .map(([pos, { definitions, totalConfidence, count }]) => ({
      pos,
      definitions,
      confidence: Math.round((totalConfidence / count) * 100) / 100,
    }))
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Calls Azure Translator Dictionary Lookup.
 * Returns grouped meanings (POS → definitions[]) or null if the language pair is unsupported.
 */
export async function dictionaryLookup(
  lemma: string,
  fromLang: string,
  toLang: string
): Promise<{ primaryTranslation: string; meanings: TranslationMeaning[] } | null> {
  if (!KEY) return null;

  const url = `${ENDPOINT}/dictionary/lookup?api-version=3.0&from=${fromLang}&to=${toLang}`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify([{ Text: lemma }]),
  });

  if (res.status === 400) {
    // 400 means the language pair is not supported by dictionary lookup — caller should fall back
    return null;
  }
  if (!res.ok) {
    throw new Error(`Azure Dictionary Lookup failed: ${res.status} ${await res.text()}`);
  }

  const data: AzureDictLookupResponse = await res.json();
  const entries = data[0]?.translations ?? [];
  if (entries.length === 0) return null;

  const meanings = groupByPOS(entries);
  const primaryTranslation = entries.sort((a, b) => b.confidence - a.confidence)[0].displayTarget;

  return { primaryTranslation, meanings };
}

/**
 * Calls Azure Translator Dictionary Examples for one (source, target) word pair.
 * Returns the first example sentence or null.
 */
export async function dictionaryExamples(
  lemma: string,
  targetWord: string,
  fromLang: string,
  toLang: string
): Promise<{ source: string; target: string } | null> {
  if (!KEY) return null;

  const url = `${ENDPOINT}/dictionary/examples?api-version=3.0&from=${fromLang}&to=${toLang}`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify([{ Text: lemma, Translation: targetWord }]),
  });

  if (!res.ok) {
    // Examples are a nice-to-have — a failure here shouldn't discard the translation we already have.
    console.warn(`[Azure] Dictionary Examples failed for "${lemma}": ${res.status}`);
    return null;
  }

  type AzureExamplesResponse = { examples: { sourcePrefix: string; sourceTerm: string; sourceSuffix: string; targetPrefix: string; targetTerm: string; targetSuffix: string }[] }[];
  const data: AzureExamplesResponse = await res.json();
  const ex = data[0]?.examples?.[0];
  if (!ex) return null;

  return {
    source: `${ex.sourcePrefix}${ex.sourceTerm}${ex.sourceSuffix}`.trim(),
    target: `${ex.targetPrefix}${ex.targetTerm}${ex.targetSuffix}`.trim(),
  };
}

/**
 * Calls Azure general Translate endpoint — fallback when Dictionary Lookup returns null
 * (unsupported language pair for dictionary mode).
 */
export async function translateWord(
  lemma: string,
  fromLang: string,
  toLang: string
): Promise<string | null> {
  if (!KEY) return null;

  const url = `${ENDPOINT}/translate?api-version=3.0&from=${fromLang}&to=${toLang}`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify([{ Text: lemma }]),
  });

  // 400 = unsupported language pair (a definitive "can't translate"); anything
  // else is a transient/quota failure. Throw so the caller records nothing and
  // the word is retried later, instead of being cached as "no translation".
  if (res.status === 400) return null;
  if (!res.ok) {
    throw new Error(`Azure Translate failed: ${res.status} ${await res.text()}`);
  }

  type AzureTranslateResponse = { translations: { text: string; to: string }[] }[];
  const data: AzureTranslateResponse = await res.json();
  return data[0]?.translations?.[0]?.text ?? null;
}
