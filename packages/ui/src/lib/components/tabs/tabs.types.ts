import { TabGroupProps, TabProps as HeadlessTabProps } from '@headlessui/react';
import { ThemeColor } from '@inithium/types';

export type TabsVariant = 'line' | 'pills' | 'enclosed';
export type TabsSize = 'sm' | 'md' | 'lg';

export interface TabsProps extends Omit<TabGroupProps, 'as' | 'className'> {
  variant?: TabsVariant;
  size?: TabsSize;
  color?: ThemeColor;
  fullWidth?: boolean;
  vertical?: boolean;
  className?: string;
  children: React.ReactNode;
}

export interface TabListProps {
  className?: string;
  children: React.ReactNode;
}

export interface TabProps extends Omit<HeadlessTabProps, 'as' | 'className' | 'children'> {
  leadingIcon?: string;
  trailingIcon?: string;
  className?: string | ((bag: { selected: boolean; disabled: boolean }) => string);
  children: React.ReactNode | ((bag: { selected: boolean; disabled: boolean }) => React.ReactNode);
}

export interface TabPanelsProps {
  className?: string;
  children: React.ReactNode;
}

export interface TabPanelProps {
  className?: string;
  unmount?: boolean;
  children: React.ReactNode;
}