import { useId } from 'react';
import type { Ref } from 'react';
import { useAnimationProp } from '../animation/index.js';
import { cn, mergeRefs } from '../shared/index.js';
import type { AnimatableProps, BlowoffProps } from '../shared/index.js';
import { TrianglePattern } from './triangle-pattern.js';

export interface BannerProps extends BlowoffProps, AnimatableProps {
  imageUrl?: string;
  alt?: string;
  onEdit?: () => void;
  editLabel?: string;
  ref?: Ref<HTMLDivElement>;
}

export function Banner({
  imageUrl,
  alt = '',
  onEdit,
  editLabel = 'Edit banner',
  animation,
  className,
  style,
  ref,
}: BannerProps) {
  const patternId = useId();
  const animationProp = useAnimationProp(animation);

  return (
    <div
      ref={mergeRefs(ref, animationProp.ref as Ref<HTMLDivElement>)}
      className={cn(
        'relative h-56 w-full overflow-hidden bg-surface-primary',
        animationProp.className,
        className,
      )}
      style={{ ...animationProp.style, ...style }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <TrianglePattern patternId={patternId} />
      )}

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={editLabel}
          className="absolute top-4 right-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-surface-secondary/90 text-content-primary shadow-md transition-colors hover:bg-surface-secondary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4"
          >
            <path
              d="M16.862 4.487a2.1 2.1 0 0 1 2.97 2.97L8.83 18.46l-4.243 1.06 1.06-4.242L16.862 4.487Z"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
