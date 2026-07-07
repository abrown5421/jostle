import React from 'react';
import { Button } from '@inithium/ui';
import { Friend, User } from '@inithium/types';
import { useDeleteOneFriendMutation } from '@inithium/store';
import { FriendUserRow } from '../components/friend-user-row';
import { FriendsListShell } from '../components/friends-list-shell';
import { useFriendSearch } from '../hooks/use-friend-search';

const resolveOther = (friend: Friend, userId: string): User =>
  friend.requester._id === userId ? friend.recipient : friend.requester;

const formatSince = (dateAccepted?: string): string =>
  dateAccepted
    ? `Friends since ${new Date(dateAccepted).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })}`
    : '';

interface ManageFriendsViewProps {
  activeUser: User;
  friends: readonly Friend[];
}

export const ManageFriendsView: React.FC<ManageFriendsViewProps> = ({ activeUser, friends }) => {
  const [deleteFriend] = useDeleteOneFriendMutation();

  const accepted = friends.filter((f) => f.status === 'accepted');

  const { query, setQuery, page, setPage, paginated, totalItems, pageSize } = useFriendSearch(
    accepted,
    (f, q) => {
      const other = resolveOther(f, activeUser._id);
      return `${other.first_name} ${other.last_name}`.toLowerCase().includes(q);
    },
  );

  return (
    <FriendsListShell
      query={query}
      onQueryChange={setQuery}
      placeholder="Search friends..."
      totalItems={totalItems}
      pageSize={pageSize}
      currentPage={page}
      onPageChange={setPage}
      isEmpty={paginated.length === 0}
      emptyMessage={query ? 'No friends match your search.' : 'No friends yet.'}
    >
      {paginated.map((friend) => {
        const other = resolveOther(friend, activeUser._id);
        return (
          <FriendUserRow
            linkable
            key={friend._id}
            user={other}
            meta={formatSince(friend.date_accepted)}
            actions={
              <Button
                variant="ghost"
                color="danger"
                size="sm"
                icon="UserMinus"
                aria-label={`Unfriend ${other.first_name} ${other.last_name}`}
                onClick={() => deleteFriend(friend._id)}
              />
            }
          />
        );
      })}
    </FriendsListShell>
  );
};