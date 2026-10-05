import type { ButtonProps, ColorSpec } from '@inithium/ui';

// The one contrast pairing every catalogue and session screen uses: surface-100 for every
// background, surface-950 for every piece of text. Both ends of the surface scale mirror in dark
// mode (see theme.css), so this pairing stays legible in either theme - pick hierarchy with size
// and weight, never a mid-scale gray that fades out against one theme or the other.
export const SURFACE_BG: ColorSpec = { color: 'surface', intensity: 100 };
export const SURFACE_TEXT: ColorSpec = { color: 'surface', intensity: 950 };
export const SURFACE_BORDER: ColorSpec = { color: 'surface', intensity: 300 };

// The 'outlined' variant paints a slate-500 fill of its own; this keeps secondary buttons on the
// surface pairing instead.
export const SECONDARY_BUTTON_PROPS: Pick<ButtonProps, 'variant' | 'bgColor' | 'textColor'> = {
  variant: { kind: 'outlined', color: 'surface', intensity: 950 },
  bgColor: SURFACE_BG,
  textColor: SURFACE_TEXT,
};

export const GHOST_BUTTON_PROPS: Pick<ButtonProps, 'variant' | 'textColor'> = {
  variant: { kind: 'ghost', color: 'surface', intensity: 950 },
  textColor: SURFACE_TEXT,
};
