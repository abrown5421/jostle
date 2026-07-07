import React from 'react';
import { Box } from '../../components';
import { Avatar, AvatarImage, AvatarFallback } from '../avatar';
import { UserSlotProps } from './navbar.types';
import { usePresence, useReadFriendsByUserQuery } from '@inithium/store';
import type { Friend } from '@inithium/types';

const usePendingFriendRequestCount = (userId?: string): number => {
  const { data: friends } = useReadFriendsByUserQuery(userId ?? '', { skip: !userId });

  if (!friends) return 0;

  return (friends as Friend[]).filter(
    (friend) => friend.status === 'pending' && friend.recipient._id === userId,
  ).length;
};

const NotificationBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count <= 0) return null;

  return (
    <span
      className="absolute -top-1 -right-1 z-10 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-semibold bg-[var(--color-danger)] text-[var(--color-danger-contrast)]"
      aria-label={`${count} pending friend requests`}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
};

const UserSlot: React.FC<UserSlotProps> = ({ activeUser, onAvatarClick }) => {
  const status = usePresence(activeUser?._id);
  const pendingCount = usePendingFriendRequestCount(activeUser?._id);

  const renderAvatar = (avatar: NonNullable<NonNullable<typeof activeUser>['user_avatar']>) => (
    <div className="relative inline-flex">
      <Avatar
        src={avatar.src}
        alt={avatar.alt}
        fallback={avatar.fallback}
        size={avatar.size}
        status={status}
        shape={avatar.shape}
        background={avatar.background}
        fontColor={avatar.fontColor}
        onClick={onAvatarClick}
      >
        {avatar.src && <AvatarImage src={avatar.src} alt={avatar.alt} />}
        <AvatarFallback>{avatar.fallback || '??'}</AvatarFallback>
      </Avatar>
      <NotificationBadge count={pendingCount} />
    </div>
  );

  if (!activeUser || !activeUser.user_avatar) {
    return (
      <Box flex align="center" padding="sm" className="h-[56px] w-full">
        <div className="relative inline-flex">
          <Avatar size="md" shape="circle" status={status} onClick={onAvatarClick}>
            <AvatarFallback>??</AvatarFallback>
          </Avatar>
          <NotificationBadge count={pendingCount} />
        </div>
      </Box>
    );
  }

  return (
    <Box flex align="center" padding="sm" className="h-[56px] w-full">
      {renderAvatar(activeUser.user_avatar)}
    </Box>
  );
};

export default UserSlot;