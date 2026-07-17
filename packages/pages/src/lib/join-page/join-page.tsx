import { navigationService } from '@inithium/router';
import { selectActiveUser, useJoinSessionMutation } from '@inithium/store';
import { Box, Input, Button, Text } from '@inithium/ui';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

type JoinFormState = {
  playerName: string;
  roomCode: string;
};

type ActiveUserShape = {
  first_name?: string;
  last_name?: string;
} | null | undefined;

const extractFallbackString = (value: string | undefined): string =>
  value ?? '';

const buildFullName = (user: ActiveUserShape): string =>
  `${extractFallbackString(user?.first_name)} ${extractFallbackString(user?.last_name)}`.trim();

const createInitialState = (user: ActiveUserShape) => (code: string | null): JoinFormState => ({
  playerName: buildFullName(user),
  roomCode: extractFallbackString(code ?? undefined).toUpperCase(),
});

const JoinPage: React.FC = () => {
  const activeUser = useSelector(selectActiveUser);
  const [searchParams] = useSearchParams();
  const [joinSession, { isLoading }] = useJoinSessionMutation();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<JoinFormState>(
    createInitialState(activeUser)(searchParams.get('code'))
  );

  const isFormValid = form.playerName.trim().length > 0 && form.roomCode.trim().length > 0;

  const updateField = (field: keyof JoinFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const onJoinSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setError(null);

    try {
      const { session, player } = await joinSession({
        lobbyId: form.roomCode.toUpperCase(),
        displayName: form.playerName.trim(),
      }).unwrap();

      navigationService.navigate(`/lobby?code=${session.lobbyId}&playerId=${player.playerId}`);
    } catch {
      setError('Could not join that room. Check the code and try again.');
    }
  };

  return (
    <Box flex direction="col" justify="center" align="center" fullHeight className='w-4/5 md:w-1/3 lg:w-1/5 gap-4'>
      <Text variant="h5" color="surface2-contrast" overrideClassName='primary-font'>Join Game</Text>

      <form onSubmit={onJoinSubmit} className="w-full flex flex-col gap-4">
        <Input
          label="Player Name"
          value={form.playerName}
          onChange={updateField('playerName')}
          fullWidth
        />

        <Input
          label="Room Code"
          value={form.roomCode}
          onChange={updateField('roomCode')}
          maxLength={6}
          fullWidth
        />

        {error && (
          <Text variant="caption" color="danger">{error}</Text>
        )}

        <Button
          type="submit"
          color="primary"
          disabled={!isFormValid || isLoading}
          fullWidth
        >
          Join Room
        </Button>
      </form>
    </Box>
  );
};

export default JoinPage;