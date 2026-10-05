import { useEffect, useState } from 'react';
import { createRandomAvatarConfig } from '@inithium/ui';
import type { AvatarConfig } from '@inithium/db';

const STORAGE_KEY = 'jostle:guest-avatars';
// Enough to back through a long reroll streak without letting localStorage grow forever.
const MAX_BANK_SIZE = 50;

interface GuestAvatarBank {
  readonly avatars: readonly AvatarConfig[];
  readonly index: number;
}

const createFreshBank = (): GuestAvatarBank => ({ avatars: [createRandomAvatarConfig()], index: 0 });

// Storage can throw (private mode, blocked site data) or hold something stale - either way a guest
// just starts from a fresh random avatar.
const readBank = (): GuestAvatarBank => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as GuestAvatarBank | null;
    if (stored && Array.isArray(stored.avatars) && stored.avatars[stored.index]) return stored;
  } catch {
    // Fall through to a fresh bank.
  }
  return createFreshBank();
};

const writeBank = (bank: GuestAvatarBank): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bank));
  } catch {
    // Not worth surfacing - the bank just won't survive a reload.
  }
};

export interface UseGuestAvatarBankResult {
  readonly avatar: AvatarConfig;
  readonly canGoBack: boolean;
  readonly goBack: () => void;
  readonly goForward: () => void;
}

// The guest avatar randomizer's history. Forward steps into a look already seen (after going
// back) or rolls a brand new one at the end; back only ever walks the history, never discards it -
// the same arrow semantics as AvatarEditDialog's seed cycling. Persisted so a guest who joins again
// later keeps the look they settled on.
export const useGuestAvatarBank = (): UseGuestAvatarBankResult => {
  const [bank, setBank] = useState(readBank);

  useEffect(() => writeBank(bank), [bank]);

  return {
    avatar: bank.avatars[bank.index]!,
    canGoBack: bank.index > 0,
    goBack: () => setBank(({ avatars, index }) => ({ avatars, index: Math.max(0, index - 1) })),
    goForward: () =>
      setBank(({ avatars, index }) => {
        if (index + 1 < avatars.length) return { avatars, index: index + 1 };
        const grown = [...avatars, createRandomAvatarConfig()].slice(-MAX_BANK_SIZE);
        return { avatars: grown, index: grown.length - 1 };
      }),
  };
};
