export type AssetCategory = 'image' | 'font' | 'audio' | 'document' | 'other';

export type AssetOwnerType = 'app' | 'user';

export interface AssetBase {
  filename: string;
  original_name: string;
  mimetype: string;
  size: number;
  storage_key: string;
  category: AssetCategory;
  is_system_asset: boolean;
  owner_type: AssetOwnerType;
  owner_id: string | null; 
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Asset extends AssetBase {
  _id: string;
}

export interface AssetUploadIntent {
  original_name: string;
  mimetype: string;
  size: number;
  category: AssetCategory;
  owner_type: AssetOwnerType;
  owner_id: string | null;
}

export interface AssetUploadResponse {
  asset_id: string;
  upload_url: string;
  storage_key: string;
}