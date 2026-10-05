import mongoose from 'mongoose';
import { DbProvider, DbConfig } from '../../contracts/db-provider.contract';
import { UserRepository } from '../../contracts/user.contract';
import { PageRepository } from '../../contracts/page.contract';
import { NotificationRepository } from '../../contracts/notification.contract';
import { SettingsRepository } from '../../contracts/settings.contract';
import { GameRepository } from '../../contracts/game.contract';
import { IntegrationRepository } from '../../contracts/integration.contract';
import { createMongoUserRepository } from './user.repository';
import { createMongoPageRepository } from './page.repository';
import { createMongoNotificationRepository } from './notification.repository';
import { createMongoSettingsRepository } from './settings.repository';
import { createMongoGameRepository } from './game.repository';
import { createMongoIntegrationRepository } from './integration.repository';
import { UserModel } from './models/userModel';
import { PageModel } from '../../schemas/page.schema';
import { NotificationModel } from '../../schemas/notification.schema';
import { SettingsModel } from '../../schemas/settings.schema';
import { GameModel } from '../../schemas/game.schema';
import { IntegrationModel } from '../../schemas/integration.schema';
// inithium:block:friends:imports:start
import { FriendRepository } from '../../contracts/friend.contract';
import { createMongoFriendRepository } from './friend.repository';
import { FriendModel } from '../../schemas/friend.schema';
// inithium:block:friends:imports:end
// inithium:anchor:imports

const userRepository = createMongoUserRepository(UserModel);
const pageRepository = createMongoPageRepository(PageModel);
const notificationRepository = createMongoNotificationRepository(NotificationModel);
const settingsRepository = createMongoSettingsRepository(SettingsModel);
const gameRepository = createMongoGameRepository(GameModel);
const integrationRepository = createMongoIntegrationRepository(IntegrationModel);
// inithium:block:friends:repository-instances:start
const friendRepository = createMongoFriendRepository(FriendModel);
// inithium:block:friends:repository-instances:end
// inithium:anchor:repository-instances

export const mongoProvider: DbProvider = {
  name: 'MongoDB',
  connect: async (config: DbConfig) => {
    if (!config.uri) {
      throw new Error('MongoDB URI is required in DbConfig');
    }
    if (mongoose.connection.readyState >= 1) {
      return;
    }
    await mongoose.connect(config.uri);
  },
  disconnect: async () => {
    await mongoose.disconnect();
  },
  getUserRepository: (): UserRepository => userRepository,
  getPageRepository: (): PageRepository => pageRepository,
  getNotificationRepository: (): NotificationRepository => notificationRepository,
  getSettingRepository: (): SettingsRepository => settingsRepository,
  getGameRepository: (): GameRepository => gameRepository,
  getIntegrationRepository: (): IntegrationRepository => integrationRepository,
// inithium:block:friends:members:start
  getFriendRepository: (): FriendRepository => friendRepository,
// inithium:block:friends:members:end
  // inithium:anchor:members
};
