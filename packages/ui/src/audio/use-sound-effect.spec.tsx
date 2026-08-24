import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSoundEffect } from './use-sound-effect.js';

class FakeAudio {
  static instances: FakeAudio[] = [];
  currentTime = 0;
  playCallCount = 0;

  constructor(public src: string) {
    FakeAudio.instances.push(this);
  }

  play(): Promise<void> {
    this.playCallCount++;
    return Promise.resolve();
  }
}

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('useSoundEffect', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    FakeAudio.instances = [];
    vi.stubGlobal('Audio', FakeAudio);
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it('plays the given src when the returned trigger is called', () => {
    let trigger: (() => void) | undefined;

    function Probe() {
      trigger = useSoundEffect('/audio/join.mp3');
      return null;
    }

    act(() => {
      root.render(<Probe />);
    });

    act(() => trigger!());

    expect(FakeAudio.instances).toHaveLength(1);
    expect(FakeAudio.instances[0]?.src).toBe('/audio/join.mp3');
    expect(FakeAudio.instances[0]?.playCallCount).toBe(1);
  });

  it('returns a stable trigger reference across re-renders', () => {
    const triggers: Array<() => void> = [];

    function Probe({ tick }: { tick: number }) {
      triggers.push(useSoundEffect('/audio/join.mp3'));
      return <span>{tick}</span>;
    }

    act(() => {
      root.render(<Probe tick={0} />);
    });
    act(() => {
      root.render(<Probe tick={1} />);
    });

    expect(triggers[0]).toBe(triggers[1]);
  });

  it('reuses the same underlying player across multiple trigger calls', () => {
    let trigger: (() => void) | undefined;

    function Probe() {
      trigger = useSoundEffect('/audio/leave.mp3');
      return null;
    }

    act(() => {
      root.render(<Probe />);
    });

    act(() => trigger!());
    act(() => trigger!());

    expect(FakeAudio.instances).toHaveLength(1);
    expect(FakeAudio.instances[0]?.playCallCount).toBe(2);
  });
});
