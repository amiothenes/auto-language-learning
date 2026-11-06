import type { ReactNode, SVGProps } from 'react';

/**
 * Riso-style nav icons. Each icon is a 24x24 line drawing in `currentColor`
 * (stroke 1.5, the same weight as the lucide icons used everywhere else) plus a
 * second "ink" layer: a flat ochre fill offset slightly down-left and blended
 * with multiply, the misregistration look of public/illustrations/*.svg.
 *
 * API mirrors lucide (`size`, `strokeWidth`, `className`) so these drop into
 * the existing `iconMap` in components/Sidebar.tsx unchanged. `active` makes
 * the second ink stronger.
 */
export interface RisoIconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: number;
  strokeWidth?: number;
  active?: boolean;
}

function RisoIcon({
  size = 24,
  strokeWidth = 1.5,
  active = false,
  ink,
  line,
  ...rest
}: RisoIconProps & { ink: ReactNode; line: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <g
        fill="#C28A4A"
        opacity={active ? 0.85 : 0.4}
        transform="translate(-0.9,0.8)"
        style={{ mixBlendMode: 'multiply', transition: 'opacity 200ms' }}
      >
        {ink}
      </g>
      <g stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {line}
      </g>
    </svg>
  );
}

/** Today: a sun rising over an open book. */
export function TodayIcon(props: RisoIconProps) {
  return (
    <RisoIcon
      {...props}
      ink={<path d="M8 11.5a4 4 0 0 1 8 0z" />}
      line={
        <>
          <path d="M8 11.5a4 4 0 0 1 8 0" />
          <path d="M12 3.5v1.6M6.4 5.7l1.1 1.1M17.6 5.7l-1.1 1.1" />
          <path d="M3 13.8c3-1 6-.8 9 .9 3-1.7 6-1.9 9-.9v6c-3-1-6-.8-9 .9-3-1.7-6-1.9-9-.9z" />
          <path d="M12 14.7v6" />
        </>
      }
    />
  );
}

/** Library (Series): book spines standing under a reading-room arch. */
export function LibraryIcon(props: RisoIconProps) {
  return (
    <RisoIcon
      {...props}
      ink={<path d="M7 21v-7.5h7.5V21z" />}
      line={
        <>
          <path d="M4 21V10.5a8 8 0 0 1 16 0V21" />
          <path d="M3 21h18" />
          <path d="M8 21v-7M10.7 21v-8.2M13.4 21v-6.6M15.6 21l1.9-6.3" />
        </>
      }
    />
  );
}

/** Review: a flashcard stacked on another, with a tick. */
export function ReviewIcon(props: RisoIconProps) {
  return (
    <RisoIcon
      {...props}
      ink={<rect x="4" y="7" width="11.5" height="14" rx="1.5" />}
      line={
        <>
          <path d="M8.5 4.5V4a1 1 0 0 1 1-1h9.5a1 1 0 0 1 1 1v12.5a1 1 0 0 1-1 1h-.5" />
          <rect x="4" y="7" width="11.5" height="14" rx="1.5" />
          <path d="M7.4 14.2l2.1 2.1 3.6-4" />
        </>
      }
    />
  );
}

/** Vocabulary: a stitched notebook with a quill. */
export function VocabularyIcon(props: RisoIconProps) {
  return (
    <RisoIcon
      {...props}
      ink={<path d="M20.5 3.2c-3.6.6-6.6 3.6-7.4 8.4 4.6-.6 7.4-4 7.4-8.4z" />}
      line={
        <>
          <rect x="3.5" y="4" width="11.5" height="17" rx="1.5" />
          <path d="M6.6 4v17" />
          <path d="M9.4 9h3M9.4 12h3" />
          <path d="M20.5 3.2c-3.6.6-6.6 3.6-7.4 8.4 4.6-.6 7.4-4 7.4-8.4z" />
          <path d="M13.1 11.6l-1.8 3.4" />
        </>
      }
    />
  );
}

/** Progress: a mountain with a flag on the near summit. */
export function ProgressIcon(props: RisoIconProps) {
  return (
    <RisoIcon
      {...props}
      ink={<path d="M2.5 20.5L9 10.5l4 5.5 2.6-3.6 6 8.1z" />}
      line={
        <>
          <path d="M2.5 20.5L9 10.5l4 5.5 2.6-3.6 6 8.1z" />
          <path d="M9 10.5V3.8l4.2 1.6L9 7" />
        </>
      }
    />
  );
}

/** Field Guide: a compass. */
export function GuideIcon(props: RisoIconProps) {
  return (
    <RisoIcon
      {...props}
      ink={<path d="M15.6 8.4l-2.2 5-5 2.2 2.2-5z" />}
      line={
        <>
          <circle cx="12" cy="12" r="8.75" />
          <path d="M15.6 8.4l-2.2 5-5 2.2 2.2-5z" />
          <path d="M12 3.25v1.5M12 19.25v1.5M3.25 12h1.5M19.25 12h1.5" />
        </>
      }
    />
  );
}

/** Settings: two tuning sliders, knobs inked. */
export function SettingsIcon(props: RisoIconProps) {
  return (
    <RisoIcon
      {...props}
      ink={
        <>
          <circle cx="15" cy="7.5" r="2.4" />
          <circle cx="9" cy="16.5" r="2.4" />
        </>
      }
      line={
        <>
          <path d="M3.5 7.5h9.1M17.4 7.5h3.1M3.5 16.5h3.1M11.4 16.5h9.1" />
          <circle cx="15" cy="7.5" r="2.4" />
          <circle cx="9" cy="16.5" r="2.4" />
        </>
      }
    />
  );
}
