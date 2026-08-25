import { getSessionById, getSessionConfiguration, listSessionPlayers, updateSessionStatus } from '@jostle/game-sessions';
import { getGameById } from '@jostle/games';
import { findUserIntegration } from '@jostle/integrations';
import { publishTopic, sessionStatusTopic } from '@jostle/messaging';
import type { PubSub } from '@jostle/messaging';
import { buildSongBank } from '../song-bank/index.js';
import { createIpodWarState, getIpodWarStateDocument, toPublicIpodWarState } from '../db/index.js';
import {
  GameNotConfiguredError,
  HostSpotifyNotConnectedError,
  NotEnoughPlayersError,
  SessionNotInLobbyError,
  SPOTIFY_PROVIDER_ID,
} from '../model/index.js';
import type { IpodWarConfig, PublicIpodWarState } from '../model/index.js';
import { startRound } from './round-lifecycle.js';

const IPOD_WAR_GAME_ID = 'ipod-war';
const DEFAULT_CONFIG: IpodWarConfig = {
  songCount: 60,
  clipDurationSeconds: 60,
  guessArtist: true,
  guessAlbum: false,
  difficulty: 5,
  selectedPlaylistId: '',
};

function parseIpodWarConfig(
  selectedSettings: Readonly<Record<string, string | number | boolean>>,
): IpodWarConfig {
  return {
    songCount:
      typeof selectedSettings.songCount === 'number'
        ? selectedSettings.songCount
        : DEFAULT_CONFIG.songCount,
    clipDurationSeconds:
      typeof selectedSettings.clipDurationSeconds === 'number'
        ? selectedSettings.clipDurationSeconds
        : DEFAULT_CONFIG.clipDurationSeconds,
    guessArtist:
      typeof selectedSettings.guessArtist === 'boolean'
        ? selectedSettings.guessArtist
        : DEFAULT_CONFIG.guessArtist,
    guessAlbum:
      typeof selectedSettings.guessAlbum === 'boolean'
        ? selectedSettings.guessAlbum
        : DEFAULT_CONFIG.guessAlbum,
    difficulty:
      typeof selectedSettings.difficulty === 'number'
        ? selectedSettings.difficulty
        : DEFAULT_CONFIG.difficulty,
    selectedPlaylistId:
      typeof selectedSettings.selectedPlaylistId === 'string'
        ? selectedSettings.selectedPlaylistId
        : DEFAULT_CONFIG.selectedPlaylistId,
  };
}

export interface StartGameInput {
  readonly pubsub: PubSub;
  readonly sessionId: string;
}

export async function startGame(input: StartGameInput): Promise<PublicIpodWarState> {
  const { pubsub, sessionId } = input;

  const session = await getSessionById(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);
  if (session.status !== 'lobby') throw new SessionNotInLobbyError();

  const configuration = await getSessionConfiguration(sessionId);
  if (!configuration || configuration.gameId !== IPOD_WAR_GAME_ID) {
    throw new GameNotConfiguredError();
  }

  const game = await getGameById(IPOD_WAR_GAME_ID);
  const players = await listSessionPlayers(sessionId);
  const minPlayers = game?.minPlayers ?? 2;
  if (players.length < minPlayers) throw new NotEnoughPlayersError(minPlayers);

  const hostIntegration = await findUserIntegration(session.hostUserId, SPOTIFY_PROVIDER_ID);
  if (!hostIntegration) throw new HostSpotifyNotConnectedError();

  const config = parseIpodWarConfig(configuration.selectedSettings);
  const songBank = await buildSongBank({ sessionId, config });

  await createIpodWarState({ sessionId, config, songBank });
  await updateSessionStatus(sessionId, 'active');
  await publishTopic(pubsub, sessionStatusTopic, {
    params: { sessionId },
    payload: { sessionId, status: 'active' },
  });

  await startRound(pubsub, sessionId, 0);

  const finalState = await getIpodWarStateDocument(sessionId);
  if (!finalState) throw new GameNotConfiguredError();
  return toPublicIpodWarState(finalState);
}
