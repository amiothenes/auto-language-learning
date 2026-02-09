// ============================================================================
// SettingsHeaderDecoration Component
// Subtle decorative gear illustration for settings page header
// 64x64px, low opacity, Risograph aesthetic
// ============================================================================

export function SettingsHeaderDecoration() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Back gear (misregistered) */}
      <circle cx="33" cy="33" r="20" fill="#183A37" opacity="0.08" />

      {/* Gear teeth (outer) */}
      <path
        d="M32 8 L34 8 L34 12 L30 12 L30 8 Z
           M48 14 L50 16 L47 19 L44 16 Z
           M56 30 L56 34 L52 34 L52 30 Z
           M50 48 L48 50 L45 47 L48 44 Z
           M34 56 L30 56 L30 52 L34 52 Z
           M16 50 L14 48 L17 45 L20 48 Z
           M8 34 L8 30 L12 30 L12 34 Z
           M14 16 L16 14 L19 17 L16 20 Z"
        fill="#183A37"
        opacity="0.15"
      />

      {/* Main gear body */}
      <circle cx="32" cy="32" r="20" fill="none" stroke="#183A37" strokeWidth="2" opacity="0.4" />

      {/* Inner gear circle */}
      <circle cx="32" cy="32" r="14" fill="none" stroke="#183A37" strokeWidth="1.5" opacity="0.3" />

      {/* Center hub */}
      <circle cx="32" cy="32" r="8" fill="#183A37" opacity="0.2" />

      {/* Center hole */}
      <circle cx="32" cy="32" r="5" fill="none" stroke="#183A37" strokeWidth="1" opacity="0.3" />

      {/* Spokes (academic tool detail) */}
      <line x1="32" y1="24" x2="32" y2="18" stroke="#183A37" strokeWidth="1" opacity="0.25" />
      <line x1="40" y1="32" x2="46" y2="32" stroke="#183A37" strokeWidth="1" opacity="0.25" />
      <line x1="32" y1="40" x2="32" y2="46" stroke="#183A37" strokeWidth="1" opacity="0.25" />
      <line x1="24" y1="32" x2="18" y2="32" stroke="#183A37" strokeWidth="1" opacity="0.25" />

      {/* Grain texture overlay */}
      <circle cx="32" cy="32" r="20" fill="url(#grain-settings)" opacity="0.03" />

      <defs>
        <pattern id="grain-settings" width="3" height="3" patternUnits="userSpaceOnUse">
          <rect width="1" height="1" fill="#141413" opacity="0.05" />
        </pattern>
      </defs>
    </svg>
  );
}
