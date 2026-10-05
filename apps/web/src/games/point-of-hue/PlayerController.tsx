import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Box, Button, CountdownBar, Icon, SpectrumColorPicker, Text } from '@inithium/ui';
import { getGameSessionServerNow } from '@inithium/api-client';
import type { PointOfHuePrivateView, PointOfHuePublicView } from '@inithium/game-session';
import type { PlayerControllerProps, WebGameAction } from '../registry';
import { deadlineOf } from '../shared/stage';
import { SURFACE_BG, SURFACE_BORDER, SURFACE_TEXT } from '../../pages/games/surfaceColors';
import { ColorSwatch } from './ColorSwatch';

// How often a moving picker syncs its color to the server - whatever's synced last is what counts
// if time runs out before a lock-in.
const DRAFT_INTERVAL_MS = 400;

const ordinal = (n: number): string => {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
};

const randomHex = (): string => `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0')}`;

interface PickerDraft {
  readonly hex: string;
  // Whether the player has moved the picker - an untouched (random) start color is never graded.
  readonly touched: boolean;
}

// Each round's picker survives a refresh or the phone sleeping - kept per tab, per round.
const draftKey = (code: string, participantId: string, roundNumber: number) => `point-of-hue:picker:${code}:${participantId}:${roundNumber}`;

const readDraft = (key: string): PickerDraft => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(key) ?? 'null') as PickerDraft | null;
    if (stored && /^#[0-9a-f]{6}$/i.test(stored.hex)) return stored;
  } catch {
    // Fall through to a fresh start.
  }
  return { hex: randomHex(), touched: false };
};

const writeDraft = (key: string, draft: PickerDraft): void => {
  try {
    sessionStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Storage full or blocked - the picker just won't survive a refresh.
  }
};

// Sends the picker's color as a `draft` at most every DRAFT_INTERVAL_MS while it moves (always
// including the latest), and straight away when a drag ends.
const useDraftSync = (sendAction: (action: WebGameAction) => boolean) => {
  const lastSentAt = useRef(0);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<string | null>(null);

  const sendNow = useCallback(() => {
    if (pending.current) clearTimeout(pending.current);
    pending.current = null;
    if (!latest.current) return;
    lastSentAt.current = Date.now();
    sendAction({ type: 'draft', payload: { hex: latest.current } });
  }, [sendAction]);

  const push = useCallback(
    (hex: string) => {
      latest.current = hex;
      const wait = DRAFT_INTERVAL_MS - (Date.now() - lastSentAt.current);
      if (wait <= 0) sendNow();
      else if (!pending.current) pending.current = setTimeout(sendNow, wait);
    },
    [sendNow],
  );

  const flush = useCallback(
    (hex: string) => {
      latest.current = hex;
      sendNow();
    },
    [sendNow],
  );

  useEffect(() => () => {
    if (pending.current) clearTimeout(pending.current);
  }, []);

  return { push, flush };
};

const Screen = ({ children }: { children: ReactNode }) => (
  <Box flex={{ direction: 'col', align: 'center', justify: 'center', gap: 20 }} padding={{ base: 20 }} className="w-full flex-1 text-center">
    {children}
  </Box>
);

const Standing = ({ me }: { me: PointOfHuePrivateView }) => (
  <Text as="p" className="text-lg font-bold" textColor={SURFACE_TEXT}>
    {me.total} points{me.rank ? ` · ${ordinal(me.rank)} of ${me.playerCount}` : ''}
  </Text>
);

const GuessPicker = ({
  storageKey,
  disabled,
  sendAction,
}: {
  storageKey: string;
  disabled: boolean;
  sendAction: (action: WebGameAction) => boolean;
}) => {
  const [draft, setDraft] = useState<PickerDraft>(() => readDraft(storageKey));
  useEffect(() => {
    const restored = readDraft(storageKey);
    setDraft(restored);
    writeDraft(storageKey, restored);
  }, [storageKey]);
  const sync = useDraftSync(sendAction);

  const change = (hex: string) => {
    const next = { hex, touched: true };
    setDraft(next);
    writeDraft(storageKey, next);
    sync.push(hex);
  };

  return (
    <Box flex={{ direction: 'col', gap: 16 }} className="w-full max-w-md">
      <SpectrumColorPicker value={draft.hex} onChange={change} onChangeEnd={sync.flush} disabled={disabled} label="Your color" />
      <Button
        variant={{ kind: 'filled', color: 'primary' }}
        className="w-full py-3 text-lg disabled:opacity-50"
        disabled={disabled}
        onClick={() => sendAction({ type: 'submit', payload: { hex: draft.hex } })}
      >
        Lock in
      </Button>
      <Text as="p" className="text-xs" textColor={SURFACE_TEXT}>
        {draft.touched
          ? 'Locking in early earns a speed bonus. If time runs out, the color above still counts.'
          : 'Drag to match the color - an untouched picker doesn’t count.'}
      </Text>
    </Box>
  );
};

const Comparison = ({ guessHex, targetHex }: { guessHex: string | null; targetHex: string }) => (
  <div className="grid w-full max-w-md grid-cols-2 gap-3">
    {[
      { title: 'Your color', hex: guessHex },
      { title: 'The color', hex: targetHex },
    ].map(({ title, hex }) => (
      <Box key={title} flex={{ direction: 'col', align: 'center', gap: 8 }}>
        <Text as="span" className="text-xs font-bold uppercase tracking-wide" textColor={SURFACE_TEXT}>
          {title}
        </Text>
        {hex ? (
          <ColorSwatch hex={hex} label={`${title}: ${hex}`} className="aspect-square w-full rounded-xl" />
        ) : (
          <Box flex={{ justify: 'center', align: 'center' }} className="aspect-square w-full rounded-xl border-2 border-dashed border-surface-400">
            <Icon as="span" name="Prohibit" size={40} />
          </Box>
        )}
        <Text as="span" className="font-mono text-sm uppercase" textColor={SURFACE_TEXT}>
          {hex ?? '—'}
        </Text>
      </Box>
    ))}
  </div>
);

// A player's phone while Point of Hue runs: memorize (watching the host screen), recreate the color
// on the picker, then see it side by side with the original.
export const PlayerController = ({ session, publicView, privateView, participantId, status, sendAction }: PlayerControllerProps) => {
  const view = publicView as PointOfHuePublicView;
  const me = privateView as PointOfHuePrivateView | null;
  const timer = (totalMs: number) => (
    <CountdownBar endsAt={deadlineOf(view)} pausedRemainingMs={view.pausedRemainingMs} totalMs={totalMs} now={getGameSessionServerNow} className="max-w-md" />
  );

  if (!me) {
    return (
      <Screen>
        <Text as="p" textColor={SURFACE_TEXT}>
          Connecting…
        </Text>
      </Screen>
    );
  }

  if (!me.isPlaying) {
    return (
      <Screen>
        <Icon as="span" name="Palette" size={56} />
        <Text as="p" className="text-lg" textColor={SURFACE_TEXT}>
          This game started without you - you’ll be in the next one.
        </Text>
      </Screen>
    );
  }

  switch (view.phase) {
    case 'countdown':
    case 'viewing':
      return (
        <Screen>
          <Icon as="span" name="Eye" size={64} />
          <Text as="h1" className="text-3xl font-black" textColor={SURFACE_TEXT}>
            {view.phase === 'countdown' ? 'Get ready!' : 'Memorize the color!'}
          </Text>
          <Text as="p" textColor={SURFACE_TEXT}>
            {view.paused ? 'The host paused the game.' : 'Look at the host screen - you’ll recreate it from memory.'}
          </Text>
          {view.phase === 'viewing' && timer(view.viewMs)}
          <Standing me={me} />
        </Screen>
      );

    case 'guessing':
      if (me.lockedHex) {
        return (
          <Screen>
            <Icon as="span" name="LockSimple" size={48} />
            <Text as="h1" className="text-3xl font-black" textColor={SURFACE_TEXT}>
              Locked in
            </Text>
            <ColorSwatch hex={me.lockedHex} label={`Your color: ${me.lockedHex}`} className="aspect-square w-40 rounded-2xl" />
            <Text as="p" textColor={SURFACE_TEXT}>
              Waiting for everyone else…
            </Text>
            {timer(view.guessMs)}
          </Screen>
        );
      }
      return (
        <Screen>
          <Text as="h1" className="text-2xl font-black" textColor={SURFACE_TEXT}>
            Round {view.roundNumber} of {view.roundCount} - match it!
          </Text>
          {timer(view.guessMs)}
          {view.paused && (
            <Text as="p" className="font-medium" textColor={SURFACE_TEXT}>
              The host paused the game.
            </Text>
          )}
          <GuessPicker
            storageKey={draftKey(session.code, participantId, view.roundNumber)}
            disabled={view.paused || status !== 'open'}
            sendAction={sendAction}
          />
        </Screen>
      );

    case 'reveal': {
      const target = me.result?.targetHex ?? view.target;
      return (
        <Screen>
          <Text as="h1" className="text-3xl font-black" textColor={SURFACE_TEXT}>
            {me.result ? `+${me.result.points}` : 'No guess'}
          </Text>
          {target && <Comparison guessHex={me.result?.hex ?? null} targetHex={target} />}
          {me.result && (
            <Box
              flex={{ direction: 'col', gap: 4 }}
              padding={{ base: 12 }}
              bgColor={SURFACE_BG}
              borderColor={SURFACE_BORDER}
              className="w-full max-w-md rounded-xl"
            >
              <Text as="p" className="text-lg font-bold" textColor={SURFACE_TEXT}>
                {Math.round(me.result.accuracy * 100)}% match
              </Text>
              <Text as="p" className="text-sm" textColor={SURFACE_TEXT}>
                {me.result.accuracyPoints} for accuracy
                {me.result.lockedIn ? ` + ${me.result.speedBonus} speed bonus` : ' (counted when time ran out - no speed bonus)'}
              </Text>
            </Box>
          )}
          <Standing me={me} />
        </Screen>
      );
    }

    case 'final':
      return (
        <Screen>
          <Icon as="span" name="Trophy" size={64} weight="fill" className={me.rank === 1 ? 'text-amber-500' : ''} />
          <Text as="h1" className="text-3xl font-black" textColor={SURFACE_TEXT}>
            {me.rank === 1 ? 'You won!' : me.rank ? `You finished ${ordinal(me.rank)}` : 'Game over'}
          </Text>
          <Standing me={me} />
          <Text as="p" textColor={SURFACE_TEXT}>
            Look at the host screen for the final standings.
          </Text>
        </Screen>
      );
  }
};
