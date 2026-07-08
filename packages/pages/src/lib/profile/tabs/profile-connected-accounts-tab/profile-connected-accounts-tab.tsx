import React, { useState } from 'react';
import { ProfileTabPanelProps } from '../profile-tab-registry';
import { Box, Dialog, Text } from '@inithium/ui';
import { 
  useReadActiveConnectionsByUserQuery, 
  useCreateConnectedAccountMutation, 
  useDeleteConnectedAccountMutation 
} from '@inithium/store'; 

interface ProviderDefinition {
  id: string;
  name: string;
  logo: string;
}

export const ProfileConnectedAccountsTab: React.FC<ProfileTabPanelProps> = ({ activeUser }) => {
  const userId = activeUser?._id ?? '';
  
  const { data: connectedAccounts = [], isLoading } = useReadActiveConnectionsByUserQuery(userId, {
    skip: !userId,
  });
  const [createConnection] = useCreateConnectedAccountMutation();
  const [deleteConnection] = useDeleteConnectedAccountMutation();

  const [selectedProvider, setSelectedProvider] = useState<ProviderDefinition | null>(null);
  const [modalMode, setModalMode] = useState<'connect' | 'disconnect' | null>(null);

  const apiOrigin = import.meta.env.VITE_API_ORIGIN || 'http://localhost:3000';

  const providers: ProviderDefinition[] = [
    {
      id: 'spotify',
      name: 'Spotify',
      logo: `${apiOrigin}/api/assets/by-key/4af6b698-6965-450c-9290-0640d76ee3cf.webp`,
    },
    {
      id: 'apple-music',
      name: 'Apple Music',
      logo: `${apiOrigin}/api/assets/by-key/09836d91-9f2c-4267-ad59-e2eeb983e8ab.webp`,
    },
  ];

  const activeConnections = providers.filter((p) =>
    connectedAccounts.some((account) => account.provider === p.id && account.status === 'active')
  );
  
  const availableToConnect = providers.filter((p) =>
    !connectedAccounts.some((account) => account.provider === p.id && account.status === 'active')
  );

  const handleCloseModal = () => {
    setSelectedProvider(null);
    setModalMode(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedProvider || !userId) return;

    if (modalMode === 'connect') {
      await createConnection({
        userId,
        provider: selectedProvider.id,
        providerAccountId: `mock-${Date.now()}`,
        status: 'active',
        credentials: { accessToken: 'mock-token' },
      }).unwrap();
    } else if (modalMode === 'disconnect') {
      const targetingAccount = connectedAccounts.find(
        (a) => a.provider === selectedProvider.id && a.status === 'active'
      );
      if (targetingAccount) {
        await deleteConnection(targetingAccount._id).unwrap();
      }
    }
    handleCloseModal();
  };

  if (isLoading) {
    return (
      <Box className="flex items-center justify-center h-full py-12">
        <Text color="surface-contrast">Loading account connections...</Text>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col gap-10 py-4 h-full w-full mx-auto">
      <Box className="flex flex-col gap-4">
        <Text color="surface-contrast" overrideClassName="text-lg font-semibold tracking-tight border-b pb-2">
          Your Connected Accounts
        </Text>
        {activeConnections.length === 0 ? (
          <Text overrideClassName="text-sm opacity-60 italic">No external accounts linked yet.</Text>
        ) : (
          <Box className="flex flex-row flex-wrap gap-4">
            {activeConnections.map((provider) => (
              <Box
                key={provider.id}
                className="flex flex-col items-center p-5 border border-neutral-200 rounded-xl bg-surface shadow-sm min-w-[160px] relative group"
              >
                <img src={provider.logo} alt={provider.name} className="w-14 h-14 object-contain mb-3" />
                <Text color="surface-contrast" overrideClassName="text-sm font-medium">{provider.name}</Text>
                <button
                  onClick={() => {
                    setSelectedProvider(provider);
                    setModalMode('disconnect');
                  }}
                  className="mt-3 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  Disconnect
                </button>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box className="flex flex-col gap-4">
        <Text color="surface-contrast" overrideClassName="text-lg font-semibold tracking-tight border-b pb-2">
          Available Services
        </Text>
        {availableToConnect.length === 0 ? (
          <Text overrideClassName="text-sm opacity-60 italic">All available platforms are connected.</Text>
        ) : (
          <Box className="flex flex-row flex-wrap gap-4">
            {availableToConnect.map((provider) => (
              <Box
                key={provider.id}
                onClick={() => {
                  setSelectedProvider(provider);
                  setModalMode('connect');
                }}
                className="flex flex-col items-center p-5 border border-dashed border-neutral-300 rounded-xl bg-surface/50 opacity-70 hover:opacity-100 hover:border-solid hover:border-primary cursor-pointer transition-all min-w-[160px]"
              >
                <img src={provider.logo} alt={provider.name} className="w-14 h-14 object-contain grayscale mb-3 group-hover:grayscale-0" />
                <Text color="surface-contrast" overrideClassName="text-sm font-medium">{provider.name}</Text>
                <Text overrideClassName="text-xs text-primary mt-3 font-medium">Link Account</Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Dialog
        open={modalMode !== null}
        onClose={handleCloseModal}
        title={modalMode === 'connect' ? `Link ${selectedProvider?.name}` : `Disconnect ${selectedProvider?.name}`}
        size="md"
        actions={[
          {
            label: 'Cancel',
            variant: 'outline',
            color: 'neutral' as any,
            onClick: handleCloseModal,
          },
          {
            label: modalMode === 'connect' ? 'Connect' : 'Confirm Disconnect',
            color: modalMode === 'connect' ? 'primary' : 'danger',
            onClick: handleConfirmAction,
          },
        ]}
      >
        {modalMode === 'connect' ? (
          <Box className="flex flex-col gap-2 py-2">
            <Text overrideClassName="text-sm text-neutral-600">
              You are about to link your <strong>{selectedProvider?.name}</strong> account. This enables full data synchronization features with your profile.
            </Text>
            <Text overrideClassName="text-xs text-neutral-400 italic">
              Note: This is currently performing a local UI pipeline integration test. Direct OAuth workflows will be plugged in here later.
            </Text>
          </Box>
        ) : (
          <Box className="py-2">
            <Text overrideClassName="text-sm text-neutral-600">
              Are you sure you want to remove your integration with <strong>{selectedProvider?.name}</strong>? Your synced integration features will stop working immediately.
            </Text>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};