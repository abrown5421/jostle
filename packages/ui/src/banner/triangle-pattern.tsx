const TILE = 96;
const HALF = TILE / 2;

interface Facet {
  points: string;
  fill: 'ice' | 'primary' | 'accent';
  opacity: number;
}

const FACETS: Facet[] = [
  { points: `0,0 ${HALF},0 0,${HALF}`, fill: 'primary', opacity: 0.07 },
  { points: `${HALF},0 ${HALF},${HALF} 0,${HALF}`, fill: 'ice', opacity: 0.16 },
  { points: `${HALF},0 ${TILE},0 ${HALF},${HALF}`, fill: 'ice', opacity: 0.12 },
  {
    points: `${TILE},0 ${TILE},${HALF} ${HALF},${HALF}`,
    fill: 'ice',
    opacity: 0.05,
  },
  { points: `0,${HALF} ${HALF},${HALF} 0,${TILE}`, fill: 'ice', opacity: 0.2 },
  {
    points: `${HALF},${HALF} ${HALF},${TILE} 0,${TILE}`,
    fill: 'ice',
    opacity: 0.08,
  },
  {
    points: `${HALF},${HALF} ${TILE},${HALF} ${HALF},${TILE}`,
    fill: 'accent',
    opacity: 0.06,
  },
  {
    points: `${TILE},${HALF} ${TILE},${TILE} ${HALF},${TILE}`,
    fill: 'ice',
    opacity: 0.14,
  },
];

const FILL_VAR: Record<Facet['fill'], string> = {
  ice: 'var(--color-content-tertiary)',
  primary: 'var(--color-primary)',
  accent: 'var(--color-accent)',
};

export interface TrianglePatternProps {
  patternId: string;
}

/** Jostle-branded low-poly triangle mesh, used as the Banner placeholder when no image is set. */
export function TrianglePattern({ patternId }: TrianglePatternProps) {
  const bgId = `${patternId}-bg`;

  return (
    <svg
      viewBox="0 0 400 160"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-surface-tertiary)" />
          <stop offset="100%" stopColor="var(--color-surface-primary)" />
        </linearGradient>
        <pattern
          id={patternId}
          width={TILE}
          height={TILE}
          patternUnits="userSpaceOnUse"
        >
          {FACETS.map((facet) => (
            <polygon
              key={facet.points}
              points={facet.points}
              fill={FILL_VAR[facet.fill]}
              fillOpacity={facet.opacity}
              stroke="var(--color-content-tertiary)"
              strokeOpacity={0.12}
              strokeWidth={1}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${bgId})`} />
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
