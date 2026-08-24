import { fonts, images } from '@jostle/assets';
import { PresenceLight, useLocalPresenceBroadcaster } from '@jostle/presence';
import { AnimatedRoutes } from '@jostle/router';
import { Navbar } from '@jostle/ui';
import type { UserProfile } from '@jostle/ui';
import { BrowserRouter, useNavigate } from 'react-router';
import { AuthProvider, useAuth } from '../auth/index.js';
import { pubsub } from '../presence/pubsub-client.js';
import { routes } from './routes.js';

const NAV_LINKS = [{ label: 'Home', href: '/' }];

function toProfile(user: { id: string; firstName: string; lastName?: string }): UserProfile {
  return { id: user.id, name: [user.firstName, user.lastName].filter(Boolean).join(' ') };
}

function PresenceBadge({ entityId }: { entityId: string }) {
  const status = useLocalPresenceBroadcaster({ pubsub, entityId, isAuthenticated: true });
  return <PresenceLight status={status} size="sm" />;
}

function AppShell() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Avoid flashing the logged-out navbar while the initial /auth/me check
  // is still in flight — same content either way, just not painted yet.
  if (isLoading) return null;

  const profile = user ? toProfile(user) : undefined;

  return (
    <>
      <Navbar
        logoSrc={images.logo}
        appName="Jostle"
        appNameFontFamily={fonts.primary}
        navLinks={NAV_LINKS}
        profileLinks={profile ? [{ label: 'Profile', href: `/profile/${profile.id}` }] : []}
        isAuthenticated={isAuthenticated}
        user={profile}
        avatarBadge={profile ? <PresenceBadge entityId={profile.id} /> : undefined}
        onLogin={() => navigate('/login')}
        onLogout={async () => {
          await logout();
          navigate('/');
        }}
        onNavigate={navigate}
      />
      <AnimatedRoutes routes={routes} />
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
