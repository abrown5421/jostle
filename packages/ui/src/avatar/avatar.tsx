import type { ReactNode, Ref } from 'react';
import { useAnimationProp } from '../animation/index.js';
import { cn, initialsFromName, mergeRefs } from '../shared/index.js';
import type { AnimatableProps, BlowoffProps } from '../shared/index.js';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-16 w-16 text-lg',
  lg: 'h-24 w-24 text-2xl',
  xl: 'h-40 w-40 text-4xl',
};

export interface AvatarProps extends BlowoffProps, AnimatableProps {
  imageUrl?: string;
  /** Used for alt text and, absent an image, the fallback initials. */
  name?: string;
  /** @default 'md' */
  size?: AvatarSize;
  /** CSS font-family for the fallback initials, e.g. from @jostle/assets fonts. */
  initialsFontFamily?: string;
  /** When set, the whole avatar becomes a click target that shows a pencil overlay on hover. */
  onEdit?: () => void;
  editLabel?: string;
  /** Rendered over the avatar's bottom-right corner (e.g. a presence indicator). */
  statusIndicator?: ReactNode;
  ref?: Ref<HTMLSpanElement>;
}

export function Avatar({
  imageUrl,
  name = '',
  size = 'md',
  initialsFontFamily,
  onEdit,
  editLabel = 'Edit avatar',
  statusIndicator,
  animation,
  className,
  style,
  ref,
}: AvatarProps) {
  const animationProp = useAnimationProp(animation);

  return (
    <span className="relative inline-flex">
      <span
        ref={mergeRefs(ref, animationProp.ref as Ref<HTMLSpanElement>)}
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-primary-foreground ring-4 ring-surface-primary',
          SIZE_CLASS[size],
          animationProp.className,
          className,
        )}
        style={{
          ...animationProp.style,
          ...(initialsFontFamily
            ? { fontFamily: initialsFontFamily }
            : undefined),
          ...style,
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          initialsFromName(name)
        )}
      </span>

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={editLabel}
          className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full text-transparent transition-colors hover:bg-surface-primary/60 hover:text-content-primary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            className="h-1/3 w-1/3"
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

      {statusIndicator && (
        <span className="absolute bottom-0 right-0 inline-flex">
          {statusIndicator}
        </span>
      )}
    </span>
  );
}
