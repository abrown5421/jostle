import { Icon, Text, mergeClassNames, resolveColorClass } from '@inithium/ui';
import type { IconName } from '@inithium/ui';
import type { GameCatalogueItem } from '@inithium/api-client';
import { SURFACE_BG, SURFACE_BORDER, SURFACE_TEXT } from './surfaceColors';

const FALLBACK_ICON: IconName = 'GameController';

export interface GameMediaProps {
  readonly game: Pick<GameCatalogueItem, 'title' | 'imageUrl' | 'icon'>;
  readonly className?: string;
  // The fallback icon's size in px - the tile itself scales with its container.
  readonly iconSize?: number;
}

// The game's art in a fixed-ratio frame. Logos are drawn on black and come in mixed aspect
// ratios, so they're contained (never cropped) on a matching black frame - that black is part of
// the art, not a surface. A game with no art yet gets its catalogue icon and title on the
// standard surface pairing instead.
export const GameMedia = ({ game, className, iconSize = 72 }: GameMediaProps) =>
  game.imageUrl ? (
    <div className={mergeClassNames('flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-black', className)}>
      <img src={game.imageUrl} alt={game.title} loading="lazy" className="h-full w-full object-contain" />
    </div>
  ) : (
    <div
      className={mergeClassNames(
        'flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 overflow-hidden border-b p-4',
        resolveColorClass('bg', SURFACE_BG),
        resolveColorClass('border', SURFACE_BORDER),
        className,
      )}
    >
      <Icon name={(game.icon as IconName | undefined) ?? FALLBACK_ICON} size={iconSize} weight="duotone" textColor={SURFACE_TEXT} />
      <Text as="span" className="text-center text-xl font-bold" textColor={SURFACE_TEXT}>
        {game.title}
      </Text>
    </div>
  );
