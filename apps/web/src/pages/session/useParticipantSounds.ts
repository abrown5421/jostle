import { useEffect, useRef } from 'react';
import type { SessionParticipant } from '@inithium/api-client';
import { playSound } from '../../app/sounds';

// Plays a cue when a participant appears in or drops out of the list. The first list seen is the
// baseline, so a host refresh doesn't replay a join for everyone already seated. A disconnected
// player stays in the list (offline), so only a real removal plays the leave cue.
export const useParticipantSounds = (participants: readonly SessionParticipant[] | undefined): void => {
  const previousIds = useRef<ReadonlySet<string> | null>(null);

  useEffect(() => {
    if (!participants) return;
    const currentIds = new Set(participants.map((participant) => participant.id));
    const previous = previousIds.current;
    previousIds.current = currentIds;
    if (!previous) return;

    if ([...currentIds].some((id) => !previous.has(id))) playSound('join');
    if ([...previous].some((id) => !currentIds.has(id))) playSound('leave');
  }, [participants]);
};
