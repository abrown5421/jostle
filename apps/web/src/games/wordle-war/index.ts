import type { WebGameModule } from '../registry';
import { HostStage } from './HostStage';
import { PlayerController } from './PlayerController';

const wordleWarModule: WebGameModule = {
  id: 'wordle-war',
  HostStage,
  PlayerController,
};

export default wordleWarModule;
