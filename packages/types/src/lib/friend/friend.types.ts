import { User } from '../user/user.types.js';

export type FriendStatus = 'pending' | 'accepted' | 'declined' 

export interface Friend {
  _id: string;
  requester: User;
  recipient: User;
  status: FriendStatus;
  action_user: string;
  date_sent: string;
  date_accepted?: string;
}