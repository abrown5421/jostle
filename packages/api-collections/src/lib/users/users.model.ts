import { Schema, model } from 'mongoose';
import type { User } from '@inithium/types';

const addressSchema = new Schema(
  {
    street:  { type: String },
    city:    { type: String },
    state:   { type: String },
    zip:     { type: String },
    country: { type: String },
  },
  { _id: false }
);

const genderSchema = new Schema(
  {
    type:   { type: String, enum: ['Male', 'Female', 'Prefer Not to Say', 'Other'], required: true },
    custom: { type: String },
  },
  { _id: false }
);

const avatarPropsSchema = new Schema(
  {
    src:        { type: String },
    alt:        { type: String },
    fallback:   { type: String },
    size:       { type: String, enum: ['sm', 'md', 'lg', 'xl'] },
    status:     { type: String, enum: ['online', 'offline', 'away', 'busy'] },
    shape:      { type: String, enum: ['circle', 'square'] },
    background: { type: String },
    fontColor:  { type: String }, 
  },
  { _id: false }
);

const userBannerSchema = new Schema(
  {
    src:       { type: String },
    variance:  { type: Number },
    cell_size: { type: Number },
    x_colors:  { type: Schema.Types.Mixed },
    y_colors:  { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const userSchema = new Schema<User>(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:     { type: String, required: true },
    first_name:   { type: String, required: true, trim: true },
    last_name:    { type: String, required: true, trim: true },
    role:         { type: String, enum: ['super-admin', 'admin', 'editor', 'writer', 'user'], required: true, default: 'user' },
    user_banner:  { type: userBannerSchema },
    user_avatar:  { type: avatarPropsSchema },
    bio:          { type: String },
    gender:       { type: genderSchema },
    phone_number: { type: String },
    dob:          { type: String },
    address:      { type: addressSchema },
    dark_mode:    { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

export const UserModel = model<User>('User', userSchema);