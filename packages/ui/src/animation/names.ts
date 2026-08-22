/*
 * Curated animate.css class name lists, grouped by category, for
 * AnimationConfig autocomplete. Not exhaustive of every animate.css
 * variant — AnimationName also accepts any string so an uncommon name
 * (see https://animate.style) still works without a type change here.
 */
export const ENTRANCE_ANIMATIONS = [
  'fadeIn', 'fadeInDown', 'fadeInLeft', 'fadeInRight', 'fadeInUp',
  'fadeInTopLeft', 'fadeInTopRight', 'fadeInBottomLeft', 'fadeInBottomRight',
  'bounceIn', 'bounceInDown', 'bounceInLeft', 'bounceInRight', 'bounceInUp',
  'zoomIn', 'zoomInDown', 'zoomInLeft', 'zoomInRight', 'zoomInUp',
  'slideInDown', 'slideInLeft', 'slideInRight', 'slideInUp',
  'rotateIn', 'rotateInDownLeft', 'rotateInDownRight', 'rotateInUpLeft', 'rotateInUpRight',
  'flipInX', 'flipInY', 'lightSpeedInLeft', 'lightSpeedInRight',
  'backInDown', 'backInLeft', 'backInRight', 'backInUp',
  'jackInTheBox', 'rollIn',
] as const;

export const EXIT_ANIMATIONS = [
  'fadeOut', 'fadeOutDown', 'fadeOutLeft', 'fadeOutRight', 'fadeOutUp',
  'fadeOutTopLeft', 'fadeOutTopRight', 'fadeOutBottomLeft', 'fadeOutBottomRight',
  'bounceOut', 'bounceOutDown', 'bounceOutLeft', 'bounceOutRight', 'bounceOutUp',
  'zoomOut', 'zoomOutDown', 'zoomOutLeft', 'zoomOutRight', 'zoomOutUp',
  'slideOutDown', 'slideOutLeft', 'slideOutRight', 'slideOutUp',
  'rotateOut', 'rotateOutDownLeft', 'rotateOutDownRight', 'rotateOutUpLeft', 'rotateOutUpRight',
  'flipOutX', 'flipOutY', 'lightSpeedOutLeft', 'lightSpeedOutRight',
  'backOutDown', 'backOutLeft', 'backOutRight', 'backOutUp',
  'hinge', 'rollOut',
] as const;

export const ATTENTION_ANIMATIONS = [
  'bounce', 'flash', 'pulse', 'rubberBand', 'shakeX', 'shakeY', 'headShake',
  'swing', 'tada', 'wobble', 'jello', 'heartBeat',
] as const;
