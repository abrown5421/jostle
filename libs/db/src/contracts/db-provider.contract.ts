import { UserRepository } from './user.contract';
import { PageRepository } from './page.contract';
import { NotificationRepository } from './notification.contract';
import { SettingsRepository } from './settings.contract';
import { GameRepository } from './game.contract';
import { IntegrationRepository } from './integration.contract';
// inithium:block:friends:imports:start
import { FriendRepository } from './friend.contract';
// inithium:block:friends:imports:end
// inithium:anchor:imports

export interface DbConfig {
  uri?: string;
  credentials?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DbProvider {
  name: string;
  connect: (config: DbConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  getUserRepository: () => UserRepository;
  getPageRepository: () => PageRepository;
  getNotificationRepository: () => NotificationRepository;
  getSettingRepository: () => SettingsRepository;
  getGameRepository: () => GameRepository;
  getIntegrationRepository: () => IntegrationRepository;
// inithium:block:friends:members:start
  getFriendRepository: () => FriendRepository;
// inithium:block:friends:members:end
  // inithium:anchor:members
}
