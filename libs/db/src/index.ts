import { DbProvider, DbConfig } from './contracts/db-provider.contract';
import { CreatePageInput, FindManyPagesOptions, NavLocation, UpdatePageInput } from './contracts/page.contract';
import { CreateUserInput, FindManyUsersOptions, UpdateUserInput } from './contracts/user.contract';
import { UpsertSettingInput } from './contracts/settings.contract';
import { CreateGameInput, UpdateGameInput } from './contracts/game.contract';
import {
  IntegrationStatus,
  UpdateIntegrationCredentialsInput,
  UpsertIntegrationInput,
} from './contracts/integration.contract';
// inithium:block:friends:imports:start
import { CreateFriendRequestInput, FriendStatus } from './contracts/friend.contract';
// inithium:block:friends:imports:end
// inithium:anchor:imports
import { activeProvider as defaultProvider } from './providers/active-provider';

let activeProvider: DbProvider = defaultProvider;

export const setDbProvider = (provider: DbProvider): void => {
  activeProvider = provider;
};

export const getDbProvider = (): DbProvider => activeProvider;

export const connectDatabase = async (config: DbConfig): Promise<void> => {
  await activeProvider.connect(config);
  console.log(`Successfully connected using [${activeProvider.name}] Database Provider`);
};

export const disconnectDatabase = async (): Promise<void> => {
  await activeProvider.disconnect();
};

export const getUserRepository = () => activeProvider.getUserRepository();
export const listUsers = (options: FindManyUsersOptions) => getUserRepository().findMany(options);
export const createUser = (input: CreateUserInput) => getUserRepository().create(input);
export const updateUser = (id: string, input: UpdateUserInput) => getUserRepository().update(id, input);
export const deleteUser = (id: string) => getUserRepository().delete(id);
export const getUserRegistrationsByDay = () => getUserRepository().countRegistrationsByDay();
export const countAllUsers = () => getUserRepository().countAll();
export const transferOwnership = (newOwnerId: string) => getUserRepository().transferOwnership(newOwnerId);

export const getPageRepository = () => activeProvider.getPageRepository();
export const findPageByRoutePattern = (routePattern: string) =>
  getPageRepository().findByRoutePattern(routePattern);
export const findPageBySlug = (slug: string) => getPageRepository().findBySlug(slug);
export const findPagesByNavLocation = (location: NavLocation) =>
  getPageRepository().findByNavLocation(location);
export const findPublishedPages = () => getPageRepository().findPublished();
export const findPluginPages = () => getPageRepository().findPluginPages();
export const listPages = (options: FindManyPagesOptions) => getPageRepository().findMany(options);
export const createPage = (input: CreatePageInput) => getPageRepository().create(input);
export const updatePage = (id: string, input: UpdatePageInput) => getPageRepository().update(id, input);
export const deletePage = (id: string) => getPageRepository().delete(id);

export const getNotificationRepository = () => activeProvider.getNotificationRepository();
export const listNotificationsForUser = (userId: string, options?: { limit?: number }) =>
  getNotificationRepository().listForUser(userId, options);
export const countUnreadNotificationsForUser = (userId: string) =>
  getNotificationRepository().countUnreadForUser(userId);
export const markNotificationAsRead = (id: string, userId: string) =>
  getNotificationRepository().markAsRead(id, userId);
export const markAllNotificationsAsReadForUser = (userId: string) =>
  getNotificationRepository().markAllAsReadForUser(userId);
export const deleteNotificationForUser = (id: string, userId: string) =>
  getNotificationRepository().deleteForUser(id, userId);
export const deleteNotificationsByActionUrls = (actionUrls: string[]) =>
  getNotificationRepository().deleteByActionUrls(actionUrls);

export const getSettingsRepository = () => activeProvider.getSettingRepository();
export const listSettings = () => getSettingsRepository().findAll();
// Returns null when nothing has been saved for this key yet - callers fall back to their own
// default, the same merge logic the CMS Settings module itself uses against its definitions.
export const getSetting = (key: string) => getSettingsRepository().findByKey(key);
export const upsertSetting = (input: UpsertSettingInput) => getSettingsRepository().upsert(input);

export const getGameRepository = () => activeProvider.getGameRepository();
export const findGameBySlug = (slug: string) => getGameRepository().findBySlug(slug);
// Catalogue order (order, then title) - unpublished games never reach a player-facing surface.
export const findPublishedGames = () => getGameRepository().findPublished();
export const createGame = (input: CreateGameInput) => getGameRepository().create(input);
export const updateGame = (id: string, input: UpdateGameInput) => getGameRepository().update(id, input);

// Raw persistence only - credentials here are already-encrypted blobs. Everything outside
// @inithium/integrations should go through that library instead (it owns encryption, token
// refresh and the provider registry), the same "one public entry point" split
// @inithium/notifications keeps over its own repository.
export const getIntegrationRepository = () => activeProvider.getIntegrationRepository();
export const findIntegrationForUser = (userId: string, provider: string) =>
  getIntegrationRepository().findForUser(userId, provider);
export const listIntegrationsForUser = (userId: string) => getIntegrationRepository().listForUser(userId);
export const upsertIntegration = (input: UpsertIntegrationInput) => getIntegrationRepository().upsert(input);
export const updateIntegrationCredentials = (
  userId: string,
  provider: string,
  input: UpdateIntegrationCredentialsInput,
) => getIntegrationRepository().updateCredentials(userId, provider, input);
export const updateIntegrationStatus = (userId: string, provider: string, status: IntegrationStatus) =>
  getIntegrationRepository().updateStatus(userId, provider, status);
export const deleteIntegration = (userId: string, provider: string) =>
  getIntegrationRepository().delete(userId, provider);

// inithium:block:friends:repositories:start
export const getFriendRepository = () => activeProvider.getFriendRepository();
export const getFriendById = (id: string) => getFriendRepository().findById(id);
export const findFriendBetweenUsers = (userIdA: string, userIdB: string) =>
  getFriendRepository().findBetweenUsers(userIdA, userIdB);
export const createFriendRequest = (input: CreateFriendRequestInput) => getFriendRepository().create(input);
export const updateFriendStatus = (id: string, status: FriendStatus) =>
  getFriendRepository().updateStatus(id, status);
export const deleteFriend = (id: string) => getFriendRepository().delete(id);
export const markIncomingFriendRequestsSeen = (requesteeId: string) =>
  getFriendRepository().markIncomingRequestsSeen(requesteeId);
export const listAcceptedFriendsForUser = (userId: string) => getFriendRepository().listAcceptedForUser(userId);
export const listPendingFriendsForUser = (userId: string) => getFriendRepository().listPendingForUser(userId);
export const listRelatedFriendUserIds = (userId: string) => getFriendRepository().listRelatedUserIds(userId);

// inithium:block:friends:repositories:end
// inithium:anchor:repositories

export type { DbProvider, DbConfig } from './contracts/db-provider.contract';
export type { PaginatedResult } from './contracts/pagination.contract';
export type {
  UserRepository,
  UserEntity,
  CreateUserInput,
  UpdateUserInput,
  UserSearchField,
  FindManyUsersOptions,
  UserRegistrationCount,
  Role,
  CapabilityOverrides,
} from './contracts/user.contract';
export { CORE_ROLES, AVATAR_VARIANTS, AVATAR_SHAPES, DEFAULT_AVATAR_CONFIG } from './contracts/user.contract';
export type {
  AvatarVariant,
  AvatarShape,
  AvatarColor,
  AvatarStyleConfig,
  AvatarDicebearConfig,
  AvatarConfig,
  UserProfileBannerConfig,
} from './contracts/user.contract';
export { NAV_LOCATIONS, PAGE_LAYOUT_TEMPLATES } from './contracts/page.contract';
export type {
  PageEntity,
  CreatePageInput,
  UpdatePageInput,
  PageRepository,
  PageAccessConfig,
  PageAnimationConfig,
  PageColorConfig,
  PageNavigationConfig,
  PageSeoConfig,
  NavLocation,
  PageLayoutTemplate,
  PageSearchField,
  FindManyPagesOptions,
} from './contracts/page.contract';
export type { NotificationEntity, CreateNotificationInput, NotificationRepository } from './contracts/notification.contract';
export { SETTING_TYPES } from './contracts/settings.contract';
export type { SettingType, SettingEntity, UpsertSettingInput, SettingsRepository } from './contracts/settings.contract';
export { GAME_SETTING_TYPES, GAME_REQUIREMENT_KINDS } from './contracts/game.contract';
export type {
  GameSettingType,
  GameSettingDefinition,
  GameSettingSelectOption,
  GameSettingValue,
  GameSettingValues,
  GameRequirement,
  GameRequirementKind,
  IntegrationGameRequirement,
  GameRule,
  GameEntity,
  CreateGameInput,
  UpdateGameInput,
  GameRepository,
} from './contracts/game.contract';
export { INTEGRATION_STATUSES } from './contracts/integration.contract';
export type {
  IntegrationStatus,
  IntegrationEntity,
  UpsertIntegrationInput,
  UpdateIntegrationCredentialsInput,
  IntegrationRepository,
} from './contracts/integration.contract';
// inithium:block:friends:type-exports:start
export type {
  FriendEntity,
  FriendStatus,
  CreateFriendRequestInput,
  FriendRepository,
} from './contracts/friend.contract';
// inithium:block:friends:type-exports:end
// inithium:anchor:type-exports
export { ensureSeededPages } from './page-seeds/ensureSeededPages';
export { pruneOrphanedPluginPages } from './page-seeds/pruneOrphanedPluginPages';
export { ensureSeededSettings } from './settings-seeds/ensureSeededSettings';
export { ensureSeededGames } from './game-seeds/ensureSeededGames';
export { gameSeeds } from './game-seeds/registry';
export { ensureOwnerBootstrap } from './bootstrap/ensureOwnerBootstrap';
export { mongoProvider } from './providers/mongo/mongo.provider';
