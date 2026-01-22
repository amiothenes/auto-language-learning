'use client';

import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import { Heading, Muted } from '@/components/ui/Typography';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { TextInfo } from '@/components/reader/TextInfo';

// ============================================================================
// Hardcoded Data (Temporary)
// ============================================================================

interface TextData {
  id: string;
  title: string;
  seriesId: string;
  seriesName: string;
  wordCount: number;
  uniqueWordCount: number;
  viewCount: number;
  knownPercentage: number;
  tags: string[];
  content: string;
}

const TEMP_TEXT_DATA: Record<string, TextData> = {
  't1': {
    id: 't1',
    title: 'Breaking: New Economic Reforms Announced',
    seriesId: '1',
    seriesName: 'Russian News Articles',
    wordCount: 2847,
    uniqueWordCount: 892,
    viewCount: 3,
    knownPercentage: 78,
    tags: ['Politics', 'News', 'Economics'],
    content: `Правительство объявило о масштабном пакете экономических реформ, направленных на стимулирование роста. Министр финансов подчеркнул, что эти меры призваны укрепить стабильность экономики и улучшить условия для бизнеса.

Новый план включает снижение налогов для малого и среднего бизнеса, упрощение административных процедур и увеличение инвестиций в инфраструктуру. Эксперты считают, что эти шаги могут значительно повысить конкурентоспособность страны на мировом рынке.

Представители деловых кругов приветствовали инициативу, отметив, что давно ожидали подобных изменений. Однако некоторые аналитики выражают осторожность, указывая на необходимость тщательной проработки деталей реализации.

В течение следующих месяцев правительство планирует провести серию консультаций с заинтересованными сторонами для уточнения параметров реформ. Ожидается, что первые изменения вступят в силу уже в следующем квартале.

Международные наблюдатели отмечают, что такие реформы могут служить примером для других развивающихся экономик. Многие страны внимательно следят за развитием ситуации, чтобы извлечь полезные уроки из этого опыта.`,
  },
  't2': {
    id: 't2',
    title: 'Climate Summit Reaches Historic Agreement',
    seriesId: '1',
    seriesName: 'Russian News Articles',
    wordCount: 1923,
    uniqueWordCount: 645,
    viewCount: 5,
    knownPercentage: 82,
    tags: ['Environment', 'Politics', 'International'],
    content: `Мировые лидеры собрались в Москве для заключения исторического соглашения о климатических действиях и устойчивом развитии. Саммит продолжался пять дней и завершился принятием амбициозной программы действий.

Главы государств договорились о конкретных целях по сокращению выбросов парниковых газов и переходу на возобновляемые источники энергии. Соглашение предусматривает создание международного фонда для поддержки развивающихся стран в их усилиях по борьбе с изменением климата.

Экологические организации назвали это соглашение поворотным моментом в глобальных усилиях по защите окружающей среды. Активисты надеются, что страны выполнят свои обязательства и предпримут необходимые действия для достижения поставленных целей.`,
  },
};

// ============================================================================
// Reader Page Component
// ============================================================================

interface ReaderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ReaderPage({ params }: ReaderPageProps) {
  // Unwrap the params Promise using React.use()
  const { id } = use(params);
  const textData = TEMP_TEXT_DATA[id];

  // State for right panel visibility
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  // If text not found, show 404
  if (!textData) {
    notFound();
  }

  // Split content into paragraphs
  const paragraphs = textData.content.split('\n\n').filter(p => p.trim());

  return (
    <div className="min-h-screen bg-desk">
      {/* Desktop: 3-column grid | Mobile: Stacked layout */}
      <div className={cn(
        "flex flex-col md:grid",
        isRightPanelOpen 
          ? "md:grid-cols-[240px_1fr_320px]" 
          : "md:grid-cols-[240px_1fr]"
      )}>
        {/* ================================================================ */}
        {/* LEFT SIDEBAR - Text Info & Navigation */}
        {/* ================================================================ */}
        <aside className="order-2 md:order-1 md:sticky md:top-0 md:h-screen md:overflow-y-auto bg-paper border-r border-border">
          <TextInfo
            title={textData.title}
            wordCount={textData.wordCount}
            uniqueWordCount={textData.uniqueWordCount}
            viewCount={textData.viewCount}
            knownPercentage={textData.knownPercentage}
            seriesId={textData.seriesId}
            seriesName={textData.seriesName}
            tags={textData.tags}
            onRightPanelToggle={() => setIsRightPanelOpen(!isRightPanelOpen)}
            isRightPanelOpen={isRightPanelOpen}
          />
        </aside>

        {/* ================================================================ */}
        {/* MAIN READER AREA - Centered Content */}
        {/* ================================================================ */}
        <main className="order-1 md:order-2 flex justify-center px-4 py-8 md:px-8 md:py-12">
          <article className="w-full max-w-[720px] space-y-6">
            {/* Reader Content - EB Garamond, 18px, line-height 1.8 */}
            {paragraphs.map((paragraph, index) => (
              <p 
                key={index}
                className="font-serif text-content-base text-ink leading-relaxed"
              >
                {paragraph}
              </p>
            ))}

            {/* Placeholder for future word interaction */}
            <div className="pt-8 border-t border-border">
              <Muted className="text-center text-ui-sm italic">
                Click on words to see translations and mark learning progress
              </Muted>
            </div>
          </article>
        </main>

        {/* ================================================================ */}
        {/* RIGHT PANEL - Word Details (Conditional) */}
        {/* ================================================================ */}
        {isRightPanelOpen && (
          <aside className="order-3 md:sticky md:top-0 md:h-screen md:overflow-y-auto bg-paper border-l border-border">
            <div className="p-6 space-y-6">
              {/* Panel Header */}
              <div className="flex items-center justify-between">
                <Heading size="base" as="h2">
                  Word Details
                </Heading>
                <button
                  onClick={() => setIsRightPanelOpen(false)}
                  className="text-muted hover:text-ink transition-colors"
                  aria-label="Close word details panel"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              {/* Placeholder Content */}
              <div className="space-y-4 pt-4 border-t border-border">
                <Muted className="text-ui-sm text-center italic">
                  Select a word in the text to view its details, translation, and learning status.
                </Muted>
                
                {/* Example Structure (will be populated when word is clicked) */}
                <div className="space-y-3 opacity-40">
                  <div>
                    <Muted className="text-ui-xs mb-1">Surface Form</Muted>
                    <p className="font-serif text-content-lg text-ink">—</p>
                  </div>
                  <div>
                    <Muted className="text-ui-xs mb-1">Lemma (Root)</Muted>
                    <p className="font-serif text-content-base text-ink">—</p>
                  </div>
                  <div>
                    <Muted className="text-ui-xs mb-1">Translation</Muted>
                    <p className="font-sans text-ui-base text-ink">—</p>
                  </div>
                  <div>
                    <Muted className="text-ui-xs mb-1">Status</Muted>
                    <div className="h-8 bg-desk rounded border border-border"></div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
