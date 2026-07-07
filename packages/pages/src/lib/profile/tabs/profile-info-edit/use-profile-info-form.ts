import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useUpdateUserMutation, setActiveUser } from '@inithium/store';

type GenderType = 'Male' | 'Female' | 'Prefer Not to Say' | 'Custom';

interface FormState {
  first_name: string;
  last_name: string;
  dob: string;
  bio: string;
  phone_number: string;
  gender_type: GenderType | '';
  gender_custom: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
}

interface FormErrors {
  first_name?: string;
  gender_type?: string;
  gender_custom?: string;
}

export interface ActiveFieldFlags {
  showPhone?: boolean;
  showDob?: boolean;
  showGender?: boolean;
  showAddress?: boolean;
  showBio?: boolean;
}

interface UseProfileInfoFormOptions {
  profileUser: any;
  activeUser: any;
}

const buildFormState = (profileUser: any): FormState => ({
  first_name: profileUser?.first_name ?? '',
  last_name: profileUser?.last_name ?? '',
  dob: profileUser?.dob ?? '',
  bio: profileUser?.bio ?? '',
  phone_number: profileUser?.phone_number ?? '',
  gender_type: (profileUser?.gender?.type as GenderType) ?? '',
  gender_custom: profileUser?.gender?.custom ?? '',
  address_street: profileUser?.address?.street ?? '',
  address_city: profileUser?.address?.city ?? '',
  address_state: profileUser?.address?.state ?? '',
  address_zip: profileUser?.address?.zip ?? '',
  address_country: profileUser?.address?.country ?? '',
});

export const useProfileInfoForm = ({ profileUser, activeUser }: UseProfileInfoFormOptions) => {
  const dispatch = useDispatch();
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();

  const [form, setForm] = useState<FormState>(() => buildFormState(profileUser));
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setForm(buildFormState(profileUser));
  }, [profileUser]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (flags: ActiveFieldFlags = {}): boolean => {
    const { showGender = true } = flags;
    const next: FormErrors = {};

    if (!form.first_name.trim()) {
      next.first_name = 'First name is required.';
    }

    if (showGender) {
      if (!form.gender_type) {
        next.gender_type = 'Please select a gender option.';
      }
      if (form.gender_type === 'Custom' && !form.gender_custom.trim()) {
        next.gender_custom = 'Please enter your custom gender.';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (closeDialog: () => void, flags: ActiveFieldFlags = {}) => {
    if (!profileUser?._id) return false;

    const { showPhone = true, showDob = true, showGender = true, showAddress = true, showBio = true } = flags;

    if (!validate(flags)) return false;

    setSaveError(null);

    try {
      const updatedUserResult = await updateUser({
        id: profileUser._id,
        data: {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          ...(showBio     && { bio: form.bio }),
          ...(showDob     && { dob: form.dob }),
          ...(showPhone   && { phone_number: form.phone_number }),
          ...(showGender  && {
            gender: {
              type: form.gender_type,
              ...(form.gender_type === 'Custom' ? { custom: form.gender_custom.trim() } : {}),
            },
          }),
          ...(showAddress && {
            address: {
              street: form.address_street,
              city: form.address_city,
              state: form.address_state,
              zip: form.address_zip,
              country: form.address_country,
            },
          }),
        },
      }).unwrap();

      if (activeUser && activeUser._id === updatedUserResult._id) {
        dispatch(setActiveUser(updatedUserResult));
      }

      closeDialog();
      return true;
    } catch (err: any) {
      setSaveError(err?.data?.message ?? err?.message ?? 'Something went wrong. Please try again.');
      return false;
    }
  };

  const resetForm = () => {
    setForm(buildFormState(profileUser));
    setErrors({});
    setSaveError(null);
  };

  return { form, errors, saveError, isSaving, setField, validate, handleSave, resetForm };
};