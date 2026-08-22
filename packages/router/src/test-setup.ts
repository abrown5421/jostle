declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Run rAF callbacks synchronously so hooks built on useAnimationTrigger
// settle within a single act() instead of needing real-timer waits.
globalThis.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  callback(0);
  return 0;
};
