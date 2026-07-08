import bcrypt from 'bcryptjs';
import { UserModel } from '../users/users.model.js';
import { signTokens, verifyRefreshToken } from '@inithium/api-core';
import type { AuthTokens, LoginRequestDto } from '@inithium/types';
import type { SignupDto } from './auth.validators.js';

const SALT_ROUNDS = 12;

const buildDefaultAvatar = (firstName: string, lastName: string) => ({
  src: '',
  alt: `${firstName} ${lastName}`,
  fallback: `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`,
  size: 'md' as const,
  status: 'offline' as const,
  shape: 'circle' as const,
  background: 'linear-gradient(135deg, #E86200, #4004e5)',
});

const buildDefaultBanner = () => ({
  variance: 0.75,
  cell_size: 40,
  x_colors: ['#E86200', '#4004e5', '#140d28'],
  y_colors: ['#140d28', '#00E8D6', '#e2e8f0'],
});

export const authService = {

  async signup(dto: SignupDto): Promise<AuthTokens> {
    const existing = await UserModel.findOne({ email: dto.email }).lean().exec();
    if (existing) {
      throw Object.assign(new Error('Email already registered'), { status: 409 });
    }

    const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const userPayload = {
      ...dto,
      password:     hashed,
      role:         'user' as const,
      bio:          dto.bio          ?? '',
      phone_number: dto.phone_number ?? '',
      dob:          dto.dob          ?? '',
      address: (dto.address && Object.keys(dto.address).length > 0)
        ? dto.address
        : { street: '', city: '', state: '', zip: '', country: '' },
      user_avatar: dto.user_avatar && Object.keys(dto.user_avatar).length > 0
        ? dto.user_avatar
        : buildDefaultAvatar(dto.first_name, dto.last_name),
      user_banner: dto.user_banner && Object.keys(dto.user_banner).length > 0
        ? dto.user_banner
        : buildDefaultBanner(),
    };

    const created = await UserModel.create([userPayload]);
    const user = created[0].toObject();

    return signTokens({
      sub:   user._id.toString(),
      email: user.email,
      role:  user.role,
    });
  },

  async login(dto: LoginRequestDto): Promise<AuthTokens> {
    const user = await UserModel.findOne({ email: dto.email }).lean().exec();
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }

    return signTokens({
      sub:   user._id.toString(),
      email: user.email,
      role:  user.role,
    });
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);

    const user = await UserModel.findById(payload.sub).lean().exec();
    if (!user) {
      throw Object.assign(new Error('User not found'), { status: 401 });
    }

    return signTokens({
      sub:   user._id.toString(),
      email: user.email,
      role:  user.role,
    });
  },

};