/**
 * Inline SVG icons used in the references. Sized 1em, drawn with currentColor.
 * Decorative by default (aria-hidden); pass a title via the parent's accessible name instead.
 */
const base = { width: '1em', height: '1em', viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true, focusable: false };

export const SunIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="8" cy="8" r="2.75" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06" />
    </g>
  </svg>
);

export const MoonIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M13.5 9.6A5.75 5.75 0 0 1 6.4 2.5a5.75 5.75 0 1 0 7.1 7.1Z" fill="currentColor" />
  </svg>
);

/** "System" theme: a half-filled circle. */
export const HalfCircleIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.3" />
    <path d="M8 2.25a5.75 5.75 0 0 0 0 11.5Z" fill="currentColor" />
  </svg>
);

export const ChevronDownIcon = (props) => (
  <svg {...base} {...props}>
    <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronLeftIcon = (props) => (
  <svg {...base} {...props}>
    <path d="m10 4-4 4 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronRightIcon = (props) => (
  <svg {...base} {...props}>
    <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Checklist counter icon ("☑ 0/1"). */
export const CheckSquareIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="2.5" y="2.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
    <path d="m5.5 8.2 1.7 1.7 3.3-3.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
