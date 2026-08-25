import { Container, Text } from '@jostle/ui';
import type { ReactNode } from 'react';
import { formatBirthdayDisplay } from '../../users/birthday.js';
import { genderDisplay } from '../../users/gender-display.js';
import type { UserProfileView } from '../../users/index.js';

export interface ProfileSidebarProps {
  profile: UserProfileView;
}

function SidebarRow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Container
      verticalAlign="center"
      gap={3}
      padding={6}
      className="border-t border-surface-tertiary"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-tertiary text-content-secondary">
        {icon}
      </span>
      <Text fontSize="sm" textColor="content-primary">
        {label}
      </Text>
    </Container>
  );
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path
        d="M3 10h18M8 3v4M16 3v4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileSidebar({ profile }: ProfileSidebarProps) {
  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(' ');
  const birthdayDisplay = formatBirthdayDisplay(profile.birthday);
  const gender = genderDisplay(profile);

  return (
    <Container
      direction="col"
      backgroundColor="surface-secondary"
      borderColor="surface-tertiary"
      className="w-full shrink-0 rounded-lg border md:max-w-xs"
    >
      <Container direction="col" gap={1} padding={6}>
        <Text fontSize="xl" fontWeight="bold" textColor="content-primary">
          {fullName}
        </Text>
        {profile.email && (
          <Text fontSize="sm" textColor="content-secondary">
            {profile.email}
          </Text>
        )}
      </Container>

      {birthdayDisplay && (
        <SidebarRow icon={<CalendarIcon />} label={birthdayDisplay} />
      )}
      {gender && <SidebarRow icon={<PersonIcon />} label={gender} />}
    </Container>
  );
}
