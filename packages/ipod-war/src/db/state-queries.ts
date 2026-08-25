import { ObjectId } from 'mongodb';
import type { UpdateFilter } from 'mongodb';
import { ensureIpodWarIndexes, getIpodWarStatesCollection } from './collection.js';
import type {
  IpodWarConfig,
  IpodWarPhase,
  IpodWarRoundRecord,
  IpodWarSongBankEntry,
  IpodWarStateDocument,
  PublicIpodWarState,
} from '../model/index.js';

export function toPublicIpodWarState(document: IpodWarStateDocument): PublicIpodWarState {
  return {
    sessionId: document.sessionId.toString(),
    phase: document.phase,
    currentRoundIndex: document.currentRoundIndex,
    totalRounds: document.songBank.length,
    phaseEndsAt: document.phaseEndsAt ? document.phaseEndsAt.toISOString() : null,
  };
}

export interface CreateIpodWarStateInput {
  readonly sessionId: string;
  readonly config: IpodWarConfig;
  readonly songBank: ReadonlyArray<IpodWarSongBankEntry>;
}

export async function createIpodWarState(
  input: CreateIpodWarStateInput,
): Promise<IpodWarStateDocument> {
  await ensureIpodWarIndexes();
  const now = new Date();

  const document: IpodWarStateDocument = {
    _id: new ObjectId(),
    sessionId: new ObjectId(input.sessionId),
    config: input.config,
    songBank: input.songBank,
    phase: 'idle',
    currentRoundIndex: -1,
    rounds: [],
    phaseEndsAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await getIpodWarStatesCollection().deleteOne({ sessionId: document.sessionId });
  await getIpodWarStatesCollection().insertOne(document);
  return document;
}

export async function getIpodWarStateDocument(
  sessionId: string,
): Promise<IpodWarStateDocument | null> {
  if (!ObjectId.isValid(sessionId)) return null;
  return getIpodWarStatesCollection().findOne({ sessionId: new ObjectId(sessionId) });
}

export interface AppendRoundRecordInput {
  readonly sessionId: string;
  readonly roundIndex: number;
  readonly song: IpodWarSongBankEntry;
  readonly startedAt: Date;
  readonly phaseEndsAt: Date;
}

export async function appendRoundRecord(
  input: AppendRoundRecordInput,
): Promise<IpodWarStateDocument | null> {
  const round: IpodWarRoundRecord = {
    roundIndex: input.roundIndex,
    song: input.song,
    startedAt: input.startedAt,
    phaseEndsAt: input.phaseEndsAt,
  };

  return getIpodWarStatesCollection().findOneAndUpdate(
    { sessionId: new ObjectId(input.sessionId) },
    {
      $set: {
        phase: 'playback' satisfies IpodWarPhase,
        currentRoundIndex: input.roundIndex,
        phaseEndsAt: input.phaseEndsAt,
        updatedAt: new Date(),
      },
      $push: { rounds: round },
    },
    { returnDocument: 'after' },
  );
}

export interface BeginResultsPhaseInput {
  readonly sessionId: string;
  readonly roundIndex: number;
  readonly phaseEndsAt: Date;
  readonly resultsComputedAt: Date;
}

export async function beginResultsPhase(
  input: BeginResultsPhaseInput,
): Promise<IpodWarStateDocument | null> {
  const update: UpdateFilter<IpodWarStateDocument> = {
    $set: {
      phase: 'results' satisfies IpodWarPhase,
      phaseEndsAt: input.phaseEndsAt,
      updatedAt: new Date(),
      [`rounds.${input.roundIndex}.resultsComputedAt`]: input.resultsComputedAt,
    },
  };

  return getIpodWarStatesCollection().findOneAndUpdate(
    { sessionId: new ObjectId(input.sessionId) },
    update,
    { returnDocument: 'after' },
  );
}

export async function markIpodWarEnded(sessionId: string): Promise<IpodWarStateDocument | null> {
  return getIpodWarStatesCollection().findOneAndUpdate(
    { sessionId: new ObjectId(sessionId) },
    {
      $set: {
        phase: 'ended' satisfies IpodWarPhase,
        phaseEndsAt: null,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' },
  );
}
