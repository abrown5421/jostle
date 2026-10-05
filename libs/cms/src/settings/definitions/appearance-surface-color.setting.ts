import type { SettingDefinition } from './registry';

// Unlike the other 5 brand tokens, surface's regenerated scale also feeds a mirrored copy for
// dark mode (see buildCustomBrandThemeCss in @inithium/ui) - the same light/dark split
// theme.css's own static surface scale already has.
const appearanceSurfaceColorSetting: SettingDefinition = {
  key: 'appearance.surfaceColor',
  label: 'Surface Color',
  description: 'The surface (background/layering) tint. Only its hue and saturation are used - the 100-950 scale (dark at 100, light at 950) keeps fixed lightness steps for readable contrast, plus its dark-mode mirror.',
  group: 'Appearance',
  order: 45,
  type: 'color',
  default: '#94a3b8',
};

export default appearanceSurfaceColorSetting;
