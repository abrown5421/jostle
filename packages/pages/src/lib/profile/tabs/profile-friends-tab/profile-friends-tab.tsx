import React, { useState } from 'react';
import { Box, Text } from '@inithium/ui';
import { Friend, User } from '@inithium/types';
import { useReadFriendsByUserQuery } from '@inithium/store';
import { ProfileTabPanelProps } from '../profile-tab-registry';
import { AddFriendsView } from './views/add-friends-view';
import { ManageFriendsView } from './views/manage-friends-view';
import { PendingRequestsView } from './views/pending-requests-view';
import { ViewFriendsView } from './views/view-friends-view';

type OwnedView = 'add' | 'friends' | 'pending';
type GuestView = 'friends' | 'mutual';

interface SidebarItemProps {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ label, icon, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={[
      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left',
      'transition-all duration-150 cursor-pointer',
      active
        ? 'bg-primary text-primary-contrast'
        : 'text-surface-contrast hover:bg-surface2',
    ].join(' ')}
  >
    <span className="flex-1">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span
        className={[
          'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1',
          'rounded-full text-xs font-semibold',
          active ? 'bg-primary-contrast text-primary' : 'bg-primary text-primary-contrast',
        ].join(' ')}
      >
        {badge}
      </span>
    )}
  </button>
);

const OwnedFriendsTab: React.FC<{ activeUser: User; friends: readonly Friend[] }> = ({
  activeUser,
  friends,
}) => {
  const [view, setView] = useState<OwnedView>('friends');
  const pendingCount = friends.filter((f) => f.status === 'pending' && f.recipient._id === activeUser._id).length;

  const views: { id: OwnedView; label: string; icon: string; badge?: number }[] = [
    { id: 'friends', label: 'My Friends', icon: 'users' },
    { id: 'pending', label: 'Requests', icon: 'user-check', badge: pendingCount },
    { id: 'add', label: 'Add Friends', icon: 'user-plus' },
  ];

  return (
    <Box flex direction="row" className="gap-4 w-full h-full min-h-[400px]">
      <Box flex direction="col" className="w-40 shrink-0 gap-1 pt-1">
        {views.map((v) => (
          <SidebarItem
            key={v.id}
            label={v.label}
            icon={v.icon}
            active={view === v.id}
            onClick={() => setView(v.id)}
            badge={v.badge}
          />
        ))}
      </Box>

      <div className="w-px bg-surface3 shrink-0" />

      <Box flex direction="col" className="flex-1 min-w-0 pt-1">
        <Text variant="h6" color="surface-contrast" overrideClassName="text-sm font-semibold mb-3">
          {views.find((v) => v.id === view)?.label}
        </Text>
        {view === 'friends' && <ManageFriendsView activeUser={activeUser} friends={friends} />}
        {view === 'pending' && <PendingRequestsView activeUser={activeUser} friends={friends} />}
        {view === 'add' && <AddFriendsView activeUser={activeUser} existingFriends={friends} />}
      </Box>
    </Box>
  );
};

const GuestFriendsTab: React.FC<{
  profileUser: any;
  activeUser: User | null;
  friends: readonly Friend[];
}> = ({ profileUser, activeUser, friends }) => {
  const [view, setView] = useState<GuestView>('friends');

  const { data: activeFriends = [] } = useReadFriendsByUserQuery(activeUser?._id ?? '', {
    skip: !activeUser,
  });

  const activeUserFriendIds = new Set(
    (activeFriends as Friend[])
      .filter((f) => f.status === 'accepted')
      .flatMap((f) => [f.requester._id, f.recipient._id])
      .filter((id) => id !== activeUser?._id),
  );

  const views: { id: GuestView; label: string }[] = [
    { id: 'friends', label: 'Friends' },
    { id: 'mutual', label: 'Mutual Friends' },
  ];

  return (
    <Box flex direction="row" className="gap-4 w-full h-full min-h-[400px]">
      <Box flex direction="col" className="w-40 shrink-0 gap-1 pt-1">
        {views.map((v) => (
          <SidebarItem
            key={v.id}
            label={v.label}
            icon={v.id}
            active={view === v.id}
            onClick={() => setView(v.id)}
          />
        ))}
      </Box>

      <div className="w-px bg-surface3 shrink-0" />

      <Box flex direction="col" className="flex-1 min-w-0 pt-1">
        <Text variant="h6" color="surface-contrast" overrideClassName="text-sm font-semibold mb-3">
          {views.find((v) => v.id === view)?.label}
        </Text>
        <ViewFriendsView
          profileUserId={profileUser._id}
          friends={friends}
          mutualFriendsOnly={view === 'mutual'}
          activeUserFriendIds={activeUserFriendIds}
        />
      </Box>
    </Box>
  );
};

export const ProfileFriendsTab: React.FC<ProfileTabPanelProps> = ({ profileUser, activeUser, isOwnProfile }) => {
  const { data: friends = [], isLoading } = useReadFriendsByUserQuery(profileUser._id);

  if (isLoading) {
    return (
      <Box flex direction="row" justify="center" align="center" className="py-12">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </Box>
    );
  }

  return (
    <Box flex direction="col" className="py-4 w-full">
      {isOwnProfile && activeUser ? (
        <OwnedFriendsTab activeUser={activeUser} friends={friends as Friend[]} />
      ) : (
        <GuestFriendsTab profileUser={profileUser} activeUser={activeUser} friends={friends as Friend[]} />
      )}
    </Box>
  );
};