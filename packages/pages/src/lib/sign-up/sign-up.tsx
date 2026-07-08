import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, Button, Text, Box } from '@inithium/ui';
import { NavigationLink } from '@inithium/router';
import { useDispatch } from 'react-redux';
import { useSignupMutation, setActiveUser, showAlert } from '@inithium/store';

interface SignUpFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignUpFormErrors {
  firstName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const PASSWORD_MIN_LENGTH = 8;

const validate = (vals: SignUpFormValues): SignUpFormErrors => {
  const errs: SignUpFormErrors = {};
  if (!vals.firstName.trim()) errs.firstName = 'First name is required';
  if (!vals.email.trim()) {
    errs.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) {
    errs.email = 'Enter a valid email address';
  }
  if (!vals.password) {
    errs.password = 'Password is required';
  } else if (vals.password.length < PASSWORD_MIN_LENGTH) {
    errs.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (!vals.confirmPassword) {
    errs.confirmPassword = 'Please confirm your password';
  } else if (vals.password !== vals.confirmPassword) {
    errs.confirmPassword = 'Passwords do not match';
  }
  return errs;
};

const toggleBtnStyle: React.CSSProperties = {
  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
  display: 'flex', alignItems: 'center', color: '#00E8D6', zIndex: 20,
};

const SignUp: React.FC = () => {
  const dispatch = useDispatch();
  const [signup, { isLoading }] = useSignupMutation();

  const [values, setValues] = useState<SignUpFormValues>({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState<SignUpFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (apiError) {
      dispatch(
        showAlert({
          message: apiError,
          severity: 'danger',
          closeable: true,
          position: 'bottom-right',
          animation_object: {
            entry: 'fadeInRight',
            exit: 'fadeOutRight',
            entrySpeed: 'fast',
            exitSpeed: 'faster',
          },
        })
      );
    }
  }, [apiError, dispatch]);

  const handleChange = (field: keyof SignUpFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = { ...values, [field]: e.target.value };
    setValues(updated);
    setApiError(null);
    if (submitted) setErrors(validate(updated));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setApiError(null);

    const errs = validate(values);
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      dispatch(
        showAlert({
          message: 'Please clear up form configuration rejections to complete account registration.',
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

    try {
      await signup({
        first_name:   values.firstName,
        last_name:    values.lastName,
        email:        values.email,
        password:     values.password,
        dark_mode:    false,
      }).unwrap();

      const meRes = await fetch(
        `${import.meta.env['VITE_API_ORIGIN'] ?? 'http://localhost:3000'}/api/auth/me`,
        { credentials: 'include' }
      );
      if (meRes.ok) {
        const user = await meRes.json();
        dispatch(setActiveUser(user));
      }
    } catch (err: any) {
      const message = err?.data?.message ?? err?.error ?? 'Sign up failed. Please try again.';
      setApiError(typeof message === 'string' ? message : 'Sign up failed. Please try again.');
    }
  };

  return (
    <Box flex direction="col" justify="center" align="center" fullWidth fullHeight>
      <Box
        color="surface" flex direction="col" align="center" padding="xl" borderRadius="lg"
        style={{ width: '100%', maxWidth: '480px', boxShadow: '0 4px 32px 0 rgba(15,80,102,0.10)', gap: '12px' }}
      >
        <Box flex direction="col" align="center" style={{ gap: '6px', width: '100%' }}>
          <Text variant="h3" color="primary" decoration={{ bold: true }}>Signup</Text>
        </Box>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          <Box flex direction="row" style={{ gap: '12px', width: '100%' }}>
            <Box flex direction="col" style={{ gap: '4px', flex: 1 }}>
              <Input label="First name *" type="text" value={values.firstName} onChange={handleChange('firstName')}
                color={errors.firstName ? 'danger' : 'primary'} variant="outline" size="sm" fullWidth />
              {errors.firstName && <Text variant="caption" overrideClassName="text-xs text-danger pl-1">{errors.firstName}</Text>}
            </Box>
            <Box flex direction="col" style={{ gap: '4px', flex: 1 }}>
              <Input label="Last name" type="text" value={values.lastName} onChange={handleChange('lastName')}
                color="primary" variant="outline" size="sm" fullWidth />
            </Box>
          </Box>

          <Box flex direction="col" style={{ gap: '4px', width: '100%' }}>
            <Input label="Email *" type="email" value={values.email} onChange={handleChange('email')}
              color={errors.email ? 'danger' : 'primary'} variant="outline" size="sm" fullWidth leadingIcon="mail" />
            {errors.email && <Text variant="caption" overrideClassName="text-xs text-danger pl-1">{errors.email}</Text>}
          </Box>

          <Box flex direction="col" style={{ gap: '4px', width: '100%' }}>
            <Box style={{ position: 'relative', width: '100%' }}>
              <Input label="Password *" type={showPassword ? 'text' : 'password'} value={values.password}
                onChange={handleChange('password')} color={errors.password ? 'danger' : 'primary'}
                variant="outline" size="sm" fullWidth leadingIcon="lock" />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'} style={toggleBtnStyle}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </Box>
            {errors.password && <Text variant="caption" overrideClassName="text-xs text-danger pl-1">{errors.password}</Text>}
          </Box>

          <Box flex direction="col" style={{ gap: '4px', width: '100%' }}>
            <Box style={{ position: 'relative', width: '100%' }}>
              <Input label="Confirm password *" type={showConfirm ? 'text' : 'password'} value={values.confirmPassword}
                onChange={handleChange('confirmPassword')} color={errors.confirmPassword ? 'danger' : 'primary'}
                variant="outline" size="sm" fullWidth leadingIcon="lock-keyhole" />
              <button type="button" onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'} style={toggleBtnStyle}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </Box>
            {errors.confirmPassword && <Text variant="caption" overrideClassName="text-xs text-danger pl-1">{errors.confirmPassword}</Text>}
          </Box>

          <Button type="submit" color="primary" variant="solid" size="sm" fullWidth rounded disabled={isLoading}>
            {isLoading ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <Box flex direction="row" align="center" style={{ width: '100%', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <Text variant="caption" overrideClassName="text-slate-400 text-xs">Already have an account?</Text>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </Box>

        <NavigationLink pageKey="login" asButton>Sign in instead</NavigationLink>
      </Box>
    </Box>
  );
};

export default SignUp;