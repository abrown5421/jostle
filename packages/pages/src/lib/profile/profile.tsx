import { selectActiveUser, selectAllSettings, usePresence, useReadFriendsByUserQuery, useUserQuery } from '@inithium/store';
import { Avatar, AvatarFallback, AvatarImage, Banner, Box, Button, Text } from '@inithium/ui';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { BannerEditDialog } from './banner/banner-edit-dialog';
import { ProfileInfoSection } from './profile-info-section';
import { extractAvatarProps } from './avatar/avatar-utils';
import { AvatarEditDialog } from './avatar/avatar-edit-dialog';
import { ProfileTabs } from './tabs/profile-tabs';
import './tabs/register-profile-tabs'; 
import { Friend, User } from '@inithium/types';

const formatDate = (dateString?: string): string =>
  dateString ? new Date(dateString).toLocaleDateString() : '';

interface ProfileRowProps {
  left: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

const ProfileRow: React.FC<ProfileRowProps> = ({ left, right = null, className = '' }) => (
  <Box className={`flex flex-col sm:flex-row w-auto mx-8 ${className}`}>
    <Box className="flex flex-col flex-1/4 items-center">
      {left}
    </Box>
    <Box className="flex flex-col flex-3/4">
      {right}
    </Box>
  </Box>
);

interface BannerSectionProps {
  profileUser: any;
  isOwnProfile: boolean;
  onEditClick: () => void;
}

const BannerSection: React.FC<BannerSectionProps> = ({ profileUser, isOwnProfile, onEditClick }) => (
  <Box fullWidth className="relative group">
    <Banner
      src={profileUser?.user_banner?.src}
      alt={`${profileUser?.first_name ?? ''} ${profileUser?.last_name ?? ''} banner`}
      height="200px"
      options={profileUser?.user_banner}
    />
    {isOwnProfile && (
      <Box className="absolute bottom-3 right-3 transition-opacity duration-150">
        <Button
          variant="solid"
          color="surface3"
          size="sm"
          icon="Pencil"
          onClick={onEditClick}
          aria-label="Edit Banner"
        />
      </Box>
    )}
  </Box>
);

interface AvatarSectionProps {
  avatar: any;
  status: any;
  isOwnProfile: boolean;
  onEditClick: () => void;
}

const AvatarSection: React.FC<AvatarSectionProps> = ({ avatar, status, isOwnProfile, onEditClick }) => (
  <ProfileRow 
    className="-mt-[96px] relative z-10" 
    left={
      <Box className="relative block group">
        <Avatar
          src={avatar.src}
          alt={avatar.alt}
          fallback={avatar.fallback}
          size="xl"
          status={status}
          shape={avatar.shape}
          background={avatar.background}
          fontColor={avatar.fontColor}
          className="border-8 border-surface"
        >
          {avatar.src && <AvatarImage src={avatar.src} alt={avatar.alt} />}
          <AvatarFallback>{avatar.fallback}</AvatarFallback>
        </Avatar>
        {isOwnProfile && (
          <Box className="absolute bottom-0 right-0 -translate-x-1/4 -translate-y-1/4">
            <Button
              variant="solid"
              color="surface3"
              size="sm"
              icon="Camera"
              onClick={onEditClick}
              aria-label="Edit Avatar"
            />
          </Box>
        )}
      </Box>
    } 
  />
);

interface ProfileIdentityHeaderProps {
  profileUser: any;
}

const ProfileIdentityHeader: React.FC<ProfileIdentityHeaderProps> = ({ profileUser }) => {
  const joined = formatDate(profileUser?.createdAt);
  return (
    <Box flex direction="row" justify="between" align='center' className="py-3 flex-wrap">
      <Text variant="h5" color="primary" overrideClassName='primary-font'>
        {profileUser?.first_name ?? ''} {profileUser?.last_name ?? ''}
      </Text>
      {joined && (
        <Text variant="caption" color="surface4-contrast" overrideClassName="text-xs">
          Joined: {joined}
        </Text>
      )}
    </Box>
  );
};

interface ContentSectionProps {
  profileUser: any;
  isOwnProfile: boolean;
  activeUser: User | null;
  friends?: Friend[] | null;
  isFriendModuleActive: boolean;
}

const ContentSection: React.FC<ContentSectionProps> = ({ 
  profileUser, 
  isOwnProfile, 
  activeUser, 
  friends, 
  isFriendModuleActive 
}) => (
  <ProfileRow
    className="mt-6"
    left={
      <Box flex direction="col" className="w-full">
        <ProfileIdentityHeader profileUser={profileUser} />
        <ProfileInfoSection 
          profileUser={profileUser} 
          friends={friends} 
          isFriendModuleActive={isFriendModuleActive} 
          isOwnProfile={isOwnProfile}
        />
      </Box>
    }
    right={
      <Box className="h-full w-full p-3 md:py-3 md:px-6">
        <ProfileTabs profileUser={profileUser} isOwnProfile={isOwnProfile} activeUser={activeUser} />
      </Box>
    }
  />
);

const UserNotFoundErrorState: React.FC = () => (
  <Box color="surface-contrast" flex direction="col" align="center" padding="xl" className="rounded-xl">
    <Text variant="h5" color="danger" decoration={{ bold: true }}>
      User Not Found
    </Text>
    <Box margin="md">
      <Text variant="body2" color="surface-contrast" overrideClassName="opacity-70 text-center max-w-sm">
        We were unable to locate the specified account. Please verify the User ID and try again.
      </Text>
    </Box>
  </Box>
);

interface ActiveProfileViewProps {
  profileUser: any;
  activeUser: User | null;
  avatar: any;
  status: any;
  isOwnProfile: boolean;
  isAvatarDialogOpen: boolean;
  isBannerDialogOpen: boolean;
  setIsAvatarDialogOpen: (open: boolean) => void;
  setIsBannerDialogOpen: (open: boolean) => void;
  friends?: Friend[] | null;
  isFriendModuleActive: boolean;
}

const ActiveProfileView: React.FC<ActiveProfileViewProps> = ({
  profileUser,
  activeUser,
  avatar,
  status,
  isOwnProfile,
  isAvatarDialogOpen,
  isBannerDialogOpen,
  setIsAvatarDialogOpen,
  setIsBannerDialogOpen,
  friends,
  isFriendModuleActive
}) => (
  <Box overrideClassName="w-full h-full flex flex-col">
    <BannerSection
      profileUser={profileUser}
      isOwnProfile={isOwnProfile}
      onEditClick={() => setIsBannerDialogOpen(true)}
    />
    
    <AvatarSection
      status={status} 
      avatar={avatar}
      isOwnProfile={isOwnProfile}
      onEditClick={() => setIsAvatarDialogOpen(true)}
    />

    <ContentSection 
      profileUser={profileUser} 
      isOwnProfile={isOwnProfile} 
      activeUser={activeUser} 
      friends={friends} 
      isFriendModuleActive={isFriendModuleActive} 
    />

    {isOwnProfile && (
      <>
        <AvatarEditDialog
          isOpen={isAvatarDialogOpen}
          onClose={() => setIsAvatarDialogOpen(false)}
          profileUser={profileUser}
          activeUser={activeUser}
          avatar={avatar}
        />
        <BannerEditDialog
          isOpen={isBannerDialogOpen}
          onClose={() => setIsBannerDialogOpen(false)}
          profileUser={profileUser}
          activeUser={activeUser}
        />
      </>
    )}
  </Box>
);

const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const settings = useSelector(selectAllSettings);

  const isModuleEnabled = (targetKey: string) => (data: Array<{ key: string; value: any }>) =>
    Boolean(data.find(({ key }) => key === targetKey)?.value);

  const isFriendModuleActive = isModuleEnabled('friend-module')(settings);

  const { data: profileUser, isLoading, isError } = useUserQuery(id ?? '', { skip: !id });
  const activeUser = useSelector(selectActiveUser);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const { data: friends } = useReadFriendsByUserQuery(id);
  const status = usePresence(profileUser?._id);

  if (isLoading) {
    return null; 
  }

  const isProfileInvalid = isError || !profileUser;

  if (isProfileInvalid) {
    return (
      <div className="w-full h-screen min-h-screen flex flex-col justify-center items-center">
        <UserNotFoundErrorState />
      </div>
    );
  }

  const isOwnProfile = !!activeUser && profileUser?._id === activeUser._id;
  const avatar = extractAvatarProps(profileUser);

  return (
    <ActiveProfileView 
      friends={isFriendModuleActive ? friends : null}
      isFriendModuleActive={isFriendModuleActive}
      profileUser={profileUser}
      activeUser={activeUser}
      avatar={avatar}
      status={status}
      isOwnProfile={isOwnProfile}
      isAvatarDialogOpen={isAvatarDialogOpen}
      isBannerDialogOpen={isBannerDialogOpen}
      setIsAvatarDialogOpen={setIsAvatarDialogOpen}
      setIsBannerDialogOpen={setIsBannerDialogOpen}
    />
  );
};

export default ProfilePage;