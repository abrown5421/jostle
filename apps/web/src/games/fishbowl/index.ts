import type { WebGameModule } from '../registry';
import { HostStage } from './HostStage';
import { PlayerController } from './PlayerController';

const fishbowlModule: WebGameModule = {
  id: 'fishbowl',
  HostStage,
  PlayerController,
};

export default fishbowlModule;
