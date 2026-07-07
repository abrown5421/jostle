export const SETTING_LABELS: Record<string, string> = {
  'logo-asset':             'Logo Asset',
  'primary-font-asset':     'Primary Font',
  'secondary-font-asset':   'Secondary Font',
  'profile-info-address':   'Show Address Field',
  'profile-info-phone':     'Show Phone Field',
  'profile-info-dob':       'Show Date of Birth Field',
  'profile-info-gender':    'Show Gender Field',
  'profile-info-bio':       'Show Bio Field',
  'profile-info-dark-mode': 'Enable Dark Mode Toggle',
  'friend-module':         'Enable User Friendship'
};

export const SETTING_DESCRIPTIONS: Record<string, string> = {
  'logo-asset':             'The image used as the application logo across all surfaces.',
  'font-primary':           'The primary typeface applied to headings and prominent UI text.',
  'font-secondary':         'The secondary typeface applied to body copy and supporting text.',
  'profile-info-address':   'Display the address field on user profile pages.',
  'profile-info-phone':     'Display the phone number field on user profile pages.',
  'profile-info-dob':       'Display the date of birth field on user profile pages.',
  'profile-info-gender':    'Display the gender field on user profile pages.',
  'profile-info-bio':       'Display the bio field on user profile pages.',
  'profile-info-dark-mode': 'Allow users to toggle dark mode from their profile.',
    'friend-module':       'Allow users to add eachother as friends'
};

export const SECTION_KEYS: Record<string, string[]> = {
  Branding: ['logo-asset', 'primary-font-asset', 'secondary-font-asset'],
  'Profile Fields': [
    'profile-info-address',
    'profile-info-phone',
    'profile-info-dob',
    'profile-info-gender',
    'profile-info-bio',
    'profile-info-dark-mode',
    'friend-module',
  ],
};