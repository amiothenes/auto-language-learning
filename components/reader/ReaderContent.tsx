'use client';

import { Word, WordData, VocabularyStatus } from './Word';
import { useReaderSettings } from '@/lib/contexts/ReaderSettingsContext';
import { cn } from '@/lib/utils';

// ============================================================================
// ReaderContent Component
// Parses text into words and renders interactive Word components
// ============================================================================

interface ReaderContentProps {
  content: string;
  onWordClick: (data: WordData, anchorRect: DOMRect) => void;
  selectedWordId?: string | null;
}

export function ReaderContent({ content, onWordClick, selectedWordId }: ReaderContentProps) {
  // Get reader settings from context
  const { settings } = useReaderSettings();
  
  /**
   * Generate deterministic hash from string for consistent status assignment
   * This ensures server and client render the same status
   */
  const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  /**
   * Generate deterministic vocabulary status based on word text
   * Weighted distribution:
   * - 25% NEWLY_SEEN
   * - 30% FAMILIAR
   * - 25% KNOWN
   * - 15% WELL_KNOWN
   * - 5% IGNORE
   */
  const getDeterministicStatus = (word: string): VocabularyStatus => {
    const hash = hashString(word);
    const normalized = (hash % 100) / 100; // Normalize to 0-1
    
    if (normalized < 0.25) return VocabularyStatus.NEWLY_SEEN;
    if (normalized < 0.55) return VocabularyStatus.FAMILIAR;
    if (normalized < 0.80) return VocabularyStatus.KNOWN;
    if (normalized < 0.95) return VocabularyStatus.WELL_KNOWN;
    return VocabularyStatus.IGNORE;
  };

  /**
   * Generate mock lemma from surface form (simplified)
   * In real app, this would come from NLP processing
   */
  const generateLemma = (surface: string): string => {
    // Remove common Russian verb endings for demo
    const cleanWord = surface.replace(/[.,!?;:«»„"]/g, '');
    if (cleanWord.endsWith('ся')) return cleanWord.slice(0, -2);
    if (cleanWord.endsWith('сь')) return cleanWord.slice(0, -2);
    if (cleanWord.endsWith('ть')) return cleanWord;
    return cleanWord;
  };

  /**
   * Generate mock translation (placeholder)
   */
  const generateTranslation = (surface: string): string => {
    const translations: Record<string, string> = {
      'Правительство': 'government',
      'объявило': 'announced',
      'о': 'about',
      'масштабном': 'large-scale',
      'пакете': 'package',
      'экономических': 'economic',
      'реформ': 'reforms',
      'направленных': 'aimed',
      'на': 'at',
      'стимулирование': 'stimulating',
      'роста': 'growth',
      'Министр': 'minister',
      'финансов': 'finance',
      'подчеркнул': 'emphasized',
      'что': 'that',
      'эти': 'these',
      'меры': 'measures',
      'призваны': 'designed',
      'укрепить': 'strengthen',
      'стабильность': 'stability',
      'экономики': 'economy',
      'и': 'and',
      'улучшить': 'improve',
      'условия': 'conditions',
      'для': 'for',
      'бизнеса': 'business',
    };
    
    const cleanWord = surface.replace(/[.,!?;:«»„"]/g, '');
    return translations[cleanWord] || '—';
  };

  /**
   * Generate deterministic POS tag based on word
   */
  const generatePOS = (word: string): string => {
    const posTags = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Preposition', 'Conjunction'];
    const hash = hashString(word);
    return posTags[hash % posTags.length];
  };

  /**
   * Generate deterministic inflection based on word
   */
  const generateInflection = (word: string): string => {
    const inflections = [
      'Nominative Singular',
      'Genitive Plural',
      'Past Tense',
      'Present Participle',
      'Accusative',
      'Instrumental',
      'Prepositional',
      'Imperative',
    ];
    const hash = hashString(word);
    return inflections[hash % inflections.length];
  };

  /**
   * Parse text into paragraphs and words with WordData
   */
  const parsedContent = content.split('\n\n').filter(p => p.trim()).map((paragraph, paraIndex) => {
    // Split paragraph into tokens (words + punctuation)
    const tokens = paragraph.match(/\S+/g) || [];
    
    const words = tokens.map((token, wordIndex) => {
      const id = `${paraIndex}-${wordIndex}`;
      const cleanToken = token.replace(/[.,!?;:«»„"]/g, '');
      const status = getDeterministicStatus(cleanToken);
      
      // Generate deterministic frequencies based on word hash
      const wordHash = hashString(cleanToken);
      const dictionaryFreq = (wordHash % 100) + 1;
      const userFreq = (wordHash % 50) + 1;
      
      const wordData: WordData = {
        id,
        surface: token,
        lemma: generateLemma(token),
        pos: generatePOS(cleanToken),
        inflection: generateInflection(cleanToken),
        translation: generateTranslation(token),
        dictionaryFrequency: dictionaryFreq,
        userFrequency: userFreq,
        status,
      };
      
      return wordData;
    });
    
    return {
      id: `paragraph-${paraIndex}`,
      words,
    };
  });

  // Map font size setting to CSS class
  const fontSizeClass = {
    small: 'text-content-sm',   // 14px
    medium: 'text-content-base', // 18px (default)
    large: 'text-content-lg',    // 20px
  }[settings.fontSize];

  return (
    <article className={cn(
      "w-full max-w-[45rem] space-y-6 transition-all duration-200",
      fontSizeClass
    )}>
      {parsedContent.map((paragraph) => (
        <p 
          key={paragraph.id}
          className="font-serif text-ink leading-relaxed"
        >
          {paragraph.words.map((wordData, index) => (
            <span key={wordData.id}>
              <Word
                data={wordData}
                onClick={onWordClick}
                isSelected={selectedWordId === wordData.id}
                highlightIntensity={settings.highlightIntensity}
                showWellKnownWords={settings.showWellKnownWords}
              />
              {/* Add space after word unless it's followed by punctuation */}
              {index < paragraph.words.length - 1 && 
               !paragraph.words[index + 1].surface.match(/^[.,!?;:«»„"]/) && 
               ' '}
            </span>
          ))}
        </p>
      ))}
    </article>
  );
}
