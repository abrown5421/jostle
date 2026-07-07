import { selectActiveUser, selectSettingByKey, useCreateFriendMutation, useDeleteOneFriendMutation, useReadFriendsByUserQuery, useUpdateOneFriendMutation } from '@inithium/store';
import { Box, Button, Text } from '@inithium/ui';
import {
  Mail,
  Phone,
  MapPin,
  Cake,
  type LucideIcon,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { Friend } from '@inithium/types';
import { ProfileFriendsSection } from './profile-friends-section';

const formatDob = (dob?: string): string =>
  dob
    ? new Date(dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

const formatAddress = (address?: {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}): string =>
  address
    ? [
        address.street,
        address.city,
        address.state && address.zip ? `${address.state} ${address.zip}` : address.state || address.zip,
        address.country,
      ].filter(Boolean).join(', ')
    : '';

const formatSince = (dateAccepted?: string): string =>
  dateAccepted
    ? `Friends since ${new Date(dateAccepted).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })}`
    : '';

interface InfoRowProps {
  icon: LucideIcon;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, value }) => (
  <Box flex direction="row" className="items-start gap-2.5 py-1.5">
    <Icon size={14} className="mt-0.5 shrink-0 text-primary" strokeWidth={2} />
    <Text variant="body" color="surface-contrast" overrideClassName="text-sm leading-snug break-all">
      {value}
    </Text>
  </Box>
);

const InfoGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box flex direction="col" className="gap-0.5 py-3 first:pt-0 last:pb-0 last:border-none border-b border-slate-300">
    {children}
  </Box>
);

interface FriendshipBlockProps {
  profileUserId: string;
  activeUserId: string;
  activeFriends: readonly Friend[];
}

const FriendshipBlock: React.FC<FriendshipBlockProps> = ({ profileUserId, activeUserId, activeFriends }) => {
  const [createFriend, { isLoading: isAdding }] = useCreateFriendMutation();
  const [updateFriend] = useUpdateOneFriendMutation();
  const [deleteFriend] = useDeleteOneFriendMutation();

  const relationship = activeFriends.find((f) => {
    const reqId = typeof f.requester === 'string' ? f.requester : f.requester._id;
    const recId = typeof f.recipient === 'string' ? f.recipient : f.recipient._id;
    return (reqId === profileUserId || recId === profileUserId);
  }) ?? null;

  const isFriends = relationship?.status === 'accepted';
  const isPending = relationship?.status === 'pending';
  const isSentByMe = isPending && (
    typeof relationship!.requester === 'string'
      ? relationship!.requester === activeUserId
      : relationship!.requester._id === activeUserId
  );

  const handleAdd = () =>
    createFriend({ requester: activeUserId, recipient: profileUserId, action_user: activeUserId });

  const handleAccept = () =>
    updateFriend({ id: relationship!._id, data: { status: 'accepted', action_user: activeUserId } });

  const handleDelete = () =>
    deleteFriend(relationship!._id);

  return (
    <Box flex direction="col" className="py-3 border-b border-slate-300 gap-2">
      {isFriends && (
        <>
          <Text variant="caption" color="primary" overrideClassName="text-xs font-medium">
            {formatSince(relationship!.date_accepted)}
          </Text>
          <Button
            color="danger"
            size="sm"
            leadingIcon="UserMinus"
            onClick={handleDelete}
          >
            Remove Friend
          </Button>
        </>
      )}

      {isPending && isSentByMe && (
        <>
          <Text variant="caption" color="surface4-contrast" overrideClassName="text-xs opacity-70">
            Friend request sent
          </Text>
          <Button
            color="danger"
            size="sm"
            leadingIcon="X"
            onClick={handleDelete}
          >
            Cancel Request
          </Button>
        </>
      )}

      {isPending && !isSentByMe && (
        <>
          <Text variant="caption" color="surface4-contrast" overrideClassName="text-xs opacity-70">
            Wants to be your friend
          </Text>
          <Box flex direction="row" className="gap-2">
            <Button
              color="success"
              size="sm"
              leadingIcon="Check"
              onClick={handleAccept}
              className="flex flex-1"
            >
              Accept
            </Button>
            <Button
              color="danger"
              size="sm"
              leadingIcon="X"
              onClick={handleDelete}
              className="flex flex-1"
            >
              Decline
            </Button>
          </Box>
        </>
      )}

      {!relationship && (
        <Button
          variant="solid"
          color="primary"
          size="sm"
          leadingIcon="UserPlus"
          onClick={handleAdd}
          disabled={isAdding}
        >
          Add Friend
        </Button>
      )}
    </Box>
  );
};

interface ProfileInfoSectionProps {
  profileUser: any;
  friends?: Friend[] | null;
  isFriendModuleActive: boolean;
  isOwnProfile: boolean;
}

export const ProfileInfoSection: React.FC<ProfileInfoSectionProps> = ({
  profileUser,
  friends,
  isFriendModuleActive,
  isOwnProfile,
}) => {
  if (!profileUser) return null;

  const activeUser = useSelector(selectActiveUser);
  const showAddress = useSelector(selectSettingByKey('profile-info-address'))?.value ?? true;
  const showPhone   = useSelector(selectSettingByKey('profile-info-phone'))?.value ?? true;
  const showDob     = useSelector(selectSettingByKey('profile-info-dob'))?.value ?? true;
  const showBio     = useSelector(selectSettingByKey('profile-info-bio'))?.value ?? true;

  const { data: activeFriends = [] } = useReadFriendsByUserQuery(activeUser?._id ?? '', {
    skip: !activeUser || isOwnProfile,
  });

  const address = showAddress ? formatAddress(profileUser.address) : '';
  const dob     = showDob     ? formatDob(profileUser.dob)         : '';

  const hasContact  = profileUser.email || (showPhone && profileUser.phone_number);
  const hasPersonal = dob || address;

  return (
    <Box flex direction="col" className="mt-1">
      {showBio && profileUser.bio && (
        <Box className="py-3 border-b border-t border-slate-300">
          <Text variant="body" color="surface-contrast" overrideClassName="text-sm leading-relaxed">
            {profileUser.bio}
          </Text>
        </Box>
      )}

      {isFriendModuleActive && !isOwnProfile && activeUser && (
        <FriendshipBlock
          profileUserId={profileUser._id}
          activeUserId={activeUser._id}
          activeFriends={activeFriends as Friend[]}
        />
      )}

      <ProfileFriendsSection
        friends={friends ?? []}
        viewingUserId={profileUser._id}
        enabled={isFriendModuleActive}
      />

      {hasContact && (
        <InfoGroup>
          {profileUser.email && <InfoRow icon={Mail} value={profileUser.email} />}
          {showPhone && profileUser.phone_number && <InfoRow icon={Phone} value={profileUser.phone_number} />}
        </InfoGroup>
      )}

      {hasPersonal && (
        <InfoGroup>
          {dob     && <InfoRow icon={Cake}   value={dob}     />}
          {address && <InfoRow icon={MapPin} value={address} />}
        </InfoGroup>
      )}
    </Box>
  );
};