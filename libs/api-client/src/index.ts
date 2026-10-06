export { baseApi } from './baseApi';
export {
  pageApi,
  useGetPageByRouteQuery,
  useGetNavPagesQuery,
  useListPagesQuery,
  useUpdatePageMutation,
} from './endpoints/page.endpoints';
export type { PageSearchField, ListPagesParams, ListPagesResult, UpdatePageInput } from './endpoints/page.endpoints';
export { usePageParams } from './usePageParams';
export { authApi, useGetMeQuery, useLoginMutation, useRegisterMutation } from './endpoints/auth.endpoints';
export type { AuthUser, LoginCredentials, RegisterInput, AuthResponse } from './endpoints/auth.endpoints';
export { ACCESS_TOKEN_STORAGE_KEY, getStoredAccessToken, setStoredAccessToken } from './tokenStorage';

export { presenceApi, useGetUserPresenceQuery } from './endpoints/presence.endpoints';
export { usePresence } from './realtime/usePresence';
export type { UsePresenceOptions } from './realtime/usePresence';
export {
  connectRealtimeClient,
  disconnectRealtimeClient,
  getRealtimeConnectionStatus,
  subscribeToRealtimeStatus,
  subscribeToRealtimeChannel,
  setPresenceStatus,
} from './realtime/realtimeClientStore';
export type { RealtimeConnectionStatus } from './realtime/realtimeClientStore';
export { useRealtimeConnectionStatus } from './realtime/useRealtimeConnectionStatus';
export type { PresenceStatus, PresenceRecord } from '@inithium/realtime';

export {
  gameSessionsApi,
  useHostGameSessionMutation,
  useJoinGameSessionMutation,
  useGetMyHostedSessionQuery,
  useEndMyHostedSessionMutation,
  getGameSessionError,
} from './endpoints/gameSessions.endpoints';
export type { JoinGameSessionInput } from './endpoints/gameSessions.endpoints';
export {
  connectGameSession,
  disconnectGameSession,
  retainGameSession,
  sendGameSessionMessage,
  getGameSessionState,
  getGameSessionServerNow,
  subscribeToGameSessionState,
  subscribeToGameSessionEvents,
} from './gameSession/gameSessionClientStore';
export type {
  GameSessionClientState,
  GameSessionConnectionStatus,
  GameSessionCloseReason,
} from './gameSession/gameSessionClientStore';
export { useGameSession } from './gameSession/useGameSession';
export { getPlayerCredential, savePlayerCredential, clearPlayerCredential } from './gameSession/playerCredentials';
export type { PlayerCredential } from './gameSession/playerCredentials';
export type {
  SessionSnapshot,
  SessionParticipant,
  SessionRole,
  SessionStatus,
  SessionGameSelection,
  HostedSession,
} from '@inithium/game-session';

export { gamesApi, useListGamesQuery, useGetGameQuery } from './endpoints/games.endpoints';
export type { GameCatalogueItem, GameRequirementBlocker } from './endpoints/games.endpoints';
export type {
  GameSettingDefinition,
  GameSettingValue,
  GameSettingValues,
  GameSettingSelectOption,
  GameRule,
} from '@inithium/db';

export {
  notificationsApi,
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from './endpoints/notifications.endpoints';
export { useNotificationCenter } from './notifications/useNotificationCenter';
export type { UseNotificationCenterOptions, UseNotificationCenterResult } from './notifications/useNotificationCenter';
export type { NotificationEntity } from '@inithium/notifications';

export {
  usersApi,
  useListUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateUserPermissionsMutation,
  useTransferOwnershipMutation,
  useGetUserRegistrationsOverTimeQuery,
} from './endpoints/users.endpoints';
export type {
  AdminUser,
  UserSearchField,
  ListUsersParams,
  ListUsersResult,
  CreateUserInput,
  UpdateUserInput,
  UpdateUserPermissionsInput,
  UserRegistrationCount,
} from './endpoints/users.endpoints';

export {
  settingsApi,
  useListSettingsQuery,
  useUpsertSettingMutation,
  useGetPublicSettingQuery,
  useAppName,
  useShowPersistentNotificationCenter,
  useIsProfileEnabled,
  useIsDarkModeFeatureEnabled,
  useCustomBrandColors,
  SETTING_TYPES,
} from './endpoints/settings.endpoints';
export type {
  SettingType,
  SettingEntity,
  UpsertSettingInput,
  CustomBrandColorSettings,
} from './endpoints/settings.endpoints';

export {
  profileApi,
  useGetProfileQuery,
  useUpdateMyProfileMutation,
  useVerifyCurrentPasswordMutation,
  useChangePasswordMutation,
  useToggleDarkModeMutation,
} from './endpoints/profile.endpoints';
export type { ProfileDto, UpdateMyProfileInput, ChangePasswordInput } from './endpoints/profile.endpoints';

export {
  integrationsApi,
  useListIntegrationsQuery,
  useStartIntegrationAuthorizationMutation,
  useDisconnectIntegrationMutation,
  useLazyGetIntegrationAccessTokenQuery,
  useListIntegrationResourcesQuery,
} from './endpoints/integrations.endpoints';
export type {
  IntegrationStatus,
  IntegrationCallbackResult,
  IntegrationConnection,
  IntegrationCatalogEntry,
  IntegrationAccessToken,
  StartIntegrationAuthorizationInput,
  IntegrationResource,
  ListIntegrationResourcesInput,
} from './endpoints/integrations.endpoints';

// inithium:block:friends:exports:start
export {
  friendsApi,
  useListMyFriendsQuery,
  useListFriendCandidatesQuery,
  useListUserFriendsQuery,
  useGetFriendStatusQuery,
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useDeleteFriendRequestMutation,
  useMarkFriendRequestsSeenMutation,
} from './endpoints/friends.endpoints';
export type {
  FriendStatus,
  FriendDirection,
  FriendUserSummary,
  FriendListEntry,
  FriendOfUserEntry,
  FriendStatusResult,
  ListFriendsParams,
  ListFriendsResult,
  ListFriendCandidatesParams,
  ListFriendCandidatesResult,
  ListUserFriendsParams,
  ListUserFriendsResult,
} from './endpoints/friends.endpoints';

// inithium:block:friends:exports:end
// inithium:anchor:exports
