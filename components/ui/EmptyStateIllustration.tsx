export type IllustrationType =
  | 'books' | 'pages' | 'vocabulary' | 'search' | 'quill' | 'compass'
  | 'leaf' | 'sprout' | 'stones' | 'lantern' | 'mountain' | 'laurel'
  | 'hourglass' | 'globe' | 'telescope' | 'bookmark' | 'bell' | 'cloudoff';

const illustrationDescriptions: Record<IllustrationType, string> = {
  books: 'Illustration of stacked books',
  pages: 'Illustration of paper documents',
  vocabulary: 'Illustration of an open vocabulary book',
  search: 'Illustration of a magnifying glass over a document',
  quill: 'Illustration of a quill pen and ink bottle',
  compass: 'Illustration of a navigation compass',
  leaf: 'Illustration of a leaf',
  sprout: 'Illustration of a plant sprout',
  stones: 'Illustration of stacked stones',
  lantern: 'Illustration of a lantern',
  mountain: 'Illustration of a mountain',
  laurel: 'Illustration of a laurel wreath',
  hourglass: 'Illustration of an hourglass',
  globe: 'Illustration of a globe',
  telescope: 'Illustration of a telescope',
  bookmark: 'Illustration of a bookmark',
  bell: 'Illustration of a bell',
  cloudoff: 'Illustration of a disconnected cloud',
};

export function EmptyStateIllustration({
  type,
  size = 128,
}: {
  type: IllustrationType;
  size?: number;
}) {
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label={illustrationDescriptions[type]}
    >
      <img
        src={`/illustrations/${type}.svg`}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    </div>
  );
}
