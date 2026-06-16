/* Inline SVG icon set, transcribed from the prototype. In a real codebase these
   would be replaced by the project's icon library (Lucide / SF Symbols / …). */

interface IconProps {
  size?: number;
  color?: string;
}

export function SearchIcon({ size = 17, color = '#57514a' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="5.6" fill="none" stroke={color} strokeWidth="1.7" />
      <line x1="11.7" y1="11.7" x2="16" y2="16" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function MinusIcon({ color = '#57514a' }: IconProps) {
  return (
    <svg width="12" height="2" viewBox="0 0 12 2" aria-hidden="true">
      <line x1="1" y1="1" x2="11" y2="1" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon({ color = '#57514a' }: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <line x1="6" y1="1" x2="6" y2="11" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="1" y1="6" x2="11" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon({ color = '#6b6357' }: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <line x1="1.5" y1="1.5" x2="10.5" y2="10.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <line x1="10.5" y1="1.5" x2="1.5" y2="10.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function GearIcon({ size = 17, color = '#57514a' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="3" fill="none" stroke={color} strokeWidth="1.7" />
      <path
        d="M10 1.6v2.2M10 16.2v2.2M3.6 3.6l1.6 1.6M14.8 14.8l1.6 1.6M1.6 10h2.2M16.2 10h2.2M3.6 16.4l1.6-1.6M14.8 5.2l1.6-1.6"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SparkleIcon({ size = 15, color = '#2f7d5b' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1.5l1.4 3.7L13 6.5l-3.6 1.3L8 11.5 6.6 7.8 3 6.5l3.6-1.3z" fill={color} />
      <circle cx="12.5" cy="12" r="1.3" fill={color} />
    </svg>
  );
}

export function HourglassIcon({ size = 13, color = '#6b6357' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      <line x1="3" y1="1.7" x2="11" y2="1.7" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="3" y1="12.3" x2="11" y2="12.3" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M3.9 2.2 H10.1 L7 7 Z" fill={color} />
      <path d="M3.9 11.8 H10.1 L7 7 Z" fill={color} />
    </svg>
  );
}

export function CheckIcon({ size = 13, color = '#2f7d5b' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      <path d="M2.5 7.5l3 3 6-6.5" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Chevron({
  size = 7,
  color = '#cfc7b7',
  rotated = false,
  opacity = 1,
}: IconProps & { rotated?: boolean; opacity?: number }) {
  const h = Math.round((size / 7) * 11);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 8 12"
      aria-hidden="true"
      style={{ opacity, transform: rotated ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .2s ease' }}
    >
      <path d="M1 1l5 5-5 5" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TabComposition({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="11" cy="11" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function TabTree({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      <line x1="11" y1="6" x2="6" y2="15" stroke="currentColor" strokeWidth="1.6" />
      <line x1="11" y1="6" x2="16" y2="15" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="11" cy="5" r="2.6" fill="currentColor" />
      <circle cx="5.5" cy="16" r="2.6" fill="currentColor" />
      <circle cx="16.5" cy="16" r="2.6" fill="currentColor" />
    </svg>
  );
}

export function TabBody({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="5" r="3" fill="currentColor" />
      <rect x="6.5" y="9.5" width="9" height="9" rx="4.5" fill="currentColor" />
    </svg>
  );
}

export function TabCompare({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      <rect x="5" y="9" width="5" height="9" rx="1.4" fill="currentColor" />
      <rect x="12" y="5" width="5" height="13" rx="1.4" fill="currentColor" />
    </svg>
  );
}
