import { Button, Container, Input, PasswordInput, Text } from '@jostle/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/index.js';

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({ firstName, lastName: lastName || undefined, email, password, confirmPassword });
      navigate('/');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container direction="col" horizontalAlign="center" verticalAlign="center" className="min-h-[calc(100vh-73px)] px-4 py-8">
      <Container
        direction="col"
        gap={6}
        padding={8}
        backgroundColor="surface-secondary"
        borderColor="surface-tertiary"
        className="w-full max-w-sm rounded-lg border"
      >
        <Text fontSize="2xl" fontWeight="bold" textColor="content-primary">
          Sign Up
        </Text>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="First Name *" value={firstName} setValue={setFirstName} autoComplete="given-name" required />
          <Input label="Last Name" value={lastName} setValue={setLastName} autoComplete="family-name" />
          <Input type="email" label="Email *" value={email} setValue={setEmail} autoComplete="email" required />
          <PasswordInput label="Password *" value={password} setValue={setPassword} autoComplete="new-password" required />
          <PasswordInput
            label="Confirm Password *"
            value={confirmPassword}
            setValue={setConfirmPassword}
            autoComplete="new-password"
            required
          />

          {error && (
            <Text fontSize="sm" className="text-red-400">
              {error}
            </Text>
          )}

          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
            {isSubmitting ? 'Signing Up…' : 'Sign Up'}
          </Button>
        </form>

        <Container horizontalAlign="center" gap={2}>
          <Text fontSize="sm" textColor="content-secondary">
            Already have an account?
          </Text>
          <Button variant="link" type="button" onClick={() => navigate('/login')}>
            Log In
          </Button>
        </Container>
      </Container>
    </Container>
  );
}
