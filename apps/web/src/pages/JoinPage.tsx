import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  alert,
  Avatar,
  Box,
  Button,
  IconButton,
  Input,
  Text,
  resolveAvatarConfigProps,
  useNavigateWithTransition,
} from '@inithium/ui';
import {
  getGameSessionError,
  getPlayerCredential,
  savePlayerCredential,
  useJoinGameSessionMutation,
} from '@inithium/api-client';
import { useCurrentUser } from '../app/useCurrentUser';
import { useGuestAvatarBank } from './session/useGuestAvatarBank';

// Mirrors @inithium/game-session's SESSION_CODE_LENGTH / MAX_NAME_LENGTH - that package is
// server-only at runtime, and the server re-validates both anyway.
const CODE_LENGTH = 6;
const MAX_NAME_LENGTH = 16;
const AVATAR_SIZE = 96;

const normalizeCode = (raw: string): string =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, CODE_LENGTH);

interface FieldErrors {
  name?: string;
  code?: string;
}

// Open to guests and members alike. Both fields are editable regardless of what pre-fills them:
// the name from the signed-in account (if any), the code from a QR code's ?code= param (if any).
export const JoinPage = () => {
  const navigate = useNavigateWithTransition();
  const [searchParams] = useSearchParams();
  const { currentUser, isResolving } = useCurrentUser();
  const [joinGameSession, { isLoading }] = useJoinGameSessionMutation();

  const [code, setCode] = useState(() =>
    normalizeCode(searchParams.get('code') ?? ''),
  );
  const [name, setName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const guestAvatar = useGuestAvatarBank();

  // The account can resolve after first render - pre-fill then, but never clobber anything the
  // user has already typed.
  const hasEditedName = useRef(false);
  const accountFirstName = currentUser?.firstName;
  useEffect(() => {
    if (!hasEditedName.current && accountFirstName)
      setName(accountFirstName.slice(0, MAX_NAME_LENGTH));
  }, [accountFirstName]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const errors: FieldErrors = {};
    if (!trimmedName) errors.name = 'Please enter a name.';
    if (code.length !== CODE_LENGTH)
      errors.code = `Codes are ${CODE_LENGTH} characters.`;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const joined = await joinGameSession({
        code,
        name: trimmedName,
        // Reclaims this device's existing seat (and name) if it already has one in this session.
        rejoinToken: getPlayerCredential(code)?.playerToken,
        // A signed-in player's profile avatar is applied server-side; only guests send one.
        avatar: currentUser ? undefined : guestAvatar.avatar,
      }).unwrap();
      savePlayerCredential(code, {
        participantId: joined.participantId,
        playerToken: joined.playerToken,
        name: trimmedName,
      });
      navigate(`/play/${code}`);
    } catch (error) {
      const { code: errorCode, message } = getGameSessionError(error);
      if (errorCode === 'NAME_TAKEN' || errorCode === 'INVALID_NAME') {
        setFieldErrors({ name: message });
      } else if (
        errorCode === 'SESSION_NOT_FOUND' ||
        errorCode === 'SESSION_NOT_JOINABLE' ||
        errorCode === 'SESSION_FULL'
      ) {
        setFieldErrors({ code: message });
      } else {
        alert.danger(message, { position: 'bottom-right' });
      }
    }
  };

  return (
    <Box
      flex={{ direction: 'col', gap: 16, justify: 'center', align: 'center' }}
      padding={{ base: 32 }}
      className="w-full flex-1"
    >
      <Text as="h1" className="text-3xl font-bold">
        Join a game
      </Text>

      {/* A real <form> so Enter submits from either field on a phone keyboard. */}
      <form
        className="w-[95%] md:w-2/3 lg:w-1/3"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <Box
          flex={{ direction: 'col', gap: 24, align: 'stretch' }}
          bgColor={{ color: 'surface', intensity: 200 }}
          padding={{ base: 32 }}
          className="w-full rounded"
        >
          {/* Initials spell whatever is typed in the name field - the same screen name the lobby shows. */}
          <Box flex={{ direction: 'col', align: 'center', gap: 8 }}>
            {isResolving ? (
              // Holds the avatar's space so the form doesn't jump while the account loads.
              <div style={{ height: AVATAR_SIZE }} />
            ) : currentUser ? (
              <>
                <Avatar {...resolveAvatarConfigProps(currentUser.avatar, name.trim() || '?')} size={AVATAR_SIZE} />
                <Text as="p" className="text-sm" textColor={{ color: 'surface', intensity: 600 }}>
                  Your profile avatar
                </Text>
              </>
            ) : (
              <Box flex={{ direction: 'row', align: 'center', gap: 16 }}>
                <IconButton icon="CaretLeft" label="Previous avatar" onClick={guestAvatar.goBack} disabled={!guestAvatar.canGoBack} />
                <Avatar {...resolveAvatarConfigProps(guestAvatar.avatar, name.trim() || '?')} size={AVATAR_SIZE} />
                <IconButton icon="CaretRight" label="New random avatar" onClick={guestAvatar.goForward} />
              </Box>
            )}
          </Box>
          <Input
            label="Name"
            required
            value={name}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="nickname"
            onChange={(event) => {
              hasEditedName.current = true;
              setName(event.target.value);
            }}
            error={Boolean(fieldErrors.name)}
            helperText={fieldErrors.name}
          />
          <Input
            label="Join code"
            required
            value={code}
            maxLength={CODE_LENGTH}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="font-mono uppercase tracking-[0.3em]"
            onChange={(event) => setCode(normalizeCode(event.target.value))}
            error={Boolean(fieldErrors.code)}
            helperText={fieldErrors.code}
          />
          <Button
            type="submit"
            variant={{ kind: 'filled', color: 'secondary' }}
            disabled={isLoading}
          >
            {isLoading ? 'Joining…' : 'Join'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default JoinPage;
