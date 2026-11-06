/**
 * Today's ONE next step. The Today page shows a single action instead of a
 * dashboard of options, so it's always obvious what to do. Priority:
 *   1. finish the guided first read, but only while the learner hasn't moved
 *      on to their own texts (and they can skip it from the card)
 *   2. review: words are due (new cards included), and visiting them keeps
 *      them from falling asleep
 *   3. continue the text you were reading
 *   4. next text: the story's next chapter, or the next unopened text in your
 *      own library, whichever you actually read (most recently opened wins)
 *   5. bring your own text
 *
 * Works the same for a brand-new learner (story-driven), a seasoned user with
 * only their own texts, and someone who deleted or ignores the starter story.
 */

export type NextStepKind = 'guided' | 'review' | 'continue' | 'chapter' | 'library' | 'import';

export interface NextStep {
  kind: NextStepKind;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  /** Null for 'import', which opens the new-text modal instead of navigating. */
  href: string | null;
  /** Optional quiet secondary action ("Skip the tour"). */
  secondary?: { label: string; action: 'skip-guided' };
}

type TextRef = { id: string; title: string; knownPercentage: number };

export interface NextStepInput {
  guidedDone: boolean;
  dueCount: number;
  continueText: TextRef | null;
  story: { startTextId: string | null; nextChapter: { id: string; title: string } | null } | null;
  libraryNext?: TextRef | null;
  prefersOwnTexts?: boolean;
  hasReadOwnTexts?: boolean;
}

export interface LibraryText {
  id: string;
  title: string;
  seriesId: string | null;
  /** Position within the series (the serial). */
  order: number;
  createdAt: Date;
  viewCount: number;
  lastViewedAt: Date | null;
  knownPercentage: number;
}

/**
 * "Next in your library": the next unopened text of the learner's OWN texts.
 *  1. In the series they read most recently: the unopened text created
 *     earliest, with ties (bulk imports share a timestamp) broken by serial order.
 *  2. Otherwise: their easiest unopened text, the highest % known.
 * Pass only the learner's own texts (exclude the starter story).
 */
export function pickLibraryNext(ownTexts: LibraryText[]): TextRef | null {
  const unopened = ownTexts.filter((t) => t.viewCount === 0);
  if (unopened.length === 0) return null;

  const lastRead = ownTexts
    .filter((t) => t.lastViewedAt)
    .sort((a, b) => b.lastViewedAt!.getTime() - a.lastViewedAt!.getTime())[0];

  const inSeries = lastRead?.seriesId
    ? unopened
        .filter((t) => t.seriesId === lastRead.seriesId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.order - b.order)[0]
    : undefined;

  const pick = inSeries ?? [...unopened].sort((a, b) => b.knownPercentage - a.knownPercentage)[0];
  return { id: pick.id, title: pick.title, knownPercentage: pick.knownPercentage };
}

export function pickNextStep({
  guidedDone,
  dueCount,
  continueText,
  story,
  libraryNext = null,
  prefersOwnTexts = false,
  hasReadOwnTexts = false,
}: NextStepInput): NextStep {
  // Someone already reading their own texts has clearly found their way, so
  // don't keep pinning the tour on them.
  if (!guidedDone && story?.startTextId && !hasReadOwnTexts) {
    return {
      kind: 'guided',
      eyebrow: 'Start here',
      title: 'Read your first page',
      body: 'A two-minute guided read: tap a word, mark it, hear it, and watch your Fluency move.',
      cta: 'Open the first page',
      href: `/reader/${story.startTextId}?guide=1`,
      secondary: { label: 'Skip the tour', action: 'skip-guided' },
    };
  }
  if (dueCount > 0) {
    return {
      kind: 'review',
      eyebrow: 'Keep the lamps lit',
      title: `${dueCount} ${dueCount === 1 ? 'word is' : 'words are'} waiting for you`,
      body: 'A short review brings words back just before you’d forget them, which is the cheapest way to keep your Fluency.',
      cta: 'Start review',
      href: '/review',
    };
  }
  if (continueText) {
    return {
      kind: 'continue',
      eyebrow: 'Pick up where you left off',
      title: continueText.title,
      body: `You know ${Math.round(continueText.knownPercentage)}% of this text. Every tap moves it closer to green.`,
      cta: 'Continue reading',
      href: `/reader/${continueText.id}`,
    };
  }

  const chapter: NextStep | null = story?.nextChapter
    ? {
        kind: 'chapter',
        eyebrow: 'The story continues',
        title: story.nextChapter.title,
        body: 'The next chapter of the boy’s story, waiting on the shelf.',
        cta: 'Read the next chapter',
        href: `/reader/${story.nextChapter.id}`,
      }
    : null;
  const library: NextStep | null = libraryNext
    ? {
        kind: 'library',
        eyebrow: 'Next in your library',
        title: libraryNext.title,
        body:
          libraryNext.knownPercentage > 0
            ? `You already know ${Math.round(libraryNext.knownPercentage)}% of it, so it's a good next read.`
            : 'Unopened and waiting on your shelf.',
        cta: 'Start reading',
        href: `/reader/${libraryNext.id}`,
      }
    : null;
  const next = prefersOwnTexts ? (library ?? chapter) : (chapter ?? library);
  if (next) return next;

  return {
    kind: 'import',
    eyebrow: 'Add to your library',
    title: 'Bring a text you love',
    body: 'Paste an article, a song or a page of a novel. Verbista colours every word by how well you know it.',
    cta: 'Add a text',
    href: null,
  };
}
