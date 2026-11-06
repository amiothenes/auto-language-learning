/**
 * Shared SVG definitions for the riso art system. Mounted once in the root
 * layout; every riso scene, glyph and icon references these ids instead of
 * redefining its own filters (cheaper to render, consistent grain everywhere).
 *
 * The look follows the original public/illustrations/*.svg:
 *   - flat ink layers (green, ochre, coral) blended with multiply,
 *   - the second ink offset by 1-2px ("misregistration"),
 *   - a monochrome fractal-noise grain composited inside the ink.
 *
 * Ids are prefixed `riso-` so they can't collide with per-component useId()s.
 */
export function RisoDefs() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {/* Grain: apply to an ink shape to give it the printed-paper tooth. */}
        <filter id="riso-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>

        {/* Coarser grain for large scenes, where 0.9 reads as flat. */}
        <filter id="riso-grain-coarse" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" stitchTiles="stitch" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.55" />
          </feComponentTransfer>
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>

        {/* Halftone dots, one per ink, for shading and light pools. */}
        <pattern id="riso-halftone-green" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.9" fill="#183A37" />
        </pattern>
        <pattern id="riso-halftone-ochre" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#C28A4A" />
        </pattern>
        <pattern id="riso-halftone-coral" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#E0654F" />
        </pattern>
      </defs>
    </svg>
  );
}

/** Ink colours as plain values, for SVG attributes (Tailwind classes don't reach `fill`). */
export const INK = {
  green: '#183A37',
  ochre: '#C28A4A',
  gold: '#C8A95A',
  coral: '#E0654F',
  paper: '#FAF9F5',
  desk: '#F0EFEA',
} as const;

/** Standard misregistration offset for the second ink layer. */
export const MISREG = 'translate(-1.6,1.4)';
