import { setGameRequirementEvaluator, setIpodWarMusicSource, setWordleWarDictionarySource } from '@inithium/game-session';
import { datamuseDictionarySource } from './datamuseDictionarySource';
import { gameRequirementEvaluator } from './gameRequirements';
import { spotifyMusicSource } from './spotifyMusicSource';

// Plugs the server's real services into @inithium/game-session, which only knows them as ports:
// who meets which host requirements, where iPod War's music comes from, and where Wordle War's
// words come from. Called once at boot,
// alongside setGameCatalog.
export const configureGameRuntime = (): void => {
  setGameRequirementEvaluator(gameRequirementEvaluator);
  setIpodWarMusicSource(spotifyMusicSource);
  setWordleWarDictionarySource(datamuseDictionarySource);
};
