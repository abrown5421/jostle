import { fonts } from '@jostle/assets';
import { Button, Container, Input, PasswordInput, Text } from '@jostle/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/index.js';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container direction="col" horizontalAlign="center" verticalAlign="center" className="min-h-[calc(100vh-73px)] px-4">
      <Container
        direction="col"
        gap={6}
        padding={8}
        backgroundColor="surface-secondary"
        borderColor="surface-tertiary"
        className="w-full max-w-sm rounded-lg border"
      >
        <Text
          fontSize="2xl"
          fontWeight="bold"
          textColor="content-primary"
          className="text-center"
          style={{ fontFamily: fonts.primary }}
        >
          Log In
        </Text>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            label="Email"
            value={email}
            setValue={setEmail}
            color="primary"
            autoComplete="email"
            required
          />
          <PasswordInput
            label="Password"
            value={password}
            setValue={setPassword}
            color="accent"
            autoComplete="current-password"
            required
          />

          {error && (
            <Text fontSize="sm" className="text-red-400">
              {error}
            </Text>
          )}

          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
            {isSubmitting ? 'Logging In…' : 'Log In'}
          </Button>
        </form>

        <Container horizontalAlign="center" gap={2}>
          <Text fontSize="sm" textColor="content-secondary">
            Don&apos;t have an account?
          </Text>
          <Button variant="link" type="button" onClick={() => navigate('/signup')}>
            Sign Up
          </Button>
        </Container>
      </Container>
    </Container>
  );
}
