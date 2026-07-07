import React from 'react';
import { selectSettingByKey, showAlert } from '@inithium/store';
import { Box, Button, Input, Select } from '@inithium/ui';
import { ProfileTabPanelProps } from '../profile-tab-registry';
import { ActiveFieldFlags, useProfileInfoForm } from './use-profile-info-form';
import { useDispatch, useSelector } from 'react-redux';

const GENDER_OPTIONS = [
  { value: 'Male',              label: 'Male' },
  { value: 'Female',            label: 'Female' },
  { value: 'Prefer Not to Say', label: 'Prefer Not to Say' },
  { value: 'Custom',            label: 'Custom...' },
];

export const ProfileInfoEditTab: React.FC<ProfileTabPanelProps> = ({ profileUser, activeUser, isOwnProfile }) => {
  if (!isOwnProfile) return null;

  const dispatch = useDispatch();
  const showAddress = useSelector(selectSettingByKey('profile-info-address'))?.value !== false;
  const showPhone   = useSelector(selectSettingByKey('profile-info-phone'))?.value !== false;
  const showDob     = useSelector(selectSettingByKey('profile-info-dob'))?.value !== false;
  const showGender  = useSelector(selectSettingByKey('profile-info-gender'))?.value !== false;
  const showBio     = useSelector(selectSettingByKey('profile-info-bio'))?.value !== false;

  const { form, errors, saveError, isSaving, setField, validate, handleSave, resetForm } =
    useProfileInfoForm({ profileUser, activeUser });

  const flags: ActiveFieldFlags = { showPhone, showDob, showGender, showAddress, showBio };

  const handleSubmit = async () => {
    const valid = validate(flags);
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
    await handleSave(() => {});
  };

  return (
    <Box className="flex flex-col gap-6 py-4">
      <section className="flex flex-col gap-3">
        <div className="flex gap-3">
          <Input size="sm"
            label="First Name"
            fullWidth
            value={form.first_name}
            onChange={(e) => setField('first_name', e.target.value)}
            color={errors.first_name ? 'danger' : 'primary'}
          />
          <Input size="sm"
            label="Last Name"
            fullWidth
            value={form.last_name}
            onChange={(e) => setField('last_name', e.target.value)}
          />
        </div>
        {errors.first_name && (
          <p className="text-xs text-danger -mt-1">{errors.first_name}</p>
        )}
      </section>

      {(showDob || showPhone) && (
        <section className="flex flex-col gap-3">
          <div className="flex gap-3">
            {showDob && (
              <Input size="sm" label="DOB" type="date" fullWidth
                value={form.dob}
                onChange={(e) => setField('dob', e.target.value)}
              />
            )}
            {showPhone && (
              <Input size="sm" label="Phone Number" type="tel" fullWidth leadingIcon="phone"
                value={form.phone_number}
                onChange={(e) => setField('phone_number', e.target.value)}
              />
            )}
          </div>
        </section>
      )}

      {showGender && (
        <section className="flex flex-col gap-3">
          <Select size="sm" label="Gender" fullWidth
            options={GENDER_OPTIONS}
            value={form.gender_type}
            onChange={(e) => setField('gender_type', e.target.value as any)}
            color={errors.gender_type ? 'danger' : 'primary'}
          />
          {errors.gender_type && <p className="text-xs text-danger -mt-1">{errors.gender_type}</p>}
          {form.gender_type === 'Custom' && (
            <>
              <Input size="sm" label="Custom Gender" fullWidth
                value={form.gender_custom}
                onChange={(e) => setField('gender_custom', e.target.value)}
                color={errors.gender_custom ? 'danger' : 'primary'}
              />
              {errors.gender_custom && <p className="text-xs text-danger -mt-1">{errors.gender_custom}</p>}
            </>
          )}
        </section>
      )}

      {showAddress && (
        <section className="flex flex-col gap-3">
          <Input size="sm" label="Street" fullWidth leadingIcon="map-pin"
            value={form.address_street}
            onChange={(e) => setField('address_street', e.target.value)}
          />
          <div className="flex gap-3">
            <Input size="sm" label="City" fullWidth
              value={form.address_city}
              onChange={(e) => setField('address_city', e.target.value)}
            />
            <Input size="sm" label="State" fullWidth
              value={form.address_state}
              onChange={(e) => setField('address_state', e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Input size="sm" label="ZIP Code" fullWidth
              value={form.address_zip}
              onChange={(e) => setField('address_zip', e.target.value)}
            />
            <Input size="sm" label="Country" fullWidth
              value={form.address_country}
              onChange={(e) => setField('address_country', e.target.value)}
            />
          </div>
        </section>
      )}

      {showBio && (
        <section className="flex flex-col gap-3">
          <Input size="sm" label="Tell us about yourself" fullWidth leadingIcon="user-round"
            value={form.bio}
            onChange={(e) => setField('bio', e.target.value)}
          />
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