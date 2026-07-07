import React from 'react';
import { Tabs } from '@inithium/ui';
import { getProfileTabs } from './profile-tab-registry';
import { User, Friend } from '@inithium/types';
import { useSelector } from 'react-redux';
import { selectAllSettings, useReadFriendsByUserQuery } from '@inithium/store';

interface ProfileTabsProps {
  profileUser: any;
  isOwnProfile: boolean;
  activeUser: User | null;
}

const isSettingEnabled = (settings: readonly any[]) => (key: string): boolean =>
  Boolean(settings.find(s => s.key === key)?.value);

const calculatePendingCount = (activeUserId: string) => (friends: readonly Friend[]): number =>
  friends.filter(f => f.status === 'pending' && f.recipient._id === activeUserId).length;

const injectTabBadges = (friends: readonly Friend[], activeUserId: string) => (tabs: readonly any[]) =>
  tabs.map(tab => tab.id === 'profile-friends-tab' 
    ? { ...tab, badge: calculatePendingCount(activeUserId)(friends) }
    : tab
  );

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ profileUser, isOwnProfile, activeUser }) => {
  const settings = useSelector(selectAllSettings);
  const { data: activeFriends = [] } = useReadFriendsByUserQuery(activeUser?._id ?? '', {
    skip: !activeUser,
  });

  const checkSetting = isSettingEnabled(settings);
  const processBadges = injectTabBadges(activeFriends as Friend[], activeUser?._id ?? '');

  const tabs = processBadges(
    getProfileTabs().filter(tab => {
      if (tab.ownProfileOnly && !isOwnProfile) return false;
      if (tab.requiredSetting && !checkSetting(tab.requiredSetting)) return false;
      return true;
    })
  );

  if (tabs.length === 0) return null;

  return (
    <Tabs variant="enclosed" size="md" color="primary" className="w-full h-full">
      <Tabs.List>
        {tabs.map(tab => (
          <Tabs.Tab key={tab.id} leadingIcon={tab.leadingIcon}>
            <span className="flex items-center gap-2">
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-semibold bg-primary text-primary-contrast">
                  {tab.badge}
                </span>
              )}
            </span>
          </Tabs.Tab>
        ))}
      </Tabs.List>
      <Tabs.Panels>
        {tabs.map(tab => (
          <Tabs.Panel key={tab.id}>
            <tab.component profileUser={profileUser} isOwnProfile={isOwnProfile} activeUser={activeUser} />
          </Tabs.Panel>
        ))}
      </Tabs.Panels>
    </Tabs>
  );
};