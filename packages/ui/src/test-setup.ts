declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Run rAF callbacks synchronously so hooks built on useAnimationTrigger
// (which defers one frame to let a re-triggered animation restart) settle
// within a single act() instead of needing real-timer waits in every test.
globalThis.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  callback(0);
  return 0;
};
