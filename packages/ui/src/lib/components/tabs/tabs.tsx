import React, { createContext, useContext, useMemo } from 'react';
import {
  Tab as HeadlessTab,
  TabGroup,
  TabList as HeadlessTabList,
  TabPanel as HeadlessTabPanel,
  TabPanels as HeadlessTabPanels,
} from '@headlessui/react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { ThemeColor } from '@inithium/types';
import { TabListProps, TabPanelProps, TabPanelsProps, TabProps, TabsProps, TabsSize, TabsVariant } from './tabs.types';

type TabsContextProps = {
  variant: TabsVariant;
  size: TabsSize;
  color: ThemeColor;
  vertical: boolean;
  fullWidth: boolean;
};

const TabsContext = createContext<TabsContextProps | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compound components must be rendered within a <Tabs /> provider.');
  }
  return context;
};

const normalizeIconName = (name: string): string =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_-]+/g, '-')
    .toLowerCase();

const sizeStyles: Record<TabsSize, { text: string; py: string; px: string; gap: string; icon: number }> = {
  sm: { text: 'text-xs font-medium', py: 'py-1.5', px: 'px-3', gap: 'gap-1.5', icon: 14 },
  md: { text: 'text-sm font-medium', py: 'py-2', px: 'px-4', gap: 'gap-2', icon: 16 },
  lg: { text: 'text-base font-semibold', py: 'py-2.5', px: 'px-5', gap: 'gap-2', icon: 18 },
};

const listVariantStyles = (variant: TabsVariant, vertical: boolean): string => {
  const base = vertical ? 'flex flex-col' : 'flex items-center';
  const maps: Record<TabsVariant, string> = {
    line: vertical ? 'border-r border-surface-contrast' : 'border-b border-surface-contrast w-full',
    pills: 'gap-1 p-1 bg-surface2 rounded-lg',
    enclosed: 'border border-surface2 rounded-xl p-1.5 gap-1 bg-surface3',
  };
  return [base, maps[variant]].join(' ');
};

const tabSelectedStyles = (variant: TabsVariant, color: ThemeColor, vertical: boolean): string => {
  const borderPosition = vertical ? 'border-r-2' : 'border-b-2';
  
  const maps: Record<TabsVariant, string> = {
    line: `${borderPosition} border-${color} text-${color}`,
    pills: `bg-${color} text-${color}-contrast shadow-sm`,
    enclosed: `bg-${color} text-${color}-contrast shadow-xs rounded-lg`,
  };

  return maps[variant];
};

const tabUnselectedStyles = (variant: TabsVariant): string => {
  const maps: Record<TabsVariant, string> = {
    line: 'border-b-2 border-transparent text-surface4-contrast hover:text-surface-contrast hover:border-surface4',
    pills: 'text-surface2-contrast hover:text-accent hover:bg-surface3 rounded-md',
    enclosed: 'text-surface3-contrast hover:text-accent rounded-lg border border-transparent',
  };
  return maps[variant];
};

export const Tabs: React.FC<TabsProps> & {
  List: React.FC<TabListProps>;
  Tab: React.FC<TabProps>;
  Panels: React.FC<TabPanelsProps>;
  Panel: React.FC<TabPanelProps>;
} = ({
  variant = 'line',
  size = 'md',
  color = 'primary',
  fullWidth = false,
  vertical = false,
  className,
  children,
  ...props
}) => {
  const contextValue = useMemo(
    () => ({ variant, size, color, vertical, fullWidth }),
    [variant, size, color, vertical, fullWidth]
  );

  const containerClasses = [
    vertical ? 'flex gap-6' : 'flex flex-col gap-4',
    fullWidth ? 'w-full' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <TabsContext.Provider value={contextValue}>
      <TabGroup vertical={vertical} className={containerClasses} {...props}>
        {children}
      </TabGroup>
    </TabsContext.Provider>
  );
};

Tabs.List = function List({ className, children }) {
  const { variant, vertical } = useTabsContext();
  const classes = [listVariantStyles(variant, vertical), className ?? ''].filter(Boolean).join(' ');
  return <HeadlessTabList className={classes}>{children}</HeadlessTabList>;
};

Tabs.Tab = function Tab({ leadingIcon, trailingIcon, className, children, ...props }) {
  const { variant, size, color, vertical, fullWidth } = useTabsContext();
  const currentSize = sizeStyles[size];

  return (
    <HeadlessTab
      {...props}
      className={({ selected, disabled }) => {
        const baseClasses =
          'relative flex items-center justify-center whitespace-nowrap outline-hidden cursor-pointer select-none ' +
          'transition-all duration-200 ease-in-out font-medium';

        const contextStyles = selected
          ? tabSelectedStyles(variant, color, vertical)
          : tabUnselectedStyles(variant);

        const disabledStyles = disabled ? 'opacity-40 cursor-not-allowed select-none' : '';
        const widthStyle = fullWidth && !vertical ? 'flex-1' : '';

        return typeof className === 'function'
          ? className({ selected, disabled })
          : [
              baseClasses,
              currentSize.text,
              currentSize.py,
              currentSize.px,
              currentSize.gap,
              contextStyles,
              disabledStyles,
              widthStyle,
              className ?? '',
            ]
              .filter(Boolean)
              .join(' ');
      }}
    >
      {(bag) => (
        <>
          {leadingIcon && (
            <DynamicIcon
              name={normalizeIconName(leadingIcon) as any}
              size={currentSize.icon}
              className="shrink-0"
              aria-hidden="true"
            />
          )}
          {typeof children === 'function' ? children(bag) : children}
          {trailingIcon && (
            <DynamicIcon
              name={normalizeIconName(trailingIcon) as any}
              size={currentSize.icon}
              className="shrink-0"
              aria-hidden="true"
            />
          )}
        </>
      )}
    </HeadlessTab>
  );
};

Tabs.Panels = function Panels({ className, children }) {
  return <HeadlessTabPanels className={['outline-hidden', className ?? ''].filter(Boolean).join(' ')}>{children}</HeadlessTabPanels>;
};

Tabs.Panel = function Panel({ className, unmount = false, children }) {
  return (
    <HeadlessTabPanel
      unmount={unmount}
      className={['outline-hidden transition-all duration-200 ease-in-out', className ?? ''].filter(Boolean).join(' ')}
    >
      {children}
    </HeadlessTabPanel>
  );
};

export default Tabs;