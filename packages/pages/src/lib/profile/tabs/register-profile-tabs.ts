import { registerProfileTab } from './profile-tab-registry';
import { ProfileInfoEditTab } from './profile-info-edit/profile-info-edit';
import { ProfileSettingsEditTab } from './profile-settings-edit/profile-settings-edit';
import { ProfileHomeTab } from './profile-home-tab/profile-home-tab';
import { ProfileFriendsTab } from './profile-friends-tab/profile-friends-tab';

registerProfileTab({
  id: 'profile-home-tab',
  label: 'Home',
  leadingIcon: 'Home',
  component: ProfileHomeTab,
  ownProfileOnly: false,
});

registerProfileTab({
  id: 'profile-friends-tab',
  label: 'Friends',
  leadingIcon: 'Users',
  component: ProfileFriendsTab,
  ownProfileOnly: false,
  requiredSetting: 'friend-module',
});

registerProfileTab({
  id: 'profile-info-edit',
  label: 'Edit Profile',
  leadingIcon: 'Pencil',
  component: ProfileInfoEditTab,
  ownProfileOnly: true,
});

registerProfileTab({
  id: 'profile-settings-edit',
  label: 'Profile Settings',
  leadingIcon: 'Cog',
  component: ProfileSettingsEditTab,
  ownProfileOnly: true,
});