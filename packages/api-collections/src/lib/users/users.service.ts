import bcrypt from 'bcryptjs';
import type { User } from '@inithium/types';
import { createCrudService, CrudService } from '@inithium/api-core';
import { UserModel } from './users.model.js';
import type { GrowthRange, GrowthStatsResult } from '@inithium/api-core';

export interface UsersService extends CrudService<User> {
  readonly getUserGrowthStats: (range?: GrowthRange) => Promise<GrowthStatsResult>;
}

const base = createCrudService<User>(UserModel);

const createDefaultAvatar = (firstName: string, lastName: string): NonNullable<User['user_avatar']> => {
  const f = firstName.trim() || 'U';
  const l = lastName.trim() || 'User';
  const initials = `${f[0]}${l[0]}`.toUpperCase();

  return {
    src: '',
    alt: `${firstName} ${lastName}`.trim().toLowerCase(),
    fallback: initials,
    size: 'md',
    status: 'offline',
    shape: 'circle',
    background: 'linear-gradient(135deg, #0f5066, #e2e8f0)',
  };
};

const createDefaultBanner = (): NonNullable<User['user_banner']> => ({
  variance: 0.75,
  cell_size: 40,
  x_colors: ['#0f5066', '#115e7a', '#1e293b'],
  y_colors: ['#1e293b', '#64748b', '#e2e8f0'],
});

const RANGE_TO_MS: Record<Exclude<GrowthRange, 'all'>, number> = {
  week: 7 * 86_400_000,
  month: 30 * 86_400_000,
  quarter: 90 * 86_400_000,
  year: 365 * 86_400_000,
};

const BUCKET_FORMAT: Record<GrowthRange, string> = {
  week: '%Y-%m-%d',
  month: '%Y-%m-%d',
  quarter: '%Y-%m-%d', 
  year: '%Y-%m',
  all: '%Y-%m',
};

export const getUserGrowthStats = async (range: GrowthRange = 'month'): Promise<GrowthStatsResult> => {
  const cutoff = range === 'all' ? null : new Date(Date.now() - RANGE_TO_MS[range]);
  const format = BUCKET_FORMAT[range];

  const [buckets, baselineCount] = await Promise.all([
    UserModel.aggregate([
      ...(cutoff ? [{ $match: { createdAt: { $gte: cutoff } } }] : []),
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, bucket: '$_id', count: 1 } },
    ]).exec(),
    cutoff ? UserModel.countDocuments({ createdAt: { $lt: cutoff } }).exec() : Promise.resolve(0),
  ]);

  return { data: buckets, baselineCount };
};

export const usersService: UsersService = {
  ...base,
  getUserGrowthStats, 

  createOne: async (data) => {
    const rawInput = data as Partial<User>;

    const hashedPassword = rawInput.password 
      ? await bcrypt.hash(rawInput.password, 12) 
      : '';

    const normalizedPayload: Partial<User> = {
      ...rawInput,
      password: hashedPassword,
      role: rawInput.role ?? 'user',
      dark_mode: rawInput.dark_mode ?? false,
      bio: rawInput.bio ?? '',
      phone_number: rawInput.phone_number ?? '',
      dob: rawInput.dob ?? '',
      gender: rawInput.gender ?? { type: 'Prefer Not to Say' },
      address: rawInput.address ?? {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: ''
      },
      user_avatar: rawInput.user_avatar ?? createDefaultAvatar(rawInput.first_name ?? '', rawInput.last_name ?? ''),
      user_banner: rawInput.user_banner ?? createDefaultBanner(),
    };

    return base.createOne(normalizedPayload);
  },
  updateOne: async (id, data) => {
    const rawInput = data as Partial<User>;

    if (rawInput.password) {
      (rawInput as any).password = await bcrypt.hash(rawInput.password, 12);
    }

    return base.updateOne(id, rawInput);
  },
};