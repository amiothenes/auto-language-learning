'use client';

import { ExternalLink, LoaderCircle, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Content, Heading } from '@/components/ui/Typography';
import { StatusDots } from '@/components/reader/StatusDots';
import { useWordAudioButton } from '@/lib/hooks/useWordAudioButton';
import { useSentenceAudioButton } from '@/lib/hooks/useSentenceAudioButton';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { SrsCard, SrsGrade } from '@/lib/types/api';

const MORPH_DISPLAY_KEYS = ['tense', 'mood', 'person', 'number', 'gender', 'case', 'voice', 'aspect'] as const;
const MORPH_LABELS: Record<string, string> = {
  tense: 'Tense', mood: 'Mood', person: 'Person', number: 'Number',
  gender: 'Gender', case: 'Case', voice: 'Voice', aspect: 'Aspect',
};

const STATUS_LABELS: Record<VocabularyStatus, string> = {
  [VocabularyStatus.UNKNOWN]: 'Unknown',
  [VocabularyStatus.NEWLY_SEEN]: 'Newly Seen',
  [VocabularyStatus.FAMILIAR]: 'Familiar',
  [VocabularyStatus.KNOWN]: 'Known',
  [VocabularyStatus.WELL_KNOWN]: 'Well Known',
  [VocabularyStatus.IGNORE]: 'Ignore',
};

function boldTarget(content: string, targetSurface: string) {
  const idx = content.toLowerCase().indexOf(targetSurface.toLowerCase());
  if (idx === -1) return content;
  return (
    <>
      {content.slice(0, idx)}
      <strong className="font-bold text-primary">{content.slice(idx, idx + targetSurface.length)}</strong>
      {content.slice(idx + targetSurface.length)}
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.375rem] h-5 px-1 rounded border border-border bg-desk font-mono text-[10px] text-muted">
      {children}
    </kbd>
  );
}

function SpeakerButton({ state, onPlay, label }: { state: string; onPlay: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      disabled={state === 'loading'}
      className="text-muted hover:text-primary transition-colors p-1 shrink-0 disabled:opacity-50"
      aria-label={label}
    >
      {state === 'loading' ? (
        <LoaderCircle size={18} strokeWidth={1.5} className="animate-spin" />
      ) : state === 'error' ? (
        <VolumeX size={18} strokeWidth={1.5} />
      ) : (
        <Volume2 size={18} strokeWidth={1.5} />
      )}
    </button>
  );
}

interface FlashcardViewProps {
  card: SrsCard;
  sentenceAudioEnabled: boolean;
  wordAudioEnabled: boolean;
  revealed: boolean;
  onReveal: () => void;
  onGrade: (grade: SrsGrade) => void;
  grading: boolean;
}

export function FlashcardView({
  card,
  sentenceAudioEnabled,
  wordAudioEnabled,
  revealed,
  onReveal,
  onGrade,
  grading,
}: FlashcardViewProps) {
  const wordAudio = useWordAudioButton(card.wordId);
  const sentenceAudio = useSentenceAudioButton(card.sentence?.sentenceId);

  const morphData = card.inflectionData;
  const hasMorphology = morphData != null && MORPH_DISPLAY_KEYS.some((k) => Boolean(morphData[k]));

  return (
    <Card padding="lg" className="space-y-6">
      {/* ── Front ── */}
      <div className="space-y-3">
        {card.cardType === 'SENTENCE' && card.sentence ? (
          <div className="flex items-start gap-2">
            <Content size="xl" className="leading-relaxed flex-1">
              {boldTarget(card.sentence.content, card.sentence.targetSurface)}
            </Content>
            {sentenceAudioEnabled && (
              <SpeakerButton state={sentenceAudio.state} onPlay={sentenceAudio.play} label="Play sentence audio" />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Heading size="2xl" as="h2" className="font-serif">
              {card.lemma}
            </Heading>
            <StatusDots status={card.status} />
            {wordAudioEnabled && (
              <SpeakerButton state={wordAudio.state} onPlay={wordAudio.play} label={`Hear pronunciation of ${card.lemma}`} />
            )}
          </div>
        )}
      </div>

      {!revealed ? (
        <div className="space-y-2">
          <Button variant="primary" className="w-full" onClick={onReveal}>
            Show Answer
          </Button>
          <p className="flex items-center justify-center gap-1.5 font-sans text-ui-xs text-muted">
            Press <Kbd>Space</Kbd> to reveal
          </p>
        </div>
      ) : (
        <div className="space-y-4 border-t border-border pt-4">
          {/* Root word + status + audio */}
          <div className="flex items-center gap-2">
            <Heading size="xl" as="h3" className="font-serif">
              {card.lemma}
            </Heading>
            <StatusDots status={card.status} />
            {wordAudioEnabled && (
              <SpeakerButton state={wordAudio.state} onPlay={wordAudio.play} label={`Hear pronunciation of ${card.lemma}`} />
            )}
          </div>

          {card.translation && <Content size="lg">{card.translation}</Content>}

          {/* POS / grammar */}
          {(card.pos || hasMorphology) && (
            <div className="flex flex-wrap gap-1.5">
              {card.pos && (
                <span className="bg-desk border border-border rounded-sm px-2.5 py-1.5 font-sans text-[10.5px] text-ink font-semibold uppercase tracking-wide">
                  {card.pos}
                </span>
              )}
              {morphData &&
                MORPH_DISPLAY_KEYS.filter((k) => morphData[k]).map((k) => (
                  <span key={k} className="bg-desk border border-border rounded-sm px-2.5 py-1.5 flex items-center gap-1">
                    <span className="font-sans text-[10px] text-muted">{MORPH_LABELS[k]}:</span>
                    <span className="font-sans text-[10.5px] text-ink font-semibold">{String(morphData[k])}</span>
                  </span>
                ))}
            </div>
          )}

          {/* Meanings */}
          {card.meanings && card.meanings.length > 0 && (
            <div className="space-y-1.5">
              {card.meanings.map((m, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="font-sans text-[9.5px] text-muted bg-desk border border-border rounded-sm px-1.5 py-0.5 shrink-0 uppercase tracking-wide mt-0.5">
                    {m.pos}
                  </span>
                  <span className="font-sans text-sm text-ink/80 leading-snug">{m.definitions.slice(0, 3).join(', ')}</span>
                </div>
              ))}
            </div>
          )}

          {/* WORD-type cards also show the sentence on the back */}
          {card.cardType === 'WORD' && card.sentence && (
            <div className="flex items-start gap-2 border-t border-border pt-3">
              <Content size="base" className="italic leading-relaxed flex-1">
                {boldTarget(card.sentence.content, card.sentence.targetSurface)}
              </Content>
              {sentenceAudioEnabled && (
                <SpeakerButton state={sentenceAudio.state} onPlay={sentenceAudio.play} label="Play sentence audio" />
              )}
            </div>
          )}

          {/* Source link — always shown */}
          {card.source && (
            <Link
              href={`/reader/${card.source.textId}`}
              className="inline-flex items-center gap-1 font-sans text-ui-xs text-primary hover:text-primary/80 transition-colors"
            >
              {card.source.seriesName ? `${card.source.seriesName} — ${card.source.textTitle}` : card.source.textTitle}
              <ExternalLink size={10} />
            </Link>
          )}

          {/* Grading */}
          <div className="space-y-2 pt-2">
            <div className="flex gap-3">
              <Button
                variant="primary"
                className="flex-1 !bg-danger"
                disabled={grading}
                onClick={() => onGrade('DIDNT_KNOW')}
              >
                Didn&apos;t Know
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={grading}
                onClick={() => onGrade('KNEW')}
              >
                Did Know
              </Button>
            </div>
            <div className="flex gap-3 text-center">
              <p className="flex-1 flex items-center justify-center gap-1.5 font-sans text-ui-xs text-muted">
                <Kbd>1</Kbd> → {STATUS_LABELS[card.preview.didntKnow.status]} · {card.preview.didntKnow.intervalDays}d
              </p>
              <p className="flex-1 flex items-center justify-center gap-1.5 font-sans text-ui-xs text-muted">
                <Kbd>2</Kbd> → {STATUS_LABELS[card.preview.knew.status]} · {card.preview.knew.intervalDays}d
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
