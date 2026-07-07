import { Schema, model } from 'mongoose';
import type { Friend } from '@inithium/types';

const friendSchema = new Schema<Friend>(
  {
    requester:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status:       { type: String, enum: ['pending', 'accepted', 'declined', 'blocked'], required: true, default: 'pending' },
    action_user:  { type: String, ref: 'User', required: true },
    date_sent:    { type: String, required: true },
    date_accepted:{ type: String },
  },
  { timestamps: true }
);

friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export const FriendModel = model<Friend>('Friend', friendSchema);