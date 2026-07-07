import React from 'react';
import { Avatar, AvatarFallback, AvatarImage, Box, Text } from '@inithium/ui';
import { Friend, User } from '@inithium/types';
import { NavigationLink } from '@inithium/router';

const MAX_VISIBLE = 7;

const resolveOtherUser = (friend: Friend, viewingUserId: string): User =>
  friend.requester._id === viewingUserId ? friend.recipient : friend.requester;

const getFallback = (user: User): string =>
  `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();

interface FriendAvatarStackProps {
  friends: readonly Friend[];
  viewingUserId: string;
}

const FriendAvatarStack: React.FC<FriendAvatarStackProps> = ({ friends, viewingUserId }) => {
  const accepted = friends.filter((f) => f.status === 'accepted');
  const visible = accepted.slice(0, MAX_VISIBLE);
  const overflow = accepted.length - visible.length;

  if (accepted.length === 0) {
    return (
      <Text variant="caption" color="surface4-contrast" overrideClassName="text-xs opacity-60">
        No friends yet.
      </Text>
    );
  }

  return (
    <Box flex direction="row" align="center" className="flex-wrap py-4 border-b border-slate-300">
      <div className="flex flex-row">
        {visible.map((friend, index) => {
          const other = resolveOtherUser(friend, viewingUserId);
          const fallback = getFallback(other);

          return (
            <div
              key={friend._id}
              className="relative"
              style={{ marginLeft: index === 0 ? 0 : '-10px', zIndex: visible.length - index }}
              title={`${other.first_name} ${other.last_name}`}
            >
              <NavigationLink to={`profile/${other._id}`}>
                <Avatar
                    src={other.user_avatar?.src}
                    alt={other.user_avatar?.alt}
                    fallback={fallback}
                    size="sm"
                    shape="circle"
                    background={other.user_avatar?.background}
                    fontColor={other.user_avatar?.fontColor}
                    className="border-2 border-surface"
                >
                    {other.user_avatar?.src && (
                    <AvatarImage src={other.user_avatar.src} alt={other.user_avatar.alt} />
                    )}
                    <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
              </NavigationLink>
            </div>
          );
        })}
      </div>

      {overflow > 0 && (
        <Text
          variant="caption"
          color="surface4-contrast"
          overrideClassName="text-xs ml-2 opacity-70"
        >
          +{overflow} more
        </Text>
      )}

      <Text
        variant="caption"
        color="surface4-contrast"
        overrideClassName="text-xs ml-auto opacity-60"
      >
        {accepted.length} {accepted.length === 1 ? 'friend' : 'friends'}
      </Text>
    </Box>
  );
};

interface ProfileFriendsSectionProps {
  friends: readonly Friend[];
  viewingUserId: string;
  enabled: boolean;
}

export const ProfileFriendsSection: React.FC<ProfileFriendsSectionProps> = ({
  friends,
  viewingUserId,
  enabled,
}) => {
  if (!enabled) return null;

  return (
    <Box flex direction="col" className="w-full">
      <FriendAvatarStack friends={friends} viewingUserId={viewingUserId} />
    </Box>
  );
};