import type { GameDefinition } from '../../contracts/game-definition.contract';
import { addMs, phaseTimeout } from '../shared';
import { hexDeltaE, hslToHex } from './color';
import { COUNTDOWN_MS, handlePointOfHueAction } from './pointOfHue.reducer';
import type { PointOfHueSettings, PointOfHueState } from './pointOfHue.types';
import { POINT_OF_HUE_GAME_ID } from './pointOfHue.types';
import { pointOfHueHostView, pointOfHuePrivateView, pointOfHuePublicView } from './pointOfHue.views';

// Targets are vivid enough to remember: any hue, but saturation and lightness kept mid-range so no
// round is a near-black, near-white or muddy grey. Each must also look clearly different from every
// earlier target (CIEDE2000 >= MIN_TARGET_SEPARATION), so no two rounds feel like repeats.
const SATURATION = { min: 0.45, max: 0.9 };
const LIGHTNESS = { min: 0.35, max: 0.7 };
export const MIN_TARGET_SEPARATION = 15;
const MAX_TARGET_ATTEMPTS = 50;

let random: () => number = Math.random;

export const setPointOfHueRandomForTesting = (next: () => number): void => {
  random = next;
};

const between = ({ min, max }: { min: number; max: number }): number => min + random() * (max - min);

const randomTarget = (): string => hslToHex(random() * 360, between(SATURATION), between(LIGHTNESS));

// With up to 60 rounds the space can get crowded, so after MAX_TARGET_ATTEMPTS the most distinct
// candidate seen is used rather than looping forever.
export const drawTargets = (count: number): string[] => {
  const targets: string[] = [];
  while (targets.length < count) {
    let best = randomTarget();
    let bestSeparation = -1;
    for (let attempt = 0; attempt < MAX_TARGET_ATTEMPTS; attempt += 1) {
      const candidate = attempt === 0 ? best : randomTarget();
      const separation = Math.min(Infinity, ...targets.map((target) => hexDeltaE(target, candidate)));
      if (separation > bestSeparation) {
        best = candidate;
        bestSeparation = separation;
      }
      if (separation >= MIN_TARGET_SEPARATION) break;
    }
    targets.push(best);
  }
  return targets;
};

export const pointOfHueGame: GameDefinition<PointOfHueState, PointOfHueSettings> = {
  id: POINT_OF_HUE_GAME_ID,
  createInitialState: ({ participants, settings, now }) => ({
    config: {
      viewMs: settings.viewSeconds * 1000,
      guessMs: settings.guessSeconds * 1000,
      revealMs: settings.revealSeconds * 1000,
      endWhenAllAnswered: settings.endWhenAllAnswered,
    },
    targets: drawTargets(settings.rounds),
    index: 0,
    phase: 'countdown',
    phaseEndsAt: addMs(now, COUNTDOWN_MS),
    pausedRemainingMs: null,
    paused: false,
    autoPaused: false,
    timerSeq: 0,
    roster: participants.map(({ id }) => id),
    lockIns: {},
    drafts: {},
    results: [],
    totals: Object.fromEntries(participants.map(({ id }) => [id, 0])),
  }),
  handleAction: handlePointOfHueAction,
  nextTimeout: phaseTimeout,
  publicView: pointOfHuePublicView,
  hostView: pointOfHueHostView,
  privateView: pointOfHuePrivateView,
};
