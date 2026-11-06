'use client';

import type { ReactNode } from 'react';
import esStory from '@/content/es/story.generated.json';
import { DoorScene, ShelvesScene, LanternScene, LibraryMapScene, KeyScene } from '@/components/riso/scenes/Scenes';

/**
 * Riso header for chapters of the starter story (La Biblioteca del Olvido):
 * the chapter's scene, its number and level, and its English title. Shown
 * only when the open text is one of the story's chapters (matched by series
 * name and chapter title, with " (Part n)" suffixes ignored).
 *
 * Imports only the story file (~19KB), not the onboarding registry with its
 * word pools.
 */

const STORIES: Record<string, { libraryName: string; chapters: typeof esStory.chapters }> = {
  es: { libraryName: 'La Biblioteca del Olvido', chapters: esStory.chapters },
};

/** Chapter scene keys (content/<lang>/story/*.md frontmatter) → riso scene. */
const SCENES: Record<string, ReactNode> = {
  door: <DoorScene />,
  'sleeping-words': <ShelvesScene lit={0.08} />,
  keeper: <LanternScene />,
  'first-room': <ShelvesScene lit={0.55} />,
  'map-room': <LibraryMapScene litRooms={2} currentRoom={2} />,
  storm: <ShelvesScene lit={0.2} />,
  'unfinished-book': <ShelvesScene lit={0.75} />,
  'keeper-story': <LanternScene />,
  'ancient-tongue': <LibraryMapScene litRooms={4} currentRoom={4} />,
  key: <KeyScene />,
};

export function StoryChapterHeader({
  title,
  seriesName,
  languageCode,
}: {
  title: string;
  seriesName: string | null | undefined;
  languageCode: string | undefined;
}) {
  const story = languageCode ? STORIES[languageCode] : undefined;
  if (!story || seriesName !== story.libraryName) return null;

  const base = title.replace(/ \(Part \d+\)$/, '');
  const chapter = story.chapters.find((c) => c.title === base);
  if (!chapter) return null;

  return (
    <header className="w-full max-w-prose mb-6 rounded-card overflow-hidden border border-border bg-paper shadow-raised">
      <div className="bg-desk border-b border-border [&_svg]:max-h-44 md:[&_svg]:max-h-52 flex justify-center">
        {SCENES[chapter.scene] ?? <DoorScene />}
      </div>
      <div className="px-4 py-3 md:px-5 flex items-baseline justify-between gap-3">
        <p className="font-sans text-ui-xs uppercase tracking-wide text-riso-coral font-semibold">
          Chapter {chapter.order} · {chapter.level}
        </p>
        <p className="font-sans text-ui-sm text-muted italic truncate">{chapter.titleEn}</p>
      </div>
    </header>
  );
}
