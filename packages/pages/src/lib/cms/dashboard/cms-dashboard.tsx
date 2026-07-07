import React from 'react';
import { useUserQuery } from '@inithium/store';
import { Box, Loader, Text } from '@inithium/ui';
import { useParams } from 'react-router-dom';
import UserGrowthChart from './user-growth-chart';
import ErrorLogView from './error-log-view';

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

const CmsDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: profileUser, isLoading, isError } = useUserQuery(id ?? '', { skip: !id });

  if (isLoading) {
    return (
      <div className="w-full h-screen min-h-screen flex flex-col justify-center items-center">
        <Loader variant="spinner" size="lg" color="primary" />
      </div>
    ); 
  }

  const isProfileInvalid = isError || !profileUser;

  if (isProfileInvalid) {
    return (
      <div className="w-full h-screen min-h-screen flex flex-col justify-center items-center">
        <UserNotFoundErrorState />
      </div>
    );
  }

  return (
    <Box padding="md" className="h-full w-full">
      <Box margin="md">
        <UserGrowthChart />
      </Box>
      <Box margin="md">
        <ErrorLogView />
      </Box>
    </Box>
  );
};

export default CmsDashboardPage;
