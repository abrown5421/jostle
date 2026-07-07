import { ListboxProps } from '@headlessui/react';
import { ThemeColor } from '@inithium/types';
import React from 'react';

export interface ThemeColorPickerProps extends Omit<ListboxProps<typeof React.Fragment, ThemeColor>, 'as' | 'children'> {
  label?: string;
  disabled?: boolean;
}