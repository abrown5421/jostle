import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useUpdateUserMutation, useLoginMutation, setActiveUser } from '@inithium/store';

interface FormState {
  email: string;
  new_password: string;
  confirm_password: string;
  dark_mode: boolean;
}

interface FormErrors {
  email?: string;
  new_password?: string;
  confirm_password?: string;
}

interface UseProfileSettingsFormOptions {
  profileUser: any;
  activeUser: any;
}

export interface SettingsFieldFlags {
  showDarkMode?: boolean;
}

const buildFormState = (profileUser: any): FormState => ({
  email: profileUser?.email ?? '',
  new_password: '',
  confirm_password: '',
  dark_mode: profileUser?.dark_mode ?? false,
});

const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return 'Email is required.';
  if (!email.includes('@') || !email.includes('.')) return 'Please enter a valid email address.';
  return undefined;
};

const validatePassword = (password: string): string | undefined => {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character.';
  return undefined;
};

export const useProfileSettingsForm = ({ profileUser, activeUser }: UseProfileSettingsFormOptions) => {
  const dispatch = useDispatch();
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();
  const [login, { isLoading: isVerifying }] = useLoginMutation();

  const [form, setForm] = useState<FormState>(() => buildFormState(profileUser));
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  useEffect(() => {
    setForm(buildFormState(profileUser));
  }, [profileUser]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const verifyCurrentPassword = async (): Promise<void> => {
    if (!currentPassword.trim()) {
      setCurrentPasswordError('Please enter your current password.');
      return;
    }
    setCurrentPasswordError(null);
    try {
      await login({ email: profileUser.email, password: currentPassword }).unwrap();
      setIsPasswordVerified(true);
      setCurrentPassword('');
    } catch {
      setCurrentPasswordError('Incorrect password. Please try again.');
    }
  };

  const cancelPasswordChange = () => {
    setIsPasswordVerified(false);
    setCurrentPassword('');
    setCurrentPasswordError(null);
    setForm((prev) => ({ ...prev, new_password: '', confirm_password: '' }));
    setErrors((prev) => ({ ...prev, new_password: undefined, confirm_password: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};

    const emailError = validateEmail(form.email);
    if (emailError) next.email = emailError;

    if (isPasswordVerified) {
      const passwordError = validatePassword(form.new_password);
      if (passwordError) next.new_password = passwordError;
      else if (form.new_password !== form.confirm_password) {
        next.confirm_password = 'Passwords do not match.';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (closeDialog: () => void, flags: SettingsFieldFlags = {}) => {
    if (!profileUser?._id) return false;
    if (!validate()) return false;

    const { showDarkMode = true } = flags;

    setSaveError(null);

    try {
      const updatedUserResult = await updateUser({
        id: profileUser._id,
        data: {
          email: form.email.trim(),
          ...(showDarkMode && { dark_mode: form.dark_mode }),
          ...(isPasswordVerified && form.new_password ? { password: form.new_password } : {}),
        },
      }).unwrap();

      if (activeUser && activeUser._id === updatedUserResult._id) {
        dispatch(setActiveUser(updatedUserResult));
      }

      // Reset password change flow on successful save
      cancelPasswordChange();
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
    cancelPasswordChange();
  };

  return {
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
  };
};