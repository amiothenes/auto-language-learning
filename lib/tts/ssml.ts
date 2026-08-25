import { rateToSsmlPercent } from './rate';

const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

/**
 * XML-escapes while recording, for every character of the escaped output,
 * which character of the original it came from. Azure reports WordBoundary
 * offsets as indices into the SSML string it was given, so recovering a
 * plain-text offset means undoing both the SSML prefix and any escaping
 * that shifted characters along the way (a single `&` becomes 5 chars).
 */
function escapeXmlWithMap(text: string): { escaped: string; escapedToPlain: number[] } {
  let escaped = '';
  const escapedToPlain: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const entity = XML_ENTITIES[text[i]];
    if (entity) {
      for (let k = 0; k < entity.length; k++) escapedToPlain.push(i);
      escaped += entity;
    } else {
      escapedToPlain.push(i);
      escaped += text[i];
    }
  }
  return { escaped, escapedToPlain };
}

export interface BuiltSsml {
  ssml: string;
  /** Index in `ssml` where the spoken text begins — i.e. the length of the
   * `<speak><voice><prosody>` prefix that Azure's textOffset also counts. */
  textStart: number;
  /** escapedToPlain[i] = index in the ORIGINAL text for escaped-text index i. */
  escapedToPlain: number[];
  plainLength: number;
}

export function buildSsml({
  text,
  voiceId,
  langCode,
  rate,
}: {
  text: string;
  voiceId: string;
  langCode: string;
  rate: number;
}): BuiltSsml {
  const prefix = `<speak version="1.0" xml:lang="${langCode}"><voice name="${voiceId}"><prosody rate="${rateToSsmlPercent(rate)}">`;
  const { escaped, escapedToPlain } = escapeXmlWithMap(text);
  return {
    ssml: `${prefix}${escaped}</prosody></voice></speak>`,
    textStart: prefix.length,
    escapedToPlain,
    plainLength: text.length,
  };
}

/**
 * Converts an Azure WordBoundary offset/length pair (indices into the SSML
 * string) into a `[start, end)` range in the ORIGINAL plain text. Clamps
 * rather than throwing — a mark landing outside the spoken text (Azure
 * occasionally reports one for SSML-internal content) collapses to an empty
 * range at the boundary, which simply intersects nothing downstream.
 */
export function ssmlOffsetToPlainRange(
  built: BuiltSsml,
  textOffset: number,
  wordLength: number
): { start: number; end: number } {
  const { textStart, escapedToPlain, plainLength } = built;
  const escapedStart = textOffset - textStart;
  if (escapedStart < 0 || escapedStart >= escapedToPlain.length || wordLength <= 0) {
    return { start: 0, end: 0 };
  }
  const start = escapedToPlain[escapedStart];
  const lastEscaped = Math.min(escapedStart + wordLength - 1, escapedToPlain.length - 1);
  const end = Math.min(escapedToPlain[lastEscaped] + 1, plainLength);
  return { start, end: Math.max(end, start) };
}
