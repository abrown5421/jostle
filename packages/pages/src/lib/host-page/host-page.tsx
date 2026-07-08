import { Box } from '@inithium/ui';
import type { GameSession } from '@inithium/types';
import { useParams } from 'react-router-dom';
import {
  sessionsApi,
  useSessionQuery,
  useAppDispatch,
  usePubSubChannel,
} from '@inithium/store';
import { buildChannel } from '@inithium/pubsub';

const HostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { data: session, isLoading } = useSessionQuery(id!);

  usePubSubChannel(buildChannel('session', id!), {
    'player:joined': ({ session: updated }: { session: GameSession }) => {
      dispatch(sessionsApi.util.updateQueryData('readOneSession', id!, () => updated));
    },
    'player:left': ({ session: updated }: { session: GameSession }) => { 
      dispatch(sessionsApi.util.updateQueryData('readOneSession', id!, () => updated));
    },
    'session:updated': (updated: GameSession) => {
      dispatch(sessionsApi.util.updateQueryData('readOneSession', id!, () => updated));
    },
  });

  if (isLoading || !session) {
    return <Box flex justify="center" align="center" fullHeight>Loading lobby...</Box>;
  }

  return (
    <Box flex direction="col" fullHeight className="gap-4 p-6">
      <h1 className="text-2xl font-bold">Join Code: {session.join_code}</h1>
      <ul className="flex flex-col gap-2">
        {session.players.map((player) => ( 
          <li key={player.player_id} className="flex items-center gap-2">
            <span>{player.display_name}</span>
            {player.is_host && <span className="text-xs text-gray-400">(host)</span>}
            {!player.connected && <span className="text-xs text-red-400">disconnected</span>}
          </li>
        ))}
      </ul>
    </Box>
  );
};

export default HostPage;