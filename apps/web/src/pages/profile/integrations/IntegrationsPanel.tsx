import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Card, Icon, Loader, Pill, Text, alert, dialog, resolvePhosphorIcon } from '@inithium/ui';
import type { IconName } from '@inithium/ui';
import {
  useDisconnectIntegrationMutation,
  useListIntegrationsQuery,
  useStartIntegrationAuthorizationMutation,
} from '@inithium/api-client';
import type { IntegrationCallbackResult, IntegrationCatalogEntry } from '@inithium/api-client';
import { sanitizeReturnTo } from '../../games/requirements';

const ALERT_POSITION = 'bottom-right' as const;
const FALLBACK_ICON: IconName = 'PlugsConnected';
// The query params the API's OAuth callback appends when it sends the browser back here - see
// integration.service.ts's buildReturnUrl.
const CALLBACK_PARAMS = ['integration', 'integrationResult', 'integrationError'] as const;

// Provider icons arrive from the server as plain strings - an unknown name would resolve to an
// undefined component and crash the tab, so anything unrecognized falls back to a generic plug.
const resolveIconName = (name: string): IconName =>
  resolvePhosphorIcon(name as IconName) ? (name as IconName) : FALLBACK_ICON;

const formatConnectedDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

// Shows the outcome of an OAuth round-trip exactly once, then strips the callback params from the
// URL so a refresh doesn't replay the alert. Waits for the catalogue so it can use display names.
const useIntegrationCallbackAlert = (integrations: IntegrationCatalogEntry[] | undefined) => {
  const location = useLocation();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || !integrations) return;
    const params = new URLSearchParams(location.search);
    const provider = params.get('integration');
    const result = params.get('integrationResult') as IntegrationCallbackResult | null;
    if (!provider || !result) return;
    handled.current = true;

    const name = integrations.find((entry) => entry.provider === provider)?.displayName ?? provider;
    if (result === 'connected') alert.success(`${name} connected.`, { position: ALERT_POSITION });
    else if (result === 'cancelled') alert.info(`${name} connection was cancelled.`, { position: ALERT_POSITION });
    else alert.danger(`Could not connect ${name}. Please try again.`, { position: ALERT_POSITION });

    for (const key of CALLBACK_PARAMS) params.delete(key);
    const search = params.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true });
  }, [integrations, location.pathname, location.search, navigate]);
};

interface IntegrationCardProps {
  readonly integration: IntegrationCatalogEntry;
  readonly busy: boolean;
  readonly onConnect: (integration: IntegrationCatalogEntry) => void;
  readonly onDisconnect: (integration: IntegrationCatalogEntry) => void;
}

const IntegrationCard = ({ integration, busy, onConnect, onDisconnect }: IntegrationCardProps) => {
  const { connection } = integration;
  const needsReauth = connection?.status === 'needs-reauth';

  const statusPill = !integration.isAvailable ? (
    <Pill color={{ color: 'surface', intensity: 200 }}>Unavailable</Pill>
  ) : needsReauth ? (
    <Pill color={{ color: 'amber', intensity: 200 }}>Reconnect required</Pill>
  ) : connection ? (
    <Pill color={{ color: 'green', intensity: 200 }}>Connected</Pill>
  ) : null;

  return (
    <Card>
      <Box flex={{ direction: 'col', gap: 16 }} className="sm:flex-row sm:items-start">
        <Box
          flex={{ justify: 'center', align: 'center' }}
          className="h-12 w-12 shrink-0 rounded-lg text-white"
          style={{ backgroundColor: integration.brandColor }}
        >
          <Icon name={resolveIconName(integration.icon)} size={28} weight="fill" />
        </Box>

        <Box flex={{ direction: 'col', gap: 8 }} className="min-w-0 flex-1">
          <Box flex={{ direction: 'row', align: 'center', gap: 8 }} className="flex-wrap">
            <Text as="span" className="text-base font-semibold">
              {integration.displayName}
            </Text>
            {statusPill}
          </Box>
          <Text as="p" className="text-sm text-surface-600">
            {integration.description}
          </Text>

          {connection ? (
            <Box flex={{ direction: 'row', align: 'center', gap: 8 }}>
              {connection.externalAccountImageUrl ? (
                <img src={connection.externalAccountImageUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : null}
              <Text as="span" className="text-sm">
                Connected as <span className="font-medium">{connection.externalAccountName ?? connection.externalAccountId}</span>
                <span className="text-surface-500"> · since {formatConnectedDate(connection.connectedAt)}</span>
              </Text>
            </Box>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm text-surface-600">
              {integration.capabilities.map((capability) => (
                <li key={capability}>{capability}</li>
              ))}
            </ul>
          )}

          {connection?.notices.map((notice) => (
            <Text key={notice} as="p" className="text-sm text-amber-700">
              {notice}
            </Text>
          ))}
          {!integration.isAvailable ? (
            <Text as="p" className="text-sm text-surface-500">
              This integration hasn&apos;t been set up on this server yet.
            </Text>
          ) : null}
        </Box>

        <Box flex={{ direction: 'row', gap: 8 }} className="shrink-0">
          {connection && !needsReauth ? (
            <Button
              variant={{ kind: 'outlined', color: 'surface' }}
              disabled={busy}
              onClick={() => onDisconnect(integration)}
            >
              Disconnect
            </Button>
          ) : (
            <>
              <Button
                variant={{ kind: 'filled', color: 'primary' }}
                disabled={busy || !integration.isAvailable}
                onClick={() => onConnect(integration)}
              >
                {needsReauth ? 'Reconnect' : 'Connect'}
              </Button>
              {needsReauth ? (
                <Button variant={{ kind: 'ghost', color: 'surface' }} disabled={busy} onClick={() => onDisconnect(integration)}>
                  Remove
                </Button>
              ) : null}
            </>
          )}
        </Box>
      </Box>
    </Card>
  );
};

// Shown when a host was sent here to set something up for a game (see pages/games/requirements.ts):
// the way back to where they were. 'returnTo' rides along in this page's own query, so it survives
// the OAuth round-trip (handleConnect keeps the query when it builds its returnTo).
const ReturnToGameNotice = ({ returnTo }: { returnTo: string }) => {
  const navigate = useNavigate();
  return (
    <Card>
      <Box flex={{ direction: 'col', gap: 12 }} className="sm:flex-row sm:items-center sm:justify-between">
        <Box flex={{ direction: 'row', align: 'center', gap: 8 }}>
          <Icon name="GameController" size={24} />
          <Text as="p" className="text-sm">
            Connect what your game needs below, then head back to it.
          </Text>
        </Box>
        <Button variant={{ kind: 'filled', color: 'primary' }} onClick={() => navigate(returnTo)}>
          Back to the game
        </Button>
      </Box>
    </Card>
  );
};

export const IntegrationsPanel = () => {
  const location = useLocation();
  const returnTo = sanitizeReturnTo(new URLSearchParams(location.search).get('returnTo'));
  const { data: integrations, isLoading, isError, refetch } = useListIntegrationsQuery();
  const [startAuthorization, { isLoading: isStarting }] = useStartIntegrationAuthorizationMutation();
  const [disconnectIntegration, { isLoading: isDisconnecting }] = useDisconnectIntegrationMutation();
  useIntegrationCallbackAlert(integrations);

  const handleConnect = async (integration: IntegrationCatalogEntry) => {
    // Come back to this exact tab once the provider redirects to the API's callback.
    const returnParams = new URLSearchParams(location.search);
    for (const key of CALLBACK_PARAMS) returnParams.delete(key);
    returnParams.set('tab', 'integrations');

    try {
      const { authorizeUrl } = await startAuthorization({
        provider: integration.provider,
        returnTo: `${location.pathname}?${returnParams.toString()}`,
      }).unwrap();
      window.location.assign(authorizeUrl);
    } catch {
      alert.danger(`Could not start connecting ${integration.displayName}. Please try again.`, {
        position: ALERT_POSITION,
      });
    }
  };

  const handleDisconnect = async (integration: IntegrationCatalogEntry) => {
    const manageNote = integration.manageAccessUrl
      ? ` To fully revoke access, also remove this app from your ${integration.displayName} account settings.`
      : '';
    const confirmed = await dialog.confirm({
      title: `Disconnect ${integration.displayName}?`,
      description: `Features that rely on ${integration.displayName} will stop working until you reconnect.${manageNote}`,
      confirmLabel: 'Disconnect',
      cancelLabel: 'Cancel',
      confirmVariant: { kind: 'filled', color: 'red' },
    });
    if (!confirmed) return;

    try {
      await disconnectIntegration(integration.provider).unwrap();
      alert.success(`${integration.displayName} disconnected.`, { position: ALERT_POSITION });
    } catch {
      alert.danger(`Could not disconnect ${integration.displayName}. Please try again.`, { position: ALERT_POSITION });
    }
  };

  if (isLoading) {
    return (
      <Box flex={{ justify: 'center', align: 'center' }} padding={{ base: 32 }}>
        <Loader variant="spinner" color={{ color: 'primary', intensity: 500 }} />
      </Box>
    );
  }

  if (isError || !integrations) {
    return (
      <Box flex={{ direction: 'col', align: 'start', gap: 8 }}>
        <Text as="p" className="text-sm text-red-600">
          Could not load your integrations.
        </Text>
        <Button variant={{ kind: 'ghost', color: 'surface' }} onClick={() => refetch()}>
          Try again
        </Button>
      </Box>
    );
  }

  return (
    <Box flex={{ direction: 'col', gap: 16 }}>
      {returnTo && <ReturnToGameNotice returnTo={returnTo} />}
      <Text as="p" className="text-sm text-surface-600">
        Link third-party accounts to unlock features like hosting music games with your own playlists. Only you
        can see what&apos;s connected here.
      </Text>
      {integrations.length === 0 ? (
        <Text as="p" className="text-sm text-surface-500">
          No integrations are available yet.
        </Text>
      ) : (
        integrations.map((integration) => (
          <IntegrationCard
            key={integration.provider}
            integration={integration}
            busy={isStarting || isDisconnecting}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        ))
      )}
    </Box>
  );
};
