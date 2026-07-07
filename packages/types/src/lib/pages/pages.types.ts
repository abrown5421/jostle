import { AnimateEntry, AnimateExit, AnimateSpeed } from "../animations/animations.types.js";
import { ThemeColor } from "../theme/theme.types.js";

export type NavLocation = 'main' | 'profile' | 'footer' | 'cms' | 'none';

export interface NavigationConfig {
  label: string;
  location: NavLocation;
  order?: number;
  authenticated?: boolean;
  anonymous?: boolean;
  isButton?: boolean;
  resolveNavPath?: string | null;
}

export interface Page {
  _id: string;
  key: string;
  path: string;
  componentKey: string;
  entry: AnimateEntry;
  exit: AnimateExit;
  entrySpeed?: AnimateSpeed;
  exitSpeed?: AnimateSpeed;
  bg: ThemeColor;
  color?: ThemeColor;
  navigation?: NavigationConfig;
  centered?: boolean;
  isErrorPage?: boolean;
  is_system_page: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
