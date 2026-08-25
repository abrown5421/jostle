import { fonts } from '@jostle/assets';
import {
  DEFAULT_AVATAR_STYLE,
  resolveDicebearAvatarUrl,
} from '@jostle/profile-appearance';
import { Avatar, Banner, Container, Text, cn } from '@jostle/ui';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../auth/index.js';
import {
  fetchUserProfile,
  isProfileOwner,
  updateProfile,
} from '../../users/index.js';
import type { UserProfileView } from '../../users/index.js';
import { AvatarCustomizerModal } from './avatar-customizer-modal.js';
import { BannerCustomizerModal } from './banner-customizer-modal.js';
import { GamesTab } from './games-tab.js';
import { NameForm } from './name-form.js';
import { ProfileDetailsForm } from './profile-details-form.js';
import { ProfileSidebar } from './profile-sidebar.js';
import { PublicProfileDetails } from './public-profile-details.js';

type ProfileTab = 'profile' | 'games';

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

function GamesTabIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M7 7h10a4 4 0 0 1 4 4v3.5a3.5 3.5 0 0 1-6.6 1.6L14 15h-4l-.4 1.1A3.5 3.5 0 0 1 3 14.5V11a4 4 0 0 1 4-4Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 11v2.5M6.25 12.25h2.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <circle cx="16" cy="10.5" r="0.75" fill="currentColor" />
      <circle cx="18" cy="12.5" r="0.75" fill="currentColor" />
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
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const {
    user: currentUser,
    isLoading: isAuthLoading,
    refreshUser,
  } = useAuth();

  const [profile, setProfile] = useState<UserProfileView | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthLoading || routeUserId !== 'me') return;
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }
    navigate(`/profile/${currentUser.id}`, { replace: true });
  }, [isAuthLoading, currentUser, routeUserId, navigate]);

  const targetUserId =
    routeUserId && routeUserId !== 'me' ? routeUserId : undefined;
  const isOwner = isProfileOwner(currentUser?.id, targetUserId);

  useEffect(() => {
    if (isAuthLoading || !targetUserId) return;
    let cancelled = false;
    setIsLoadingProfile(true);
    fetchUserProfile(targetUserId)
      .then((result) => {
        if (!cancelled) setProfile(result);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProfile(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, targetUserId]);

  if (isAuthLoading || isLoadingProfile) {
    return (
      <Container direction="col" horizontalAlign="center" padding={12}>
        <Text textColor="content-secondary">Loading…</Text>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container direction="col" horizontalAlign="center" padding={12}>
        <Text textColor="content-secondary">
          This user couldn&apos;t be found.
        </Text>
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
          pattern={profile.bannerConfig}
          onEdit={isOwner ? () => setIsBannerModalOpen(true) : undefined}
        />
        <div className="absolute -bottom-16 left-8">
          <Avatar
            imageUrl={
              profile.avatarSeed
                ? resolveDicebearAvatarUrl(
                    profile.avatarSeed,
                    profile.avatarStyle ?? DEFAULT_AVATAR_STYLE,
                  )
                : undefined
            }
            name={fullName}
            size="xl"
            initialsFontFamily={fonts.primary}
            onEdit={isOwner ? () => setIsAvatarModalOpen(true) : undefined}
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
              active={activeTab === 'games'}
              onClick={() => setActiveTab('games')}
              icon={<GamesTabIcon />}
            >
              Games
            </TabButton>
          </div>

          {activeTab === 'profile' ? (
            isOwner ? (
              <>
                <NameForm
                  profile={profile}
                  onSave={async (input) => {
                    const updated = await updateProfile(profile.id, input);
                    setProfile(updated);
                    await refreshUser();
                  }}
                />
                <ProfileDetailsForm
                  profile={profile}
                  onSave={async (input) => {
                    const updated = await updateProfile(profile.id, input);
                    setProfile(updated);
                  }}
                />
              </>
            ) : (
              <PublicProfileDetails profile={profile} />
            )
          ) : (
            <GamesTab />
          )}
        </Container>
      </Container>

      {isOwner && (
        <>
          <AvatarCustomizerModal
            open={isAvatarModalOpen}
            onClose={() => setIsAvatarModalOpen(false)}
            currentSeed={profile.avatarSeed}
            currentStyle={profile.avatarStyle}
            name={fullName}
            initialsFontFamily={fonts.primary}
            onSave={async (input) => {
              const updated = await updateProfile(profile.id, input);
              setProfile(updated);
              await refreshUser();
            }}
          />
          <BannerCustomizerModal
            open={isBannerModalOpen}
            onClose={() => setIsBannerModalOpen(false)}
            currentConfig={profile.bannerConfig}
            onSave={async (bannerConfig) => {
              const updated = await updateProfile(profile.id, { bannerConfig });
              setProfile(updated);
            }}
          />
        </>
      )}
    </div>
  );
}
