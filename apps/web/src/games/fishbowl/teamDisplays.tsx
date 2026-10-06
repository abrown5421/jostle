import type { ReactNode } from 'react';
import { Avatar, Box, Icon, Pill, Text, mergeClassNames, resolveColorClass } from '@inithium/ui';
import type { SessionParticipant } from '@inithium/api-client';
import type { FishbowlPublicView, FishbowlTeamView, FishbowlTurnRecap } from '@inithium/game-session';
import { resolveParticipantAvatarProps } from '../shared/participants';
import { SURFACE_BG, SURFACE_BORDER, SURFACE_TEXT } from '../../pages/games/surfaceColors';
import { ROUND_RULES } from './roundRules';

// Team-shaped building blocks shared by Fishbowl's host screen and phones.

type People = ReadonlyMap<string, SessionParticipant>;

export const nameOf = (people: People, participantId: string | null | undefined): string =>
  (participantId && people.get(participantId)?.name) || 'Former player';

export const teamById = (view: FishbowlPublicView, teamId: string | null | undefined): FishbowlTeamView | undefined =>
  view.teams.find((team) => team.id === teamId);

export const TeamBadge = ({ team, className }: { team: Pick<FishbowlTeamView, 'name' | 'color'>; className?: string }) => (
  <span className={mergeClassNames('inline-flex items-center gap-2 font-bold', className)}>
    <span className={mergeClassNames('h-3 w-3 flex-none rounded-full', resolveColorClass('bg', { color: team.color, intensity: 500 }))} />
    {team.name}
  </span>
);

const MemberChip = ({ participant, name, isPresenter }: { participant?: SessionParticipant; name: string; isPresenter: boolean }) => (
  <li className="flex items-center gap-2">
    <Avatar
      {...resolveParticipantAvatarProps({ name, avatar: participant?.avatar ?? null })}
      size={24}
      status={participant?.isConnected ? 'online' : 'offline'}
    />
    <span className={mergeClassNames('truncate text-sm', isPresenter && 'font-bold')}>{name}</span>
    {isPresenter && <Icon as="span" name="Microphone" size={14} weight="fill" />}
  </li>
);

// Every team's score, with the team on turn (and its live turn points) called out.
export const TeamScoreboard = ({
  view,
  people,
  highlightTeamId,
  showMembers = true,
}: {
  view: FishbowlPublicView;
  people: People;
  highlightTeamId?: string | null;
  showMembers?: boolean;
}) => (
  <ul className="flex w-full flex-col gap-3">
    {view.teams.map((team) => {
      const isActive = team.id === view.activeTeamId;
      return (
        <li
          key={team.id}
          className={mergeClassNames(
            'rounded-xl border-l-8 p-3',
            resolveColorClass('border', { color: team.color, intensity: 500 }),
            resolveColorClass('bg', SURFACE_BG),
            resolveColorClass('text', SURFACE_TEXT),
            team.id === highlightTeamId && 'ring-2 ring-primary-500',
          )}
        >
          <Box flex={{ direction: 'row', justify: 'between', align: 'center', gap: 8 }}>
            <TeamBadge team={team} className="text-lg" />
            <span className="flex items-center gap-2">
              {isActive && view.turnPoints > 0 && <Pill color={{ color: 'green', intensity: 200 }}>+{view.turnPoints}</Pill>}
              <span className="text-2xl font-black tabular-nums">{team.total}</span>
            </span>
          </Box>
          {showMembers && (
            <ul className="mt-2 grid grid-cols-2 gap-1">
              {team.members.map((memberId) => (
                <MemberChip
                  key={memberId}
                  participant={people.get(memberId)}
                  name={nameOf(people, memberId)}
                  isPresenter={isActive && memberId === view.presenterId}
                />
              ))}
            </ul>
          )}
        </li>
      );
    })}
  </ul>
);

export const RoundBanner = ({ round }: { round: FishbowlPublicView['round'] }) => {
  const { title, rule, icon } = ROUND_RULES[round];
  return (
    <Box flex={{ direction: 'col', align: 'center', gap: 8 }} className="text-center">
      <Icon as="span" name={icon} size={56} />
      <Text as="p" className="text-sm font-bold uppercase tracking-widest" textColor={SURFACE_TEXT}>
        Round {round} of 3
      </Text>
      <Text as="h2" className="text-4xl font-black" textColor={SURFACE_TEXT}>
        {title}
      </Text>
      <Text as="p" className="text-lg" textColor={SURFACE_TEXT}>
        {rule}
      </Text>
    </Box>
  );
};

// What the turn just finished got through.
export const TurnRecap = ({ recap, view, people }: { recap: FishbowlTurnRecap; view: FishbowlPublicView; people: People }) => {
  const team = teamById(view, recap.teamId);
  return (
    <Box
      flex={{ direction: 'col', gap: 8 }}
      padding={{ base: 16 }}
      bgColor={SURFACE_BG}
      borderColor={SURFACE_BORDER}
      className="w-full rounded-xl text-left"
    >
      <Text as="p" className="font-semibold" textColor={SURFACE_TEXT}>
        {nameOf(people, recap.presenterId)} got {recap.points} {recap.points === 1 ? 'clue' : 'clues'}
        {team ? ' for ' : ''}
        {team && <TeamBadge team={team} className="inline-flex" />}
        {recap.roundEnded ? ' and emptied the bowl!' : ''}
      </Text>
      {recap.guessed.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {recap.guessed.map((clue, index) => (
            <li key={`${clue}-${index}`}>
              <Pill color={{ color: 'surface', intensity: 200 }} className="text-sm">
                {clue}
              </Pill>
            </li>
          ))}
        </ul>
      )}
    </Box>
  );
};

// Final standings: teams by rank with each round's points.
export const TeamResults = ({ view, highlightTeamId, footer }: { view: FishbowlPublicView; highlightTeamId?: string | null; footer?: ReactNode }) => {
  const ranked = [...view.teams].sort((a, b) => a.rank - b.rank);
  return (
    <Box flex={{ direction: 'col', align: 'center', gap: 16 }} className="w-full">
      <Text as="h2" className="text-4xl font-black" textColor={SURFACE_TEXT}>
        {ranked.filter((team) => team.rank === 1).length > 1 ? 'It’s a tie!' : `${ranked[0]?.name ?? ''} wins!`}
      </Text>
      <table className={mergeClassNames('w-full max-w-2xl border-separate border-spacing-y-2 text-left', resolveColorClass('text', SURFACE_TEXT))}>
        <thead>
          <tr className="text-xs uppercase tracking-wide">
            <th className="px-3">#</th>
            <th className="px-3">Team</th>
            {[1, 2, 3].map((round) => (
              <th key={round} className="px-3 text-right">
                {ROUND_RULES[round as 1 | 2 | 3].title}
              </th>
            ))}
            <th className="px-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((team) => (
            <tr
              key={team.id}
              className={mergeClassNames(
                resolveColorClass('bg', team.id === highlightTeamId ? { color: 'primary', intensity: 200 } : SURFACE_BG),
                '[&>td]:px-3 [&>td]:py-2',
              )}
            >
              <td className="rounded-l-lg text-lg font-black">
                {team.rank === 1 ? <Icon as="span" name="Trophy" size={20} weight="fill" className="text-amber-500" /> : team.rank}
              </td>
              <td>
                <TeamBadge team={team} />
              </td>
              {team.roundScores.map((points, index) => (
                <td key={index} className="text-right tabular-nums">
                  {points}
                </td>
              ))}
              <td className="rounded-r-lg text-right text-xl font-black tabular-nums">{team.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {footer}
    </Box>
  );
};
