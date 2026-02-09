// ============================================================================
// EmptyStateIllustration Component
// SVG illustrations with Risograph aesthetic for empty states
// Uses Library Green (#183A37) with grain texture and misregistration
// ============================================================================

interface EmptyStateIllustrationProps {
  type: 'books' | 'pages' | 'vocabulary' | 'search' | 'quill' | 'compass';
}

// Accessible descriptions for each illustration type
const illustrationDescriptions = {
  books: 'Illustration of stacked books',
  pages: 'Illustration of paper documents',
  vocabulary: 'Illustration of an open vocabulary book',
  search: 'Illustration of a magnifying glass over a document',
  quill: 'Illustration of a quill pen and ink bottle',
  compass: 'Illustration of a navigation compass',
};

export function EmptyStateIllustration({ type }: EmptyStateIllustrationProps) {
  const illustrations = {
    books: <BooksIllustration />,
    pages: <PagesIllustration />,
    vocabulary: <VocabularyIllustration />,
    search: <SearchIllustration />,
    quill: <QuillIllustration />,
    compass: <CompassIllustration />,
  };

  return (
    <div
      className="relative w-32 h-32"
      style={{ filter: 'contrast(0.95) brightness(1.02)' }}
      role="img"
      aria-label={illustrationDescriptions[type]}
    >
      {illustrations[type]}
    </div>
  );
}

// ============================================================================
// Stack of books illustration
// ============================================================================

function BooksIllustration() {
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back book (slightly offset for misregistration) */}
      <rect
        x="22"
        y="45"
        width="60"
        height="70"
        fill="#183A37"
        opacity="0.2"
        rx="2"
        transform="rotate(-8 52 80)"
      />

      {/* Middle book */}
      <rect
        x="25"
        y="40"
        width="60"
        height="70"
        fill="#183A37"
        opacity="0.4"
        rx="2"
        transform="rotate(-3 55 75)"
      />

      {/* Front book */}
      <rect x="30" y="35" width="60" height="70" fill="#183A37" rx="2" />
      <rect x="33" y="38" width="54" height="3" fill="#E5E2DA" />
      <rect x="33" y="45" width="54" height="2" fill="#E5E2DA" opacity="0.5" />

      {/* Grain texture overlay */}
      <rect x="30" y="35" width="60" height="70" fill="url(#grain-books)" opacity="0.05" rx="2" />

      <defs>
        <pattern id="grain-books" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="1" height="1" fill="#141413" opacity="0.03" />
        </pattern>
      </defs>
    </svg>
  );
}

// ============================================================================
// Pages/documents illustration
// ============================================================================

function PagesIllustration() {
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back page (misregistered) */}
      <rect
        x="32"
        y="27"
        width="70"
        height="85"
        fill="#183A37"
        opacity="0.15"
        rx="3"
        transform="rotate(3 67 69.5)"
      />

      {/* Middle page */}
      <rect
        x="30"
        y="25"
        width="70"
        height="85"
        fill="#183A37"
        opacity="0.3"
        rx="3"
        transform="rotate(1 65 67.5)"
      />

      {/* Front page */}
      <rect x="28" y="23" width="70" height="85" fill="#FAF9F5" stroke="#183A37" strokeWidth="2" rx="3" />

      {/* Text lines */}
      <line x1="38" y1="35" x2="88" y2="35" stroke="#183A37" strokeWidth="1.5" opacity="0.3" />
      <line x1="38" y1="43" x2="85" y2="43" stroke="#183A37" strokeWidth="1.5" opacity="0.3" />
      <line x1="38" y1="51" x2="88" y2="51" stroke="#183A37" strokeWidth="1.5" opacity="0.3" />
      <line x1="38" y1="59" x2="82" y2="59" stroke="#183A37" strokeWidth="1.5" opacity="0.3" />

      {/* Folded corner */}
      <path d="M88 23 L88 33 L98 33 Z" fill="#E5E2DA" />
      <line x1="88" y1="23" x2="98" y2="33" stroke="#183A37" strokeWidth="1" opacity="0.3" />

      {/* Grain */}
      <rect x="28" y="23" width="70" height="85" fill="url(#grain-pages)" opacity="0.03" rx="3" />

      <defs>
        <pattern id="grain-pages" width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.5" fill="#141413" opacity="0.1" />
        </pattern>
      </defs>
    </svg>
  );
}

// ============================================================================
// Vocabulary/words illustration (open book)
// ============================================================================

function VocabularyIllustration() {
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Open book base */}
      <path
        d="M20 50 L20 100 L64 95 L108 100 L108 50 L64 55 Z"
        fill="#FAF9F5"
        stroke="#183A37"
        strokeWidth="2"
      />

      {/* Center spine shadow */}
      <line x1="64" y1="55" x2="64" y2="95" stroke="#183A37" strokeWidth="2" opacity="0.2" />

      {/* Left page - word examples (misregistered) */}
      <text
        x="28"
        y="65"
        fill="#183A37"
        fontSize="8"
        fontFamily="serif"
        opacity="0.5"
        transform="translate(1, 0.5)"
      >
        abandonar
      </text>
      <text
        x="28"
        y="75"
        fill="#183A37"
        fontSize="8"
        fontFamily="serif"
        opacity="0.5"
        transform="translate(1, 0.5)"
      >
        casa
      </text>
      <text
        x="28"
        y="85"
        fill="#183A37"
        fontSize="8"
        fontFamily="serif"
        opacity="0.5"
        transform="translate(1, 0.5)"
      >
        libro
      </text>

      {/* Right page - translations */}
      <text x="72" y="65" fill="#183A37" fontSize="8" fontFamily="serif" opacity="0.5">
        to abandon
      </text>
      <text x="72" y="75" fill="#183A37" fontSize="8" fontFamily="serif" opacity="0.5">
        house
      </text>
      <text x="72" y="85" fill="#183A37" fontSize="8" fontFamily="serif" opacity="0.5">
        book
      </text>

      {/* Bookmark ribbon */}
      <rect x="60" y="45" width="8" height="30" fill="#183A37" opacity="0.6" />
      <path d="M60 75 L64 70 L68 75" fill="#183A37" opacity="0.6" />

      {/* Grain */}
      <path
        d="M20 50 L20 100 L64 95 L108 100 L108 50 L64 55 Z"
        fill="url(#grain-vocab)"
        opacity="0.04"
      />

      <defs>
        <pattern id="grain-vocab" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="1" height="1" fill="#141413" opacity="0.05" />
        </pattern>
      </defs>
    </svg>
  );
}

// ============================================================================
// Search/magnifying glass illustration
// ============================================================================

function SearchIllustration() {
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Document underneath (misregistered) */}
      <rect
        x="23"
        y="31"
        width="65"
        height="80"
        fill="#FAF9F5"
        stroke="#183A37"
        strokeWidth="2"
        rx="3"
        transform="translate(1, 1)"
        opacity="0.3"
      />

      {/* Document (main) */}
      <rect x="22" y="30" width="65" height="80" fill="#FAF9F5" stroke="#183A37" strokeWidth="2" rx="3" />

      {/* Text lines on document */}
      <line x1="30" y1="42" x2="75" y2="42" stroke="#183A37" strokeWidth="1.5" opacity="0.25" />
      <line x1="30" y1="50" x2="78" y2="50" stroke="#183A37" strokeWidth="1.5" opacity="0.25" />
      <line x1="30" y1="58" x2="72" y2="58" stroke="#183A37" strokeWidth="1.5" opacity="0.25" />
      <line x1="30" y1="66" x2="76" y2="66" stroke="#183A37" strokeWidth="1.5" opacity="0.25" />

      {/* Magnifying glass lens (back layer - misregistered) */}
      <circle cx="67" cy="67" r="26" fill="#183A37" opacity="0.15" transform="translate(2, 2)" />

      {/* Magnifying glass lens (main) */}
      <circle cx="67" cy="67" r="26" fill="none" stroke="#183A37" strokeWidth="3" />
      <circle cx="67" cy="67" r="26" fill="#183A37" opacity="0.08" />

      {/* Inner lens shine effect */}
      <circle cx="62" cy="62" r="8" fill="#FAF9F5" opacity="0.5" />

      {/* Magnifying glass handle */}
      <line x1="85" y1="85" x2="106" y2="106" stroke="#183A37" strokeWidth="10" strokeLinecap="round" />
      <line x1="85" y1="85" x2="106" y2="106" stroke="url(#grain-search)" strokeWidth="10" strokeLinecap="round" opacity="0.15" />

      {/* Document grain */}
      <rect x="22" y="30" width="65" height="80" fill="url(#grain-search)" opacity="0.03" rx="3" />

      <defs>
        <pattern id="grain-search" width="3" height="3" patternUnits="userSpaceOnUse">
          <rect width="1" height="1" fill="#141413" opacity="0.04" />
        </pattern>
      </defs>
    </svg>
  );
}

// ============================================================================
// Quill/writing illustration
// ============================================================================

function QuillIllustration() {
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Desk surface line */}
      <line x1="10" y1="95" x2="118" y2="95" stroke="#E5E2DA" strokeWidth="2" />

      {/* Ink bottle (back layer - misregistered) */}
      <rect x="31" y="62" width="28" height="35" fill="#183A37" opacity="0.2" rx="2" transform="translate(1, 1)" />

      {/* Ink bottle (glass) */}
      <rect x="30" y="61" width="28" height="35" fill="#183A37" opacity="0.15" stroke="#183A37" strokeWidth="2" rx="2" />

      {/* Ink bottle neck */}
      <rect x="38" y="54" width="12" height="7" fill="#183A37" opacity="0.3" stroke="#183A37" strokeWidth="1.5" rx="1" />

      {/* Ink level inside bottle */}
      <rect x="33" y="76" width="22" height="17" fill="#183A37" opacity="0.5" rx="1" />

      {/* Glass shine effect */}
      <rect x="33" y="65" width="3" height="20" fill="#FAF9F5" opacity="0.4" rx="1" />

      {/* Quill feather (back section - misregistered) */}
      <path
        d="M65 25 Q68 35, 70 45 Q72 55, 74 65 L76 75"
        stroke="#183A37"
        strokeWidth="8"
        opacity="0.15"
        fill="none"
        strokeLinecap="round"
        transform="translate(2, 1)"
      />

      {/* Quill feather (main shaft) */}
      <path
        d="M65 25 Q68 35, 70 45 Q72 55, 74 65 L75 82"
        stroke="#183A37"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />

      {/* Quill tip (pointed) */}
      <path d="M74 82 L76 92 L72 92 Z" fill="#183A37" />

      {/* Feather barbs (left side) */}
      <path d="M68 35 L58 38" stroke="#183A37" strokeWidth="1.5" opacity="0.4" />
      <path d="M69 42 L60 45" stroke="#183A37" strokeWidth="1.5" opacity="0.4" />
      <path d="M70 49 L62 52" stroke="#183A37" strokeWidth="1.5" opacity="0.4" />
      <path d="M71 56 L64 59" stroke="#183A37" strokeWidth="1.5" opacity="0.4" />

      {/* Feather barbs (right side) */}
      <path d="M70 35 L80 38" stroke="#183A37" strokeWidth="1.5" opacity="0.4" />
      <path d="M71 42 L81 45" stroke="#183A37" strokeWidth="1.5" opacity="0.4" />
      <path d="M72 49 L82 52" stroke="#183A37" strokeWidth="1.5" opacity="0.4" />
      <path d="M73 56 L83 59" stroke="#183A37" strokeWidth="1.5" opacity="0.4" />

      {/* Ink drop (mid-air) */}
      <ellipse cx="73" cy="88" rx="2.5" ry="3.5" fill="#183A37" opacity="0.7" />
      <ellipse cx="73" cy="86" rx="1.5" ry="2" fill="#183A37" opacity="0.3" />

      {/* Grain texture on feather */}
      <path
        d="M65 25 Q68 35, 70 45 Q72 55, 74 65 L75 82"
        stroke="url(#grain-quill)"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        opacity="0.05"
      />

      <defs>
        <pattern id="grain-quill" width="2" height="2" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.5" fill="#141413" opacity="0.1" />
        </pattern>
      </defs>
    </svg>
  );
}

// ============================================================================
// Compass/navigation illustration
// ============================================================================

function CompassIllustration() {
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer compass circle (back - misregistered) */}
      <circle cx="65" cy="65" r="42" stroke="#183A37" strokeWidth="3" opacity="0.15" transform="translate(1, 1)" />

      {/* Outer compass circle (main) */}
      <circle cx="64" cy="64" r="42" stroke="#183A37" strokeWidth="3" fill="none" />

      {/* Inner circle */}
      <circle cx="64" cy="64" r="35" stroke="#183A37" strokeWidth="1.5" fill="none" opacity="0.3" />

      {/* Degree marks (major - cardinal directions) */}
      <line x1="64" y1="24" x2="64" y2="30" stroke="#183A37" strokeWidth="2" opacity="0.5" />
      <line x1="104" y1="64" x2="98" y2="64" stroke="#183A37" strokeWidth="2" opacity="0.5" />
      <line x1="64" y1="104" x2="64" y2="98" stroke="#183A37" strokeWidth="2" opacity="0.5" />
      <line x1="24" y1="64" x2="30" y2="64" stroke="#183A37" strokeWidth="2" opacity="0.5" />

      {/* Degree marks (minor) */}
      <line x1="86" y1="35" x2="83" y2="38" stroke="#183A37" strokeWidth="1" opacity="0.3" />
      <line x1="93" y1="57" x2="89" y2="57" stroke="#183A37" strokeWidth="1" opacity="0.3" />
      <line x1="86" y1="93" x2="83" y2="90" stroke="#183A37" strokeWidth="1" opacity="0.3" />
      <line x1="42" y1="93" x2="45" y2="90" stroke="#183A37" strokeWidth="1" opacity="0.3" />
      <line x1="35" y1="71" x2="39" y2="71" stroke="#183A37" strokeWidth="1" opacity="0.3" />
      <line x1="42" y1="35" x2="45" y2="38" stroke="#183A37" strokeWidth="1" opacity="0.3" />

      {/* Cardinal direction letters */}
      <text
        x="64"
        y="20"
        fill="#183A37"
        fontSize="10"
        fontFamily="serif"
        fontWeight="600"
        textAnchor="middle"
        opacity="0.6"
      >
        N
      </text>
      <text
        x="108"
        y="68"
        fill="#183A37"
        fontSize="10"
        fontFamily="serif"
        fontWeight="600"
        textAnchor="middle"
        opacity="0.6"
      >
        E
      </text>
      <text
        x="64"
        y="113"
        fill="#183A37"
        fontSize="10"
        fontFamily="serif"
        fontWeight="600"
        textAnchor="middle"
        opacity="0.6"
      >
        S
      </text>
      <text
        x="20"
        y="68"
        fill="#183A37"
        fontSize="10"
        fontFamily="serif"
        fontWeight="600"
        textAnchor="middle"
        opacity="0.6"
      >
        W
      </text>

      {/* Compass needle (pointing north) */}
      <path d="M64 38 L68 64 L64 66 L60 64 Z" fill="#183A37" opacity="0.8" />

      {/* Needle north tip (highlighted) */}
      <path d="M64 38 L66 50 L64 52 L62 50 Z" fill="#183A37" />

      {/* Center pin */}
      <circle cx="64" cy="64" r="4" fill="#183A37" opacity="0.6" />
      <circle cx="64" cy="64" r="2" fill="#FAF9F5" opacity="0.5" />

      {/* Grain texture on compass face */}
      <circle cx="64" cy="64" r="35" fill="url(#grain-compass)" opacity="0.02" />

      {/* Aged brass effect (subtle color variation) */}
      <circle cx="64" cy="64" r="42" stroke="#183A37" strokeWidth="1" opacity="0.05" />

      <defs>
        <pattern id="grain-compass" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="1" height="1" fill="#141413" opacity="0.03" />
        </pattern>
      </defs>
    </svg>
  );
}
