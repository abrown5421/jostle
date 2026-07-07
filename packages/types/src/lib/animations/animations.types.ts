export type AnimateEntry ='backInDown' | 'backInLeft' | 'backInRight' | 'backInUp'
  | 'bounceIn' | 'bounceInDown' | 'bounceInLeft' | 'bounceInRight' | 'bounceInUp'
  | 'fadeIn' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'fadeInUp'
  | 'flipInX' | 'flipInY'
  | 'lightSpeedInLeft' | 'lightSpeedInRight'
  | 'rotateIn' | 'rotateInDownLeft' | 'rotateInDownRight' | 'rotateInUpLeft' | 'rotateInUpRight'
  | 'zoomIn' | 'zoomInDown' | 'zoomInLeft' | 'zoomInRight' | 'zoomInUp'
  | 'slideInDown' | 'slideInLeft' | 'slideInRight' | 'slideInUp';


export type AnimateExit = 'backOutDown' | 'backOutLeft' | 'backOutRight' | 'backOutUp'
  | 'bounceOut' | 'bounceOutDown' | 'bounceOutLeft' | 'bounceOutRight' | 'bounceOutUp'
  | 'fadeOut' | 'fadeOutDown' | 'fadeOutLeft' | 'fadeOutRight' | 'fadeOutUp'
  | 'fadeOutTopLeft' | 'fadeOutTopRight' | 'fadeOutBottomLeft' | 'fadeOutBottomRight'
  | 'flipOutX' | 'flipOutY'
  | 'lightSpeedOutLeft' | 'lightSpeedOutRight'
  | 'rotateOut' | 'rotateOutDownLeft' | 'rotateOutDownRight' | 'rotateOutUpLeft' | 'rotateOutUpRight'
  | 'zoomOut' | 'zoomOutDown' | 'zoomOutLeft' | 'zoomOutRight' | 'zoomOutUp'
  | 'slideOutDown' | 'slideOutLeft' | 'slideOutRight' | 'slideOutUp'
  | 'hinge' | 'rollOut';

export type AnimateDelay =
  | 'delay-1s'
  | 'delay-2s'
  | 'delay-3s'
  | 'delay-4s'
  | 'delay-5s';

export type AnimateSpeed =
  | 'slow'
  | 'slower'
  | 'fast'
  | 'faster';

export type AnimationPhase =
  | 'idle'
  | 'entering'
  | 'entered'
  | 'exiting';

export interface AnimationController {
  phase: AnimationPhase;
  triggerExit: () => Promise<void>;
  triggerEnter: () => void;
  reset?: () => void;
}

export interface AnimationObject {
  entry: AnimateEntry;
  exit: AnimateExit;    
  entryDelay?: AnimateDelay;
  exitDelay?: AnimateDelay;
  entrySpeed?: AnimateSpeed;
  exitSpeed?: AnimateSpeed;
  controller?: AnimationController;
}
