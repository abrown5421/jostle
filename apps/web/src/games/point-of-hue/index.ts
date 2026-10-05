import type { WebGameModule } from '../registry';
import { HostStage } from './HostStage';
import { PlayerController } from './PlayerController';

const pointOfHueModule: WebGameModule = {
  id: 'point-of-hue',
  HostStage,
  PlayerController,
};

export default pointOfHueModule;
