export interface TrianglifyOptions {
  variance?: number;
  cell_size?: number; 
  x_colors?: string | string[];
  y_colors?: string | string[];
}

export interface BannerProps {
  src?: string;
  alt?: string;
  height?: string; 
  options?: TrianglifyOptions;
  className?: string;
}