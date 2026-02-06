// ============================================================================
// EmptyStateIllustration Component
// SVG illustrations with Risograph aesthetic for empty states
// Uses Library Green (#183A37) with grain texture and misregistration
// ============================================================================

interface EmptyStateIllustrationProps {
  type: 'books' | 'pages' | 'vocabulary';
}

export function EmptyStateIllustration({ type }: EmptyStateIllustrationProps) {
  const illustrations = {
    books: <BooksIllustration />,
    pages: <PagesIllustration />,
    vocabulary: <VocabularyIllustration />,
  };

  return (
    <div
      className="relative w-32 h-32"
      style={{ filter: 'contrast(0.95) brightness(1.02)' }}
      aria-hidden="true"
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
