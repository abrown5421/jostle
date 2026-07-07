import React from 'react';
import { Button } from '@inithium/ui';
import { Friend, User } from '@inithium/types';
import { useUpdateOneFriendMutation, useDeleteOneFriendMutation } from '@inithium/store';
import { FriendUserRow } from '../components/friend-user-row';
import { FriendsListShell } from '../components/friends-list-shell';
import { useFriendSearch } from '../hooks/use-friend-search';

const resolveOther = (friend: Friend, userId: string): User =>
  friend.requester._id === userId ? friend.recipient : friend.requester;

const formatRequestMeta = (friend: Friend, activeUserId: string): string => {
  const isSent = friend.requester._id === activeUserId;
  const date = new Date(friend.date_sent).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (isSent) {
    const recipientName = `${friend.recipient.first_name} ${friend.recipient.last_name}`;
    return `You requested to be friends with ${recipientName} on ${date}`;
  }

  const requesterName = `${friend.requester.first_name} ${friend.requester.last_name}`;
  return `${requesterName} requested to be friends on ${date}`;
};

interface PendingRequestsViewProps {
  activeUser: User;
  friends: readonly Friend[];
}

export const PendingRequestsView: React.FC<PendingRequestsViewProps> = ({ activeUser, friends }) => {
  const [updateFriend] = useUpdateOneFriendMutation();
  const [deleteFriend] = useDeleteOneFriendMutation();

  const pending = friends.filter((f) => f.status === 'pending');

  const { query, setQuery, page, setPage, paginated, totalItems, pageSize } = useFriendSearch(
    pending,
    (f, q) => {
      const other = resolveOther(f, activeUser._id);
      return `${other.first_name} ${other.last_name}`.toLowerCase().includes(q);
    },
  );

  const handleAccept = (friend: Friend) =>
    updateFriend({ id: friend._id, data: { status: 'accepted', action_user: activeUser._id } });

  const handleDelete = (friend: Friend) =>
    deleteFriend(friend._id);

  return (
    <FriendsListShell
      query={query}
      onQueryChange={setQuery}
      placeholder="Search pending requests..."
      totalItems={totalItems}
      pageSize={pageSize}
      currentPage={page}
      onPageChange={setPage}
      isEmpty={paginated.length === 0}
      emptyMessage={query ? 'No pending requests match your search.' : 'No pending friend requests.'}
    >
      {paginated.map((friend) => {
        const other = resolveOther(friend, activeUser._id);
        const isSent = friend.requester._id === activeUser._id;

        return (
          <FriendUserRow
            linkable
            key={friend._id}
            user={other}
            meta={formatRequestMeta(friend, activeUser._id)}
            actions={
              isSent ? (
                <Button
                  variant="ghost"
                  color="danger"
                  size="sm"
                  icon="X"
                  aria-label="Cancel request"
                  onClick={() => handleDelete(friend)}
                />
              ) : (
                <>
                  <Button
                    variant="ghost"
                    color="success"
                    size="sm"
                    icon="Check"
                    aria-label="Accept request"
                    onClick={() => handleAccept(friend)}
                  />
                  <Button
                    variant="ghost"
                    color="danger"
                    size="sm"
                    icon="X"
                    aria-label="Decline request"
                    onClick={() => handleDelete(friend)}
                  />
                </>
              )
            }
          />
        );
      })}
    </FriendsListShell>
  );
};