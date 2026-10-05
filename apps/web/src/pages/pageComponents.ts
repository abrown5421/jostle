import type { PageComponentMap } from '@inithium/ui';
import { HomePage } from './HomePage';
import { LoginPage } from './LoginPage';
import { SignupPage } from './SignupPage';
import { PrivacyPolicyPage } from './PrivacyPolicyPage';
import { ProfilePage } from './ProfilePage';
import { HostPage } from './HostPage';
import { JoinPage } from './JoinPage';
import { PlayPage } from './PlayPage';
import { GamesPage } from './GamesPage';
import { SessionSettingsPage } from './SessionSettingsPage';
// inithium:anchor:imports

// Keyed by Page.slug, matching libs/db/src/page-seeds/registry.ts's own seeded records: home
// ("/"), login ("/login"), signup ("/signup"), privacy-policy
// ("/privacy-policy"), profile ("/profile/:id"). A plugin that adds its own page(s) appends its
// own slug(s) here via a merge-strategy injection - every entry here has a corresponding
// page-seed reconciled by ensureSeededPages() at API boot, and must still be added here by hand
// alongside its seed (no mechanism auto-derives this map from the seed registry).
export const pageComponents: PageComponentMap = {
  home: HomePage,
  login: LoginPage,
  signup: SignupPage,
  'privacy-policy': PrivacyPolicyPage,
  profile: ProfilePage,
  host: HostPage,
  join: JoinPage,
  play: PlayPage,
  games: GamesPage,
  'session-settings': SessionSettingsPage,
  // inithium:anchor:components
};
