// Risograph-style open book illustration for auth pages.
// Visual: flat shapes, grain texture, ink-offset misregistration,
// 3-color palette (deep green + paper + warm gold).

export function AuthIllustration() {
  return (
    <svg
      viewBox="0 0 400 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-full max-w-xs"
    >
      <defs>
        <filter id="auth-grain" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blended" />
          <feComposite in="blended" in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="auth-grain-soft" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blended" />
          <feComposite in="blended" in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {/* ── Drop shadow (unrotated, sits under the tilted book) ── */}
      <ellipse cx="204" cy="392" rx="148" ry="13" fill="#183A37" opacity="0.14" />

      {/* ══════════════════════════════════════════
          BOOK GROUP — rotated 8° CW around book center
          All pages, covers, spine, text, highlight inside here.
          Tooltip + particles stay outside so they remain upright.
      ══════════════════════════════════════════ */}
      <g transform="rotate(8, 200, 248)">

        {/* Gold misregistration ink offset — risograph's signature double-print */}
        <g transform="translate(5,6)" opacity="0.34" filter="url(#auth-grain-soft)">
          <path
            d="M54 112 Q127 96 196 112 L204 112 Q273 96 346 112 L346 370 Q273 386 204 370 L196 370 Q127 386 54 370 Z"
            fill="#C8A95A"
          />
        </g>

        {/* Hardback covers — dark green, extend 8px beyond page edges */}
        <path
          d="M54 112 Q127 96 196 112 L196 370 Q127 386 54 370 Z"
          fill="#183A37"
          filter="url(#auth-grain-soft)"
        />
        <path
          d="M204 112 Q273 96 346 112 L346 370 Q273 386 204 370 Z"
          fill="#183A37"
          filter="url(#auth-grain-soft)"
        />

        {/* Left page — top/bottom edges bow outward via bezier arches */}
        <path
          d="M196 118 Q129 104 62 118 L62 364 Q129 378 196 364 Z"
          fill="#F4F2EC"
          filter="url(#auth-grain)"
        />

        {/* Right page */}
        <path
          d="M204 118 Q271 104 338 118 L338 364 Q271 378 204 364 Z"
          fill="#FAF9F5"
          filter="url(#auth-grain)"
        />

        {/* Spine — the binding strip */}
        <rect x="196" y="108" width="8" height="264" fill="#0D221F" />
        <line x1="199" y1="112" x2="199" y2="368" stroke="#2A4C48" strokeWidth="1.5" opacity="0.5" />

        {/* Page thickness — cover rim visible at outer edges */}
        <path d="M338 118 L346 112 L346 370 L338 364 Z" fill="#D0CCC0" opacity="0.65" />
        <path d="M62 118 L54 112 L54 370 L62 364 Z" fill="#C8C4B8" opacity="0.55" />

        {/* ── Text lines — right page ── */}
        <g opacity="0.28">
          <line x1="220" y1="162" x2="328" y2="162" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="220" y1="180" x2="328" y2="180" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="220" y1="198" x2="282" y2="198" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="220" y1="222" x2="328" y2="222" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="220" y1="240" x2="328" y2="240" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="220" y1="258" x2="294" y2="258" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="220" y1="282" x2="328" y2="282" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="220" y1="300" x2="328" y2="300" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="220" y1="318" x2="266" y2="318" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* ── Text lines — left page ── */}
        <g opacity="0.22">
          <line x1="72" y1="162" x2="180" y2="162" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="180" x2="180" y2="180" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="198" x2="132" y2="198" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="222" x2="180" y2="222" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="240" x2="180" y2="240" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="258" x2="148" y2="258" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="282" x2="180" y2="282" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="300" x2="180" y2="300" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="318" x2="114" y2="318" stroke="#183A37" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* ── Word highlight — right page, paragraph 2 line 1 ── */}
        {/* Gold misregistration ghost */}
        <rect x="223" y="218" width="74" height="16" rx="2.5" fill="#C8A95A" opacity="0.42" />
        {/* Main highlight */}
        <rect x="220" y="221" width="74" height="16" rx="2.5" fill="#183A37" opacity="0.19" />

        {/* Bookmark ribbon — protrudes above book top from spine area */}
        <path
          d="M269 106 L281 106 L281 150 L275 143 L269 150 Z"
          fill="#C8A95A"
          opacity="0.88"
          filter="url(#auth-grain)"
        />

      </g>
      {/* ════ end book rotation group ════ */}

      {/* ── TOOLTIP — unrotated, floats above the tilted highlight ──
          After 8° CW rotation, highlight center moves from (257,229) → ~(260,237).
          Tail tip lands at (214+47=261, 170+57=227), 10px gap above highlight. */}
      <g transform="translate(214, 170)" filter="url(#auth-grain-soft)">
        <rect width="110" height="44" rx="7" fill="#FAF9F5" stroke="#DDD9CE" strokeWidth="1.5" />
        <path d="M40 44 L47 57 L54 44" fill="#FAF9F5" stroke="#DDD9CE" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Lemma pill */}
        <rect x="8" y="9" width="40" height="13" rx="3" fill="#183A37" opacity="0.88" />
        {/* Grammar chip (e.g. case label) */}
        <rect x="54" y="9" width="24" height="13" rx="3" fill="#C8A95A" opacity="0.78" />
        {/* Translation lines */}
        <line x1="8" y1="33" x2="84" y2="33" stroke="#6E6D6A" strokeWidth="1.8" strokeLinecap="round" opacity="0.50" />
        <line x1="8" y1="43" x2="58" y2="43" stroke="#6E6D6A" strokeWidth="1.8" strokeLinecap="round" opacity="0.30" />
      </g>

      {/* ── PARTICLES — upper-right, gold ──
          Size-graduated (r 7→1.5) scattered diagonally outward from book corner. */}
      <circle cx="354" cy="104" r="7"   fill="#C8A95A" opacity="0.62" />
      <circle cx="367" cy="90"  r="5.5" fill="#C8A95A" opacity="0.55" />
      <circle cx="378" cy="78"  r="4"   fill="#C8A95A" opacity="0.50" />
      <circle cx="372" cy="112" r="3.5" fill="#C8A95A" opacity="0.46" />
      <circle cx="363" cy="72"  r="2.5" fill="#C8A95A" opacity="0.40" />
      <circle cx="384" cy="96"  r="2.5" fill="#C8A95A" opacity="0.38" />
      <circle cx="380" cy="122" r="2"   fill="#C8A95A" opacity="0.33" />
      <circle cx="390" cy="82"  r="1.8" fill="#C8A95A" opacity="0.28" />
      <circle cx="370" cy="60"  r="1.5" fill="#C8A95A" opacity="0.24" />
      <circle cx="393" cy="108" r="1.5" fill="#C8A95A" opacity="0.20" />

      {/* ── PARTICLES — upper-left, paper/white ──
          Mirror cadence: large cluster near corner, smaller ones drifting up-left. */}
      <circle cx="46"  cy="104" r="6"   fill="#FAF9F5" opacity="0.58" />
      <circle cx="33"  cy="90"  r="4.5" fill="#FAF9F5" opacity="0.52" />
      <circle cx="22"  cy="106" r="3"   fill="#FAF9F5" opacity="0.46" />
      <circle cx="40"  cy="120" r="2.5" fill="#FAF9F5" opacity="0.42" />
      <circle cx="28"  cy="76"  r="2"   fill="#FAF9F5" opacity="0.36" />
      <circle cx="50"  cy="80"  r="1.8" fill="#FAF9F5" opacity="0.32" />
      <circle cx="14"  cy="118" r="1.5" fill="#FAF9F5" opacity="0.26" />

      {/* ── SCRIPT CHARACTERS — multilingual decoration ── */}
      <text x="62"  y="428" fontFamily="Georgia, serif" fontSize="22" fill="#FAF9F5" opacity="0.38" fontStyle="italic">α</text>
      <text x="330" y="432" fontFamily="Georgia, serif" fontSize="20" fill="#C8A95A" opacity="0.50" fontStyle="italic">я</text>
      <text x="194" y="442" fontFamily="Georgia, serif" fontSize="16" fill="#FAF9F5" opacity="0.26" fontStyle="italic">é</text>

      {/* ── Grain overlay on full composition ── */}
      <rect x="0" y="0" width="400" height="480" fill="transparent" filter="url(#auth-grain)" opacity="0.07" />
    </svg>
  );
}
