import { AnimatedRoutes } from '@jostle/router';
import { Navbar } from '@jostle/ui';
import type { UserProfile } from '@jostle/ui';
import { useState } from 'react';
import { BrowserRouter, useNavigate } from 'react-router';
import { routes } from './routes.js';

const NAV_LINKS = [{ label: 'Home', href: '/' }];

// Placeholder until real auth exists — lets onLogin/onLogout actually
// exercise all four rows of the Navbar's viewport x auth-state matrix.
const MOCK_USER: UserProfile = { id: '1', name: 'Jamie Doe' };

function AppShell() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <>
      <Navbar
        logoSrc="/favicon.ico"
        appName="Jostle"
        navLinks={NAV_LINKS}
        profileLinks={[{ label: 'Profile', href: `/profile/${MOCK_USER.id}` }]}
        isAuthenticated={isAuthenticated}
        user={MOCK_USER}
        onLogin={() => setIsAuthenticated(true)}
        onLogout={() => setIsAuthenticated(false)}
        onNavigate={navigate}
      />
      <AnimatedRoutes routes={routes} />
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
