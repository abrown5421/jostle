import { audio } from '@jostle/assets';
import {
  DisplayNameTakenError,
  mergeServerError,
  SessionNotFoundError,
  useKickedRedirect,
  validateJoinFormCompletion,
} from '@jostle/lobby';
import type { JoinFormErrors, JoinFormFields } from '@jostle/lobby';
import { Button, Container, Input, Text, useSoundEffect } from '@jostle/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { pubsub } from '../messaging/pubsub-client.js';
import { sessionsClient } from '../sessions/sessions-client.js';

function JoinedWaitingRoom({ sessionId, playerId }: { sessionId: string; playerId: string }) {
  const navigate = useNavigate();
  const playLeaveSound = useSoundEffect(audio.leave);

  useKickedRedirect({
    pubsub,
    sessionId,
    playerId,
    onKicked: () => {
      playLeaveSound();
      navigate('/');
    },
  });

  return (
    <Container
      direction="col"
      horizontalAlign="center"
      verticalAlign="center"
      gap={4}
      className="w-full min-h-[calc(100vh-var(--navbar-height,4rem))]"
    >
      <Text fontSize="xl" fontWeight="bold" textColor="content-primary">
        You&apos;re in!
      </Text>
      <Text textColor="content-secondary">Waiting for the host to start the game...</Text>
    </Container>
  );
}

export function JoinPage() {
  const [searchParams] = useSearchParams();
  const [fields, setFields] = useState<JoinFormFields>({ joinCode: searchParams.get('code') ?? '', displayName: '' });
  const [errors, setErrors] = useState<JoinFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joined, setJoined] = useState<{ sessionId: string; playerId: string } | null>(null);

  if (joined) {
    return <JoinedWaitingRoom sessionId={joined.sessionId} playerId={joined.playerId} />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const completionErrors = validateJoinFormCompletion(fields);
    if (Object.keys(completionErrors).length > 0) {
      setErrors(completionErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      const result = await sessionsClient.joinSession({ joinCode: fields.joinCode, displayName: fields.displayName });
      setJoined(result);
    } catch (error) {
      if (error instanceof DisplayNameTakenError) {
        setErrors((prev) => mergeServerError(prev, { field: 'displayName', message: error.message }));
      } else if (error instanceof SessionNotFoundError) {
        setErrors((prev) => mergeServerError(prev, { field: 'joinCode', message: error.message }));
      } else {
        throw error;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container
      direction="col"
      horizontalAlign="center"
      verticalAlign="center"
      gap={4}
      className="w-full min-h-[calc(100vh-var(--navbar-height,4rem))]"
    >
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <Input
          label="Join Code"
          value={fields.joinCode}
          setValue={(joinCode) => setFields((prev) => ({ ...prev, joinCode }))}
          color="primary"
          required
        />
        {errors.joinCode && (
          <Text fontSize="sm" className="text-red-400">
            {errors.joinCode}
          </Text>
        )}
        <Input
          label="Display Name"
          value={fields.displayName}
          setValue={(displayName) => setFields((prev) => ({ ...prev, displayName }))}
          color="secondary"
          required
        />
        {errors.displayName && (
          <Text fontSize="sm" className="text-red-400">
            {errors.displayName}
          </Text>
        )}
        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? 'Joining...' : 'Join'}
        </Button>
      </form>
    </Container>
  );
}