import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAudioPlayer } from './create-audio-player.js';

class FakeAudio {
  static instances: FakeAudio[] = [];
  currentTime = 5;
  playCallCount = 0;

  constructor(public src: string) {
    FakeAudio.instances.push(this);
  }

  play(): Promise<void> {
    this.playCallCount++;
    return Promise.resolve();
  }
}

describe('createAudioPlayer', () => {
  beforeEach(() => {
    FakeAudio.instances = [];
    vi.stubGlobal('Audio', FakeAudio);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not construct an Audio element until play is first called', () => {
    createAudioPlayer('/audio/join.mp3');
    expect(FakeAudio.instances).toHaveLength(0);
  });

  it('constructs one Audio element on first play and reuses it on subsequent plays', () => {
    const player = createAudioPlayer('/audio/join.mp3');
    player.play();
    player.play();

    expect(FakeAudio.instances).toHaveLength(1);
    expect(FakeAudio.instances[0]?.src).toBe('/audio/join.mp3');
    expect(FakeAudio.instances[0]?.playCallCount).toBe(2);
  });

  it('resets currentTime to 0 before each play, so a replay restarts from the beginning', () => {
    const player = createAudioPlayer('/audio/join.mp3');
    player.play();

    expect(FakeAudio.instances[0]?.currentTime).toBe(0);
  });

  it('swallows a rejected play() promise without throwing', () => {
    class RejectingAudio extends FakeAudio {
      override play(): Promise<void> {
        return Promise.reject(new Error('NotAllowedError'));
      }
    }
    vi.stubGlobal('Audio', RejectingAudio);

    const player = createAudioPlayer('/audio/join.mp3');
    expect(() => player.play()).not.toThrow();
  });

  it('swallows a synchronously-thrown play() without throwing', () => {
    class ThrowingAudio extends FakeAudio {
      override play(): never {
        throw new Error('Not implemented');
      }
    }
    vi.stubGlobal('Audio', ThrowingAudio);

    const player = createAudioPlayer('/audio/join.mp3');
    expect(() => player.play()).not.toThrow();
  });

  it('no-ops when Audio is unavailable', () => {
    vi.stubGlobal('Audio', undefined);

    const player = createAudioPlayer('/audio/join.mp3');
    expect(() => player.play()).not.toThrow();
  });
});
