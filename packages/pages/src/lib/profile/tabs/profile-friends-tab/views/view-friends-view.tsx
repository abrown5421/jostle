import React from 'react';
import { Friend, User } from '@inithium/types';
import { FriendUserRow } from '../components/friend-user-row';
import { FriendsListShell } from '../components/friends-list-shell';
import { useFriendSearch } from '../hooks/use-friend-search';

const resolveOther = (friend: Friend, userId: string): User =>
  friend.requester._id === userId ? friend.recipient : friend.requester;

interface ViewFriendsViewProps {
  profileUserId: string;
  friends: readonly Friend[];
  mutualFriendsOnly?: boolean;
  activeUserFriendIds?: Set<string>;
}

export const ViewFriendsView: React.FC<ViewFriendsViewProps> = ({
  profileUserId,
  friends,
  mutualFriendsOnly = false,
  activeUserFriendIds = new Set(),
}) => {
  const accepted = friends.filter((f) => {
    if (f.status !== 'accepted') return false;
    if (!mutualFriendsOnly) return true;
    const other = resolveOther(f, profileUserId);
    return activeUserFriendIds.has(other._id);
  });

  const { query, setQuery, page, setPage, paginated, totalItems, pageSize } = useFriendSearch(
    accepted,
    (f, q) => {
      const other = resolveOther(f, profileUserId);
      return `${other.first_name} ${other.last_name}`.toLowerCase().includes(q);
    },
  );

  return (
    <FriendsListShell
      query={query}
      onQueryChange={setQuery}
      placeholder={mutualFriendsOnly ? 'Search mutual friends...' : 'Search friends...'}
      totalItems={totalItems}
      pageSize={pageSize}
      currentPage={page}
      onPageChange={setPage}
      isEmpty={paginated.length === 0}
      emptyMessage={
        query
          ? 'No friends match your search.'
          : mutualFriendsOnly
          ? 'No mutual friends.'
          : 'This user has no friends yet.'
      }
    >
      {paginated.map((friend) => {
        const other = resolveOther(friend, profileUserId);
        return <FriendUserRow
         key={friend._id} user={other} linkable />;
      })}
    </FriendsListShell>
  );
};