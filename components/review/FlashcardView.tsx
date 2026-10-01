'use client';

import { useState } from 'react';
import { ExternalLink, LoaderCircle, Pencil, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Content, Heading } from '@/components/ui/Typography';
import { StatusDots } from '@/components/reader/StatusDots';
import { useWordAudioButton } from '@/lib/hooks/useWordAudioButton';
import { useSentenceAudioButton } from '@/lib/hooks/useSentenceAudioButton';
import { VocabularyStatus } from '@/lib/types/vocabulary';
import type { SrsCard, SrsGrade } from '@/lib/types/api';
import type { TranslationMeaning } from '@/lib/db/schema/wordTranslations';

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
      className="text-muted hover:text-primary transition-colors p-1 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
  onEdit: (wordId: string, data: { translation: string; meanings: TranslationMeaning[] }) => void;
}

export function FlashcardView({
  card,
  sentenceAudioEnabled,
  wordAudioEnabled,
  revealed,
  onReveal,
  onGrade,
  grading,
  onEdit,
}: FlashcardViewProps) {
  const wordAudio = useWordAudioButton(card.wordId);
  const sentenceAudio = useSentenceAudioButton(card.sentence?.sentenceId);

  // Reset when the FlashcardView remounts for a new card (it's keyed by wordId
  // in app/review/page.tsx), so no sync effect is needed.
  const [isEditing, setIsEditing] = useState(false);
  const [editTranslation, setEditTranslation] = useState(card.translation ?? '');
  const [editMeanings, setEditMeanings] = useState<string[]>(
    () => (card.meanings ?? []).map((m) => m.definitions.join(', '))
  );

  function handleEditSave() {
    const updatedMeanings: TranslationMeaning[] = (card.meanings ?? []).map((m, i) => ({
      ...m,
      definitions: (editMeanings[i] ?? '').split(',').map((d) => d.trim()).filter(Boolean),
    }));
    onEdit(card.wordId, { translation: editTranslation, meanings: updatedMeanings });
    setIsEditing(false);
  }

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
          <p className="hidden lg:flex items-center justify-center gap-1.5 font-sans text-ui-xs text-muted">
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

          {isEditing ? (
            <Input
              type="text"
              value={editTranslation}
              onChange={(e) => setEditTranslation(e.target.value)}
              placeholder="Add translation…"
              autoFocus
            />
          ) : (
            <div className="flex items-start gap-2">
              {card.translation ? (
                <Content size="lg" className="flex-1">{card.translation}</Content>
              ) : (
                <Content size="lg" className="flex-1 text-muted">No translation</Content>
              )}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                aria-label="Edit translation and meanings"
                className="text-muted hover:text-primary transition-colors p-1 shrink-0 cursor-pointer"
              >
                <Pencil size={14} strokeWidth={1.5} />
              </button>
            </div>
          )}

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
              {card.meanings.map((m, i) =>
                isEditing ? (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="font-sans text-[9.5px] text-muted bg-desk border border-border rounded-sm px-1.5 py-0.5 shrink-0 uppercase tracking-wide">
                      {m.pos}
                    </span>
                    <Input
                      type="text"
                      value={editMeanings[i] ?? ''}
                      onChange={(e) =>
                        setEditMeanings((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
                      }
                      className="text-sm"
                    />
                  </div>
                ) : (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="font-sans text-[9.5px] text-muted bg-desk border border-border rounded-sm px-1.5 py-0.5 shrink-0 uppercase tracking-wide mt-0.5">
                      {m.pos}
                    </span>
                    <span className="font-sans text-sm text-ink/80 leading-snug">{m.definitions.slice(0, 3).join(', ')}</span>
                  </div>
                )
              )}
            </div>
          )}

          {isEditing && (
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleEditSave}>
                Save
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
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
            <div className="hidden lg:flex gap-3 text-center">
              <p className="flex-1 flex items-center justify-center gap-1.5 font-sans text-ui-xs text-muted">
                <Kbd>1</Kbd> → {STATUS_LABELS[card.preview.didntKnow.status]} · {card.preview.didntKnow.intervalDays}d
              </p>
              <p className="flex-1 flex items-center justify-center gap-1.5 font-sans text-ui-xs text-muted">
                <Kbd>2</Kbd> or <Kbd>Space</Kbd> → {STATUS_LABELS[card.preview.knew.status]} · {card.preview.knew.intervalDays}d
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
