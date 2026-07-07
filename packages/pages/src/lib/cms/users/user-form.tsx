import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Box, Button, Input, Select, Text } from '@inithium/ui';
import { User } from '@inithium/types';
import { CreateUserDto, UpdateUserDto, showAlert } from '@inithium/store';

type UserRole = 'super-admin' | 'admin' | 'editor' | 'writer' | 'user';

export interface UserFormProps {
  readonly user?: User;
  readonly isSubmitting: boolean;
  readonly error?: string | null;
  readonly onSubmit: (data: CreateUserDto | UpdateUserDto) => void;
  readonly onCancel: () => void;
  readonly loggedInRole: UserRole;
}

interface FormErrors {
  first_name?: string;
  email?: string;
  password?: string;
}

interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: UserRole;
}

const PASSWORD_MIN_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = (values: UserFormData, isEdit: boolean): FormErrors => {
  const errs: FormErrors = {};
  if (!values.first_name.trim()) errs.first_name = 'First name is required';
  
  if (!values.email.trim()) {
    errs.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(values.email)) {
    errs.email = 'Enter a valid email address';
  }

  if (!isEdit && !values.password) {
    errs.password = 'Password is required';
  } else if (values.password && values.password.length < PASSWORD_MIN_LENGTH) {
    errs.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }

  return errs;
};

const ALL_ROLE_OPTIONS = [
  { value: 'super-admin', label: 'SUPER ADMIN' },
  { value: 'admin', label: 'ADMIN' },
  { value: 'editor', label: 'EDITOR' },
  { value: 'writer', label: 'WRITER' },
  { value: 'user', label: 'USER' },
];

export const UserForm: React.FC<UserFormProps> = ({
  user,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
  loggedInRole,
}) => {
  const isEdit = Boolean(user);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState<UserFormData>({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    email: user?.email ?? '',
    password: '',
    role: (user?.role as UserRole) ?? 'user',
  });

  const [validationErrors, setValidationErrors] = useState<FormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Surface database or server validation errors caught by parent container component
  useEffect(() => {
    if (error) {
      dispatch(
        showAlert({
          message: error,
          severity: 'danger',
          closeable: true,
          position: 'top-right',
          animation_object: {
            entry: 'fadeInRight',
            exit: 'fadeOutRight',
            entrySpeed: 'fast',
            exitSpeed: 'faster',
          },
        })
      );
    }
  }, [error, dispatch]);

  const isFieldDisabled = useMemo(() => {
    const rules = {
      first_name: false,
      last_name: false,
      email: false,
      password: false,
      role: false,
    };

    if (loggedInRole === 'super-admin') return rules;
    if (loggedInRole === 'admin') {
      rules.role = true;
      return rules;
    }
    if (loggedInRole === 'editor') {
      rules.role = true;
      rules.password = true;
      return rules;
    }
    if (loggedInRole === 'writer' || loggedInRole === 'user') {
      rules.email = true;
      rules.password = true;
      rules.role = true;
    }
    return rules;
  }, [loggedInRole]);

  const explicitRoleOptions = useMemo(() => {
    if (loggedInRole === 'super-admin') return ALL_ROLE_OPTIONS;
    return ALL_ROLE_OPTIONS.filter(opt => opt.value !== 'super-admin');
  }, [loggedInRole]);

  const handleChange = (field: keyof UserFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    if (isFieldDisabled[field]) return;
    const nextState = { ...formData, [field]: e.target.value as any };
    setFormData(nextState);
    if (hasSubmitted) {
      setValidationErrors(validate(nextState, isEdit));
    }
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setHasSubmitted(true);

    const errs = validate(formData, isEdit);
    setValidationErrors(errs);

    if (Object.keys(errs).length > 0) {
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
    
    const payload = isEdit && !formData.password
      ? (() => { const { password, ...rest } = formData; return rest; })()
      : formData;

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <Box flex direction="col" className="gap-2 py-2">
        <Box flex direction="col" className="gap-1">
          <Input
            label="First Name *"
            variant="outline"
            color={validationErrors.first_name ? 'danger' : 'primary'}
            size="sm"
            fullWidth
            value={formData.first_name}
            onChange={handleChange('first_name')}
            disabled={isFieldDisabled.first_name || isSubmitting}
          />
          {validationErrors.first_name && (
            <Text variant="caption" overrideClassName="text-xs text-danger pl-1">
              {validationErrors.first_name}
            </Text>
          )}
        </Box>

        <Box flex direction="col" className="gap-1">
          <Input
            label="Last Name"
            variant="outline"
            color="primary"
            size="sm"
            fullWidth
            value={formData.last_name}
            onChange={handleChange('last_name')}
            disabled={isFieldDisabled.last_name || isSubmitting}
          />
        </Box>

        <Box flex direction="col" className="gap-1">
          <Input
            label="Email Address *"
            type="email"
            variant="outline"
            color={validationErrors.email ? 'danger' : 'primary'}
            size="sm"
            fullWidth
            value={formData.email}
            onChange={handleChange('email')}
            leadingIcon="mail"
            disabled={isFieldDisabled.email || isSubmitting}
          />
          {validationErrors.email && (
            <Text variant="caption" overrideClassName="text-xs text-danger pl-1">
              {validationErrors.email}
            </Text>
          )}
        </Box>

        <Box flex direction="col" className="gap-1">
          <Input
            label={isEdit ? 'Password (leave blank to keep current)' : 'Password *'}
            type="password"
            variant="outline"
            color={validationErrors.password ? 'danger' : 'primary'}
            size="sm"
            fullWidth
            value={formData.password}
            onChange={handleChange('password')}
            leadingIcon="lock"
            disabled={isFieldDisabled.password || isSubmitting}
          />
          {validationErrors.password && (
            <Text variant="caption" overrideClassName="text-xs text-danger pl-1">
              {validationErrors.password}
            </Text>
          )}
        </Box>
        
        <Select
          label="System Access Role"
          options={explicitRoleOptions}
          color="primary"
          variant="outline"
          size="sm"
          fullWidth
          value={formData.role}
          onChange={handleChange('role')}
          leadingIcon="shield"
          disabled={isFieldDisabled.role || isSubmitting}
        />

        <Box flex justify="end" className="gap-2 mt-6">
          <Button 
            variant="ghost" 
            color="secondary" 
            size="sm" 
            onClick={onCancel} 
            disabled={isSubmitting}
            type="button"
          >
            Cancel
          </Button>
          <Button 
            variant="solid" 
            color="primary" 
            size="sm" 
            type="submit" 
            disabled={isSubmitting}
          >
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </Box>
      </Box>
    </form>
  );
};