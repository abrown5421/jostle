import type { GameDefinition } from '../../contracts/game-definition.contract';
import { GameSessionError } from '../../service/session.errors';
import { phaseTimeout } from '../shared';
import { handleFishbowlAction } from './fishbowl.reducer';
import type { FishbowlSettings, FishbowlState } from './fishbowl.types';
import { FISHBOWL_GAME_ID } from './fishbowl.types';
import { fishbowlPrivateView, fishbowlPublicView } from './fishbowl.views';
import { fishbowlRandom } from './random';
import { assignTeams } from './teams';

export const MIN_PLAYERS_PER_TEAM = 2;

export const fishbowlGame: GameDefinition<FishbowlState, FishbowlSettings> = {
  id: FISHBOWL_GAME_ID,
  // Every team needs a presenter and at least one guesser.
  validateSettings: ({ participants, settings }) => {
    const needed = settings.teamCount * MIN_PLAYERS_PER_TEAM;
    if (participants.length < needed) {
      throw new GameSessionError(
        'INVALID_SETTINGS',
        `${settings.teamCount} teams need at least ${needed} players - lower Teams or wait for more players`,
      );
    }
  },
  createInitialState: ({ participants, settings }) => {
    const teams = assignTeams(
      participants.map(({ id }) => id),
      settings.teamCount,
      fishbowlRandom,
    );
    return {
      config: { cluesPerPlayer: settings.cluesPerPlayer, turnMs: settings.turnSeconds * 1000, allowSkipping: settings.allowSkipping },
      teams,
      clues: {},
      clueSeq: 0,
      round: 1,
      bowl: [],
      phase: 'setup',
      activeTeamIndex: 0,
      presenterId: null,
      turnGuessed: [],
      pauseCause: null,
      scores: Object.fromEntries(teams.map((team) => [team.id, [0, 0, 0] as const])),
      lastTurn: null,
      roundJustStarted: false,
      phaseEndsAt: null,
      pausedRemainingMs: null,
      paused: false,
      autoPaused: false,
      timerSeq: 0,
    };
  },
  handleAction: handleFishbowlAction,
  nextTimeout: phaseTimeout,
  publicView: fishbowlPublicView,
  privateView: fishbowlPrivateView,
};
