import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectSettingByKey, showAlert } from '@inithium/store';
import { Box, Button, Input } from '@inithium/ui';
import { ProfileTabPanelProps } from '../profile-tab-registry';
import { useProfileSettingsForm } from './use-profile-settings-form';

export const ProfileSettingsEditTab: React.FC<ProfileTabPanelProps> = ({ profileUser, activeUser, isOwnProfile }) => {
  if (!isOwnProfile) return null;

  const dispatch = useDispatch();

  const {
    form,
    errors,
    saveError,
    isSaving,
    setField,
    validate,
    handleSave,
    resetForm,
    currentPassword,
    setCurrentPassword,
    currentPasswordError,
    isVerifying,
    isPasswordVerified,
    verifyCurrentPassword,
    cancelPasswordChange,
  } = useProfileSettingsForm({ profileUser, activeUser });
  const showDarkMode = useSelector(selectSettingByKey('profile-info-dark-mode'))?.value !== false;

  const handleSubmit = async () => {
    const valid = validate();
    if (!valid) {
      dispatch(
        showAlert({
          message: 'Please resolve the invalid form fields highlighted in red before submission.',
          severity: 'danger',
          closeable: false,
          position: 'bottom-right',
          animation_object: {
            entry: 'fadeInRight',
            exit: 'fadeOutRight',
            entrySpeed: 'fast',
            exitSpeed: 'faster',
          },
        })
      );
      return;
    }
    await handleSave(() => {}, { showDarkMode });
  };

  return (
    <Box className="flex flex-col gap-6 py-4">

      {/* Email */}
      <section className="flex flex-col gap-3">
        <Input
          size="sm"
          label="Email Address"
          type="email"
          fullWidth
          leadingIcon="mail"
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
          color={errors.email ? 'danger' : 'primary'}
        />
        {errors.email && (
          <p className="text-xs text-danger -mt-1">{errors.email}</p>
        )}
      </section>

      {/* Password change */}
      <section className="flex flex-col gap-3">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
          Change Password
        </p>

        {!isPasswordVerified ? (
          <>
            <Input
              size="sm"
              label="Current Password"
              type="password"
              fullWidth
              leadingIcon="lock"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyCurrentPassword()}
              color={currentPasswordError ? 'danger' : 'primary'}
            />
            {currentPasswordError && (
              <p className="text-xs text-danger -mt-1">{currentPasswordError}</p>
            )}
            <div className="flex justify-end">
              <Button
                variant="outline"
                color="primary"
                size="sm"
                disabled={isVerifying || !currentPassword.trim()}
                onClick={verifyCurrentPassword}
              >
                {isVerifying ? 'Verifying…' : 'Verify'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Input
              size="sm"
              label="New Password"
              type="password"
              fullWidth
              leadingIcon="lock"
              value={form.new_password}
              onChange={(e) => setField('new_password', e.target.value)}
              color={errors.new_password ? 'danger' : 'primary'}
            />
            {errors.new_password && (
              <p className="text-xs text-danger -mt-1">{errors.new_password}</p>
            )}
            <Input
              size="sm"
              label="Confirm New Password"
              type="password"
              fullWidth
              leadingIcon="lock"
              value={form.confirm_password}
              onChange={(e) => setField('confirm_password', e.target.value)}
              color={errors.confirm_password ? 'danger' : 'primary'}
            />
            {errors.confirm_password && (
              <p className="text-xs text-danger -mt-1">{errors.confirm_password}</p>
            )}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                color="primary"
                size="sm"
                onClick={cancelPasswordChange}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </section>

      {showDarkMode && (
        <section className="flex flex-col gap-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
            Appearance
          </p>
          <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2.5">
            <span className="text-sm text-slate-700">Dark Mode</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.dark_mode}
              onClick={() => setField('dark_mode', !form.dark_mode)}
              className={[
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
                form.dark_mode ? 'bg-primary' : 'bg-slate-200',
              ].join(' ')}
            >
              <span
                className={[
                  'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                  form.dark_mode ? 'translate-x-4' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
          </div>
        </section>
      )}

      {saveError && (
        <p className="text-xs text-danger">{saveError}</p>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button variant="outline" color="primary" disabled={isSaving} onClick={resetForm}>
          Reset
        </Button>
        <Button
          variant="solid"
          color="primary"
          disabled={isSaving}
          onClick={handleSubmit}
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

    </Box>
  );
};