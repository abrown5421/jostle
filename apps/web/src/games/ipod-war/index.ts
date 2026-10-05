import type { WebGameModule } from '../registry';
import { HostStage } from './HostStage';
import { PlayerController } from './PlayerController';
import { useIpodWarHostSetup } from './useIpodWarHostSetup';

const ipodWarModule: WebGameModule = {
  id: 'ipod-war',
  HostStage,
  PlayerController,
  useHostSetup: useIpodWarHostSetup,
};

export default ipodWarModule;
