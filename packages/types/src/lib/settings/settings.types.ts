export type SettingValue = string | boolean | Record<string, any>;

export interface Setting {
  _id: string;
  key: string;
  value: SettingValue;
  description?: string;
  is_public: boolean;
  createdAt?: string;
  updatedAt?: string;
}