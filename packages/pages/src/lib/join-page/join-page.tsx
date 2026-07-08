import { useState } from 'react';
import { navigationService } from '@inithium/router';
import { useSelector } from 'react-redux';
import {
  selectActiveUser,
  useLazyReadSessionByJoinCodeQuery,
  useJoinSessionMutation,
} from '@inithium/store';
import { Box, Button, Input } from '@inithium/ui';

const JoinPage: React.FC = () => {
  const activeUser = useSelector(selectActiveUser);
  const [joinCode, setJoinCode] = useState('');
  const [displayName, setDisplayName] = useState(activeUser?.first_name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [lookupSession, { isFetching: isLookingUp }] = useLazyReadSessionByJoinCodeQuery();
  const [joinSession, { isLoading: isJoining }] = useJoinSessionMutation();

  const handleSubmit = async () => {
    setError(null);

    if (!joinCode.trim() || !displayName.trim()) {
      setError('Enter a join code and a display name.');
      return;
    }

    try {
      const session = await lookupSession(joinCode.trim().toUpperCase()).unwrap();

      const joined = await joinSession({
        id: session._id,
        player: {
          user_id: activeUser?._id,
          display_name: displayName.trim(),
        },
      }).unwrap();

      navigationService.navigate(`/play/${joined._id}`);
    } catch {
      setError('Session not found. Check the code and try again.');
    }
  };

  const isSubmitting = isLookingUp || isJoining;

  return (
    <Box flex direction="col" justify="center" align="center" fullHeight className="w-4/5 md:w-1/3 lg:w-1/5 gap-4">
      <Input label="Join Code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
      <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      {error && <span className="text-sm text-red-400">{error}</span>}
      <Button color="primary" fullWidth disabled={isSubmitting} onClick={handleSubmit}>
        {isSubmitting ? 'Joining...' : 'Join'}
      </Button>
    </Box>
  );
};

export default JoinPage;