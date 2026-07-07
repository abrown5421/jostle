import type { Friend } from '@inithium/types';
import { createCrudService, CrudService } from '@inithium/api-core';
import type { PubSub } from '@inithium/pubsub';
import { FriendModel } from './friends.model.js';

export interface FriendsService extends CrudService<Friend> {
  readonly readAllByUser: (userId: string) => Promise<readonly Friend[]>;
}

const base = createCrudService<Friend>(FriendModel);

let pubsub: PubSub | null = null;

export const setFriendsPubSub = (instance: PubSub): void => {
  pubsub = instance;
};

const readPopulatedOne = async (id: string): Promise<Friend | null> =>
  FriendModel
    .findById(id)
    .populate('requester')
    .populate('recipient')
    .lean<Friend>()
    .exec();

export const friendsService: FriendsService = {
  ...base,

  createOne: async (data) => {
    const payload = {
      ...(data as Partial<Friend>),
      date_sent: new Date().toISOString(),
      status: 'pending' as const,
    };
    const created = await base.createOne(payload);

    const populated = await readPopulatedOne(String(created._id));
    if (populated) {
      await pubsub?.publish(`user:${populated.recipient._id}`, 'friend-request', populated);
    }

    return created;
  },

  updateOne: async (id, data) => {
    const raw = data as Partial<Friend>;
    const payload: Partial<Friend> = { ...raw };

    if (raw.status === 'accepted' && !raw.date_accepted) {
      payload.date_accepted = new Date().toISOString();
    }

    const updated = await base.updateOne(id, payload);

    if (updated && raw.status === 'accepted') {
      const populated = await readPopulatedOne(id);
      if (populated) {
        await pubsub?.publish(`user:${populated.requester._id}`, 'friend-request-accepted', populated);
      }
    }

    return updated;
  },

  readAllByUser: async (userId) =>
    FriendModel
      .find({ $or: [{ requester: userId }, { recipient: userId }] } as any)
      .populate('requester')
      .populate('recipient')
      .lean<Friend[]>()
      .exec(),
};