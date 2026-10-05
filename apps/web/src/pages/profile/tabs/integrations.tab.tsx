import { IntegrationsPanel } from '../integrations/IntegrationsPanel';
import type { ProfileTabDescriptor } from './registry';

// visibility: 'owned' - linked third-party accounts are private to their owner; the API scopes
// every /api/integrations route to the caller's own user regardless, so this is UI, not security.
// The list itself is server-driven (GET /api/integrations), so a new provider added to
// @inithium/integrations' registry appears here with no change to this tab.
const IntegrationsTab = () => <IntegrationsPanel />;

const integrationsTab: ProfileTabDescriptor = {
  id: 'integrations',
  label: 'Integrations',
  order: 30,
  visibility: 'owned',
  Component: IntegrationsTab,
};

export default integrationsTab;
