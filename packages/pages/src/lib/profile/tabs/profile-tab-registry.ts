import { User } from '@inithium/types';
import React from 'react';

export interface ProfileTabDefinition {
  id: string;
  label: string;
  leadingIcon?: string;
  component: React.ComponentType<ProfileTabPanelProps>;
  ownProfileOnly?: boolean;
  requiredSetting?: string;
}

export interface ProfileTabPanelProps {
  profileUser: any;
  isOwnProfile: boolean;
  activeUser: User | null;
}

const registry: ProfileTabDefinition[] = [];

export const registerProfileTab = (tab: ProfileTabDefinition): void => {
  if (registry.some(t => t.id === tab.id)) {
    console.warn(`[ProfileTabRegistry] Tab "${tab.id}" is already registered.`);
    return;
  }
  registry.push(tab);
};

export const getProfileTabs = (): readonly ProfileTabDefinition[] => registry;