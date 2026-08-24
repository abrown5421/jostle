import { Avatar, Banner, Container, Text, cn } from '@jostle/ui';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../auth/index.js';
import {
  fetchMyProfile,
  updateProfile,
  uploadAvatar,
  uploadBanner,
} from '../../users/index.js';
import type { UserProfile } from '../../users/index.js';
import { AccountSettings } from './account-settings.js';
import { MediaUploadModal } from './media-upload-modal.js';
import { NameForm } from './name-form.js';
import { ProfileDetailsForm } from './profile-details-form.js';
import { ProfileSidebar } from './profile-sidebar.js';

type ProfileTab = 'profile' | 'settings';

function ProfileTabIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsTabIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-surface-tertiary text-content-primary'
          : 'text-content-secondary hover:text-content-primary',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    refreshUser,
  } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    if (user && id !== user.id) {
      navigate(`/profile/${user.id}`, { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, user, id, navigate]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) return;
    let cancelled = false;
    setIsLoadingProfile(true);
    fetchMyProfile()
      .then((result) => {
        if (!cancelled) setProfile(result);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProfile(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, isAuthenticated]);

  if (isAuthLoading || isLoadingProfile || !profile) {
    return (
      <Container direction="col" horizontalAlign="center" padding={12}>
        <Text textColor="content-secondary">Loading…</Text>
      </Container>
    );
  }

  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="w-full">
      <div className="relative">
        <Banner
          imageUrl={profile.bannerUrl}
          alt={`${fullName}'s banner`}
          onEdit={() => setIsBannerModalOpen(true)}
        />
        <div className="absolute -bottom-16 left-8">
          <Avatar
            imageUrl={profile.avatarUrl}
            name={fullName}
            size="xl"
            onEdit={() => setIsAvatarModalOpen(true)}
          />
        </div>
      </div>

      <Container
        direction="col"
        gap={6}
        padding={8}
        className="pt-20 md:flex-row md:items-start"
      >
        <ProfileSidebar profile={profile} />

        <Container direction="col" gap={4} className="w-full flex-1">
          <div className="flex gap-2">
            <TabButton
              active={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
              icon={<ProfileTabIcon />}
            >
              Profile
            </TabButton>
            <TabButton
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              icon={<SettingsTabIcon />}
            >
              Settings
            </TabButton>
          </div>

          {activeTab === 'profile' ? (
            <>
              <NameForm
                profile={profile}
                onSave={async (input) => {
                  const updated = await updateProfile(input);
                  setProfile(updated);
                  await refreshUser();
                }}
              />
              <ProfileDetailsForm
                profile={profile}
                onSave={async (input) => {
                  const updated = await updateProfile(input);
                  setProfile(updated);
                }}
              />
            </>
          ) : (
            <AccountSettings profile={profile} />
          )}
        </Container>
      </Container>

      <MediaUploadModal
        open={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        title="Update Avatar"
        currentImageUrl={profile.avatarUrl}
        previewShape="circle"
        onUpload={async (file) => {
          const updated = await uploadAvatar(file);
          setProfile(updated);
          await refreshUser();
        }}
      />
      <MediaUploadModal
        open={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        title="Update Banner"
        currentImageUrl={profile.bannerUrl}
        previewShape="rect"
        onUpload={async (file) => {
          const updated = await uploadBanner(file);
          setProfile(updated);
        }}
      />
    </div>
  );
}
