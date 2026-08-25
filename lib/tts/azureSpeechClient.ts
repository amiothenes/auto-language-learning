import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import type { WordBoundaryMark } from '../db/schema/sentenceAudio';
import { buildSsml, ssmlOffsetToPlainRange } from './ssml';

const TICKS_PER_MS = 10_000; // Azure SDK durations/offsets are in 100ns ticks

export class TtsSynthesisError extends Error {}

export async function synthesizeSpeech({
  text,
  voiceId,
  langCode,
  rate,
}: {
  text: string;
  voiceId: string;
  langCode: string;
  rate: number;
}): Promise<{ audioBuffer: Buffer; marks: WordBoundaryMark[]; durationMs: number }> {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    throw new TtsSynthesisError('Azure Speech is not configured (AZURE_SPEECH_KEY/AZURE_SPEECH_REGION missing)');
  }

  const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
  speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

  // No AudioConfig — result audio comes back as an in-memory buffer via
  // result.audioData rather than being routed to a playback/output device.
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

  const built = buildSsml({ text, voiceId, langCode, rate });

  // Azure reports textOffset as an index into the SSML string it was handed,
  // NOT into the plain text (verified live: the first mark of a sentence came
  // back at offset 90, exactly the length of the <speak><voice><prosody>
  // prefix). Marks are normalized to plain-text offsets here, at the vendor
  // boundary, so nothing downstream — including what gets cached in
  // sentence_audio.marks — ever has to know SSML existed.
  const marks: WordBoundaryMark[] = [];
  synthesizer.wordBoundary = (_sender, event) => {
    const { start, end } = ssmlOffsetToPlainRange(built, event.textOffset, event.wordLength);
    marks.push({
      textOffset: start,
      wordLength: end - start,
      audioOffsetMs: Math.round(event.audioOffset / TICKS_PER_MS),
      durationMs: Math.round(event.duration / TICKS_PER_MS),
      text: event.text,
    });
  };

  let result: sdk.SpeechSynthesisResult;
  try {
    result = await new Promise<sdk.SpeechSynthesisResult>((resolve, reject) => {
      synthesizer.speakSsmlAsync(
        built.ssml,
        (res) => resolve(res),
        (err) => reject(new TtsSynthesisError(err))
      );
    });
  } finally {
    synthesizer.close();
  }

  if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
    throw new TtsSynthesisError(result.errorDetails || `Synthesis failed with reason ${result.reason}`);
  }

  return {
    audioBuffer: Buffer.from(result.audioData),
    marks,
    durationMs: Math.round(result.audioDuration / TICKS_PER_MS),
  };
}
