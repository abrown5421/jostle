import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { Friend, AvatarProps, ThemeColor } from '@inithium/types';
import { selectActiveUser } from '../features/active-user/active-user-slice';
import { showAlert } from '../features/alert/alert-slice';
import { friendsApi } from '../features/friends/friends-api.js';
import { connectSocket, disconnectSocket } from '../socket/socket-client.js';

const buildAlert = (message: string, severity: ThemeColor, avatar?: AvatarProps) => ({
  message,
  severity,
  avatar,
  closeable: true,
  position: 'bottom-right' as const,
  animation_object: {
    entry: 'fadeInRight' as const,
    exit: 'fadeOutRight' as const,
    entrySpeed: 'fast' as const,
    exitSpeed: 'faster' as const,
  },
});

const transformUserToAvatar = (user: { 
  first_name: string; 
  last_name: string; 
  profile_picture?: string;
  user_avatar?: {
    background?: string;
    fontColor?: string;
    src?: string;
  };
}): AvatarProps => {
  const avatarConfig = user.user_avatar || {};
  
  return {
    src: user.profile_picture || avatarConfig.src,
    alt: `${user.first_name} ${user.last_name}`,
    fallback: `${user.first_name[0]}${user.last_name[0]}`.toUpperCase(),
    size: 'sm',
    shape: 'circle',
    background: avatarConfig.background,
    fontColor: avatarConfig.fontColor,
  };
};

export const useFriendNotifications = (): void => {
  const dispatch = useDispatch();
  const activeUser = useSelector(selectActiveUser);

  useEffect(() => {
    if (!activeUser) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket();
    const channel = `user:${activeUser._id}`;

    const joinChannel = () => socket.emit('channel:join', channel);
    socket.on('connect', joinChannel);
    if (socket.connected) joinChannel();

    const handleFriendRequest = (friend: Friend) => {
      const { requester } = friend;
      const fullName = `${requester.first_name} ${requester.last_name}`;
      
      dispatch(friendsApi.util.invalidateTags([{ type: 'Friend', id: activeUser._id }]));
      dispatch(
        showAlert(
          buildAlert(
            `${fullName} sent you a friend request`, 
            'surface3',
            transformUserToAvatar(requester)
          ),
        ),
      );
    };

    const handleFriendRequestAccepted = (friend: Friend) => {
      const { recipient } = friend;
      const fullName = `${recipient.first_name} ${recipient.last_name}`;

      dispatch(friendsApi.util.invalidateTags([{ type: 'Friend', id: activeUser._id }]));
      dispatch(
        showAlert(
          buildAlert(
            `${fullName} accepted your friend request`, 
            'success',
            transformUserToAvatar(recipient)
          ),
        ),
      );
    };

    socket.on('friend-request', handleFriendRequest);
    socket.on('friend-request-accepted', handleFriendRequestAccepted);

    return () => {
      socket.off('connect', joinChannel);
      socket.off('friend-request', handleFriendRequest);
      socket.off('friend-request-accepted', handleFriendRequestAccepted);
    };
  }, [activeUser, dispatch]);
};