import React from 'react';
import { Button, Loader } from '@inithium/ui';
import { Friend, User } from '@inithium/types';
import { useReadAllUsersQuery, useCreateFriendMutation } from '@inithium/store';
import { FriendUserRow } from '../components/friend-user-row';
import { FriendsListShell } from '../components/friends-list-shell';
import { useFriendSearch } from '../hooks/use-friend-search';

interface AddFriendsViewProps {
  activeUser: User;
  existingFriends: readonly Friend[];
}

export const AddFriendsView: React.FC<AddFriendsViewProps> = ({ activeUser, existingFriends }) => {
  const { data, isLoading } = useReadAllUsersQuery();
  const allUsers = data?.data ?? [];
  const [createFriend, { isLoading: isSending }] = useCreateFriendMutation();

  const friendUserIds = new Set(
    existingFriends.flatMap((f) => [
      typeof f.requester === 'string' ? f.requester : f.requester._id,
      typeof f.recipient === 'string' ? f.recipient : f.recipient._id,
    ]),
  );

  const candidates = (allUsers as User[]).filter(
    (u) => u._id !== activeUser._id && !friendUserIds.has(u._id) && u.email !== 'admin@inithium.com',
  );

  const { query, setQuery, page, setPage, paginated, totalItems, pageSize } = useFriendSearch(
    candidates,
    (u, q) => `${u.first_name} ${u.last_name}`.toLowerCase().includes(q),
  );

  const handleAdd = (recipientId: string) => {
    createFriend({ requester: activeUser._id, recipient: recipientId, action_user: activeUser._id });
  };

  if (isLoading) return <Loader variant="spinner" color="primary" size="md" />;

  return (
    <FriendsListShell
      query={query}
      onQueryChange={setQuery}
      placeholder="Search users to add..."
      totalItems={totalItems}
      pageSize={pageSize}
      currentPage={page}
      onPageChange={setPage}
      isEmpty={paginated.length === 0}
      emptyMessage={query ? 'No users match your search.' : 'No users available to add.'}
    >
      {paginated.map((user) => (
        <FriendUserRow
          linkable
          key={user._id}
          user={user}
          actions={
            <Button
              variant="ghost"
              color="primary"
              size="sm"
              icon="UserPlus"
              aria-label={`Add ${user.first_name} ${user.last_name}`}
              onClick={() => handleAdd(user._id)}
              disabled={isSending}
            />
          }
        />
      ))}
    </FriendsListShell>
  );
};