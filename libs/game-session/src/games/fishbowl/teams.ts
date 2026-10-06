import type { SessionParticipant } from '../../contracts/session.contract';
import { shuffle } from './clues';
import type { FishbowlTeam } from './fishbowl.types';

// The catalogue allows up to 5 teams.
export const TEAM_PRESETS = [
  { name: 'Red', color: 'red' },
  { name: 'Blue', color: 'blue' },
  { name: 'Green', color: 'green' },
  { name: 'Yellow', color: 'amber' },
  { name: 'Purple', color: 'purple' },
] as const;

// Shuffled, then dealt round the teams so sizes differ by at most one.
export const assignTeams = (participantIds: readonly string[], teamCount: number, random: () => number): FishbowlTeam[] => {
  const dealt = shuffle(participantIds, random);
  return TEAM_PRESETS.slice(0, teamCount).map((preset, index) => ({
    id: `team-${index + 1}`,
    name: preset.name,
    color: preset.color,
    members: dealt.filter((_, position) => position % teamCount === index),
    presenterCursor: 0,
  }));
};

export const teamOf = (teams: readonly FishbowlTeam[], participantId: string): FishbowlTeam | undefined =>
  teams.find((team) => team.members.includes(participantId));

export interface PresenterPick {
  readonly presenterId: string;
  readonly team: FishbowlTeam;
}

// The team's next presenter in rotation, passing over anyone disconnected; the cursor moves past
// whoever is picked. Null if nobody on the team is connected.
export const pickPresenter = (team: FishbowlTeam, participants: readonly SessionParticipant[]): PresenterPick | null => {
  const isConnected = (participantId: string) => participants.some(({ id, isConnected: connected }) => id === participantId && connected);
  for (let offset = 0; offset < team.members.length; offset += 1) {
    const index = (team.presenterCursor + offset) % team.members.length;
    const presenterId = team.members[index];
    if (isConnected(presenterId)) return { presenterId, team: { ...team, presenterCursor: (index + 1) % team.members.length } };
  }
  return null;
};

export interface TurnPick {
  readonly teamIndex: number;
  readonly presenterId: string;
  readonly teams: readonly FishbowlTeam[];
}

const withTeam = (teams: readonly FishbowlTeam[], index: number, team: FishbowlTeam): FishbowlTeam[] =>
  teams.map((candidate, position) => (position === index ? team : candidate));

// Who goes next, starting the search at team `fromIndex`: the first team (in turn order) with a
// connected member to present. Empty teams are passed over. If nobody at all is connected, the
// first non-empty team's next member is picked anyway, so the game never stalls - the host can
// skip them.
export const pickNextTurn = (
  teams: readonly FishbowlTeam[],
  fromIndex: number,
  participants: readonly SessionParticipant[],
): TurnPick | null => {
  const order = teams.map((_, offset) => (fromIndex + offset) % teams.length);
  for (const teamIndex of order) {
    const pick = pickPresenter(teams[teamIndex], participants);
    if (pick) return { teamIndex, presenterId: pick.presenterId, teams: withTeam(teams, teamIndex, pick.team) };
  }
  const fallbackIndex = order.find((teamIndex) => teams[teamIndex].members.length > 0);
  if (fallbackIndex === undefined) return null;
  const team = teams[fallbackIndex];
  const cursor = team.presenterCursor % team.members.length;
  return {
    teamIndex: fallbackIndex,
    presenterId: team.members[cursor],
    teams: withTeam(teams, fallbackIndex, { ...team, presenterCursor: (cursor + 1) % team.members.length }),
  };
};

export const removeMember = (teams: readonly FishbowlTeam[], participantId: string): FishbowlTeam[] =>
  teams.map((team) => {
    const index = team.members.indexOf(participantId);
    if (index === -1) return team;
    const members = team.members.filter((member) => member !== participantId);
    const cursor = index < team.presenterCursor ? team.presenterCursor - 1 : team.presenterCursor;
    return { ...team, members, presenterCursor: members.length ? cursor % members.length : 0 };
  });
