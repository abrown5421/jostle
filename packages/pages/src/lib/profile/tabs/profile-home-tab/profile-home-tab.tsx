
import React from 'react';
import { ProfileTabPanelProps } from '../profile-tab-registry';
import { Box, Text } from '@inithium/ui';

export const ProfileHomeTab: React.FC<ProfileTabPanelProps> = ({ profileUser, activeUser, isOwnProfile }) => {
  
  return (
    <Box className="flex flex-col gap-6 py-4 h-full justfy-center items-center">
        <Text color='surface-contrast'>Profile Home Tab</Text>
    </Box>
  );
};