import React from 'react';
import { User } from '@inithium/types';
import { Button, Text } from '@inithium/ui';
import { CmsItemRow } from '@inithium/ui';

const ROLE_COLOR: Record<string, string> = {
  'super-admin': 'bg-danger text-danger-contrast',
  'admin':       'bg-warning text-warning-contrast',
  'editor':      'bg-accent text-accent-contrast',
  'writer':      'bg-success text-success-contrast',
  'user':        'bg-surface3 text-surface3-contrast',
};

export interface UserItemProps {
  user: User;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  loggedInRole: string;
}

export const UserItem: React.FC<UserItemProps> = ({
  user,
  isSelected,
  onToggle,
  onEdit,
  onDelete,
  loggedInRole,
}) => {
  const fullName = `${user.first_name} ${user.last_name}`;
  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  const roleColor = ROLE_COLOR[user.role] ?? ROLE_COLOR['user'];

  const canEdit = loggedInRole !== 'user';
  const canDelete =
    loggedInRole === 'super-admin' ||
    loggedInRole === 'admin' ||
    loggedInRole === 'editor';

  return (
    <CmsItemRow
      isSelected={isSelected}
      onToggle={() => onToggle(user._id)}
      thumbnailSlot={
        user.user_avatar?.src ? (
          <img
            src={user.user_avatar.src}
            alt={user.user_avatar.alt ?? fullName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <Text variant="caption" overrideClassName="font-semibold text-xs text-primary-contrast">
            {initials}
          </Text>
        )
      }
      infoSlot={
        <>
          <Text variant="body2" overrideClassName="font-semibold text-sm text-primary truncate">
            {fullName}
          </Text>
          <Text variant="caption" color="secondary" overrideClassName="text-xs text-secondary truncate">
            {user.email}
          </Text>
        </>
      }
      badgesSlot={
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${roleColor}`}
        >
          {user.role}
        </span>
      }
      actionsSlot={
        <>
          {canEdit && (
            <Button
              variant="ghost"
              color="secondary"
              size="sm"
              rounded
              icon="pencil"
              onClick={() => onEdit(user)}
              aria-label={`Edit ${fullName}`}
            />
          )}
          {canDelete && (
            <Button
              variant="ghost"
              color="danger"
              size="sm"
              rounded
              icon="trash-2"
              onClick={() => onDelete(user)}
              aria-label={`Delete ${fullName}`}
            />
          )}
        </>
      }
    />
  );
};