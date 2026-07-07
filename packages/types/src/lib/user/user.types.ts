import { AvatarProps } from "./avatar.types.js";
import { TrianglifyOptions } from "./banner.types.js";

export type GenderSelection = 'Male' | 'Female' | 'Prefer Not to Say' | 'Other';

export type Gender = 
  | { type: 'Male' | 'Female' | 'Prefer Not to Say'; custom?: never }
  | { type: 'Other'; custom: string };

export interface Address {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}

export interface User {
    _id: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: 'super-admin' | 'admin' | 'editor' | 'writer' | 'user'; 
    user_banner?: TrianglifyOptions;
    user_avatar?: Omit<AvatarProps, 'onClick' | 'className'>;
    bio?: string;
    gender?: Gender; 
    phone_number?: string;
    dob?: string;
    address?: Address;
    dark_mode: boolean;
}