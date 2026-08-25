import { generateTriangleMesh } from '@jostle/profile-appearance';
import type { BannerConfig } from '@jostle/profile-appearance';

const VIEW_WIDTH = 400;
const VIEW_HEIGHT = 160;

export interface TrianglePatternProps {
  pattern: BannerConfig;
}

/** Renders a Banner's triangle mesh, generated from the user's chosen pattern config. */
export function TrianglePattern({ pattern }: TrianglePatternProps) {
  const triangles = generateTriangleMesh(pattern, VIEW_WIDTH, VIEW_HEIGHT);

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {triangles.map((triangle, index) => (
        <polygon
          key={index}
          points={triangle.points}
          fill={triangle.fill}
          stroke={triangle.fill}
          strokeOpacity={0.15}
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}
