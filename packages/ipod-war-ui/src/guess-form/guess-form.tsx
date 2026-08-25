import { Button, Container, Input } from '@jostle/ui';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { IpodWarSubmissionGuess } from '../client/index.js';

export interface GuessFormProps {
  readonly requireArtist: boolean;
  readonly requireAlbum: boolean;
  readonly disabled?: boolean;
  readonly initialGuess?: IpodWarSubmissionGuess | null;
  readonly onSubmit: (guess: IpodWarSubmissionGuess) => void;
}

export function GuessForm({ requireArtist, requireAlbum, disabled, initialGuess, onSubmit }: GuessFormProps) {
  const [trackName, setTrackName] = useState(initialGuess?.trackName ?? '');
  const [artistName, setArtistName] = useState(initialGuess?.artistName ?? '');
  const [albumName, setAlbumName] = useState(initialGuess?.albumName ?? '');
  const [locked, setLocked] = useState(Boolean(initialGuess));

  const isDisabled = disabled || locked;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDisabled || trackName.trim().length === 0) return;
    setLocked(true);
    onSubmit({
      trackName: trackName.trim(),
      artistName: requireArtist ? artistName.trim() || undefined : undefined,
      albumName: requireAlbum ? albumName.trim() || undefined : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Container direction="col" gap={3} className="w-full">
        <Input
          label="Track Name"
          value={trackName}
          setValue={setTrackName}
          color="primary"
          required
          disabled={isDisabled}
        />
        {requireArtist && (
          <Input
            label="Artist Name"
            value={artistName}
            setValue={setArtistName}
            color="secondary"
            disabled={isDisabled}
          />
        )}
        {requireAlbum && (
          <Input
            label="Album Name"
            value={albumName}
            setValue={setAlbumName}
            color="accent"
            disabled={isDisabled}
          />
        )}
        <Button type="submit" disabled={isDisabled || trackName.trim().length === 0}>
          {locked ? 'Submitted' : 'Submit Guess'}
        </Button>
      </Container>
    </form>
  );
}
