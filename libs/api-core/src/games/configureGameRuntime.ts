import { setGameRequirementEvaluator, setIpodWarMusicSource } from '@inithium/game-session';
import { gameRequirementEvaluator } from './gameRequirements';
import { spotifyMusicSource } from './spotifyMusicSource';

// Plugs the server's real services into @inithium/game-session, which only knows them as ports:
// who meets which host requirements, and where iPod War's music comes from. Called once at boot,
// alongside setGameCatalog.
export const configureGameRuntime = (): void => {
  setGameRequirementEvaluator(gameRequirementEvaluator);
  setIpodWarMusicSource(spotifyMusicSource);
};
