import React from 'react';
import { Avatar, AvatarFallback, AvatarImage, Box, Text } from '@inithium/ui';
import { User } from '@inithium/types';
import { useNavigation } from '@inithium/router';
import { usePresence } from '@inithium/store';

const getFallback = (user: User) =>
  `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();

interface FriendUserRowProps {
  user: User;
  meta?: string;
  actions?: React.ReactNode;
  linkable?: boolean;
}

export const FriendUserRow: React.FC<FriendUserRowProps> = ({ user, meta, actions, linkable = false }) => {
  const fallback = getFallback(user);
  const { navigate } = useNavigation();
  const status = usePresence(user._id);

  const avatarNode = (
    <Avatar
      src={user.user_avatar?.src}
      alt={user.user_avatar?.alt}
      fallback={fallback}
      size="sm"
      status={status}
      shape="circle"
      background={user.user_avatar?.background}
      fontColor={user.user_avatar?.fontColor}
      className="border-2 border-surface shrink-0"
    >
      {user.user_avatar?.src && <AvatarImage src={user.user_avatar.src} alt={user.user_avatar.alt} />}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );

  return (
    <div
      className={[
        'relative flex items-center gap-3 px-3 py-2.5 rounded-lg',
        'hover:bg-surface2 transition-colors duration-150 group',
        linkable ? 'cursor-pointer' : '',
      ].join(' ')}
      onClick={linkable ? () => navigate(`/profile/${user._id}`) : undefined}
    >
      <div className="shrink-0">
        {avatarNode}
      </div>

      <Box flex direction="col" className="flex-1 min-w-0">
        <Text variant="body2" color="surface-contrast" decoration={{ bold: true }} overrideClassName="text-sm truncate">
          {user.first_name} {user.last_name}
        </Text>
        <Text variant="caption" color="surface4-contrast" overrideClassName="text-xs truncate">
          {user.email}
        </Text>
        {meta && (
          <Text variant="caption" color="primary" overrideClassName="text-xs mt-0.5">
            {meta}
          </Text>
        )}
      </Box>

      {actions && (
        <Box
          flex
          direction="row"
          align="center"
          className="gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </Box>
      )}
    </div>
  );
};  