import React from 'react';
import {
  Dialog as HeadlessDialog,
  DialogPanel,
  DialogTitle,
  Description,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { X } from 'lucide-react';
import { Button } from '../button/button';
import { DialogAction, DialogDrawerPosition, DialogProps, DialogSize, DialogVariant } from './dialog.types';

const sizeStyles: Record<DialogSize, string> = {
  sm:   'w-full max-w-sm',
  md:   'w-full max-w-md',
  lg:   'w-full max-w-lg',
  xl:   'w-full max-w-2xl',
  full: 'w-full max-w-full h-full',
};

const drawerSizeStyles: Record<DialogSize, Record<DialogDrawerPosition, string>> = {
  sm:   { left: 'w-64 h-full',  right: 'w-64 h-full',  top: 'w-full h-48', bottom: 'w-full h-48'  },
  md:   { left: 'w-80 h-full',  right: 'w-80 h-full',  top: 'w-full h-64', bottom: 'w-full h-64'  },
  lg:   { left: 'w-96 h-full',  right: 'w-96 h-full',  top: 'w-full h-80', bottom: 'w-full h-80'  },
  xl:   { left: 'w-[28rem] h-full', right: 'w-[28rem] h-full', top: 'w-full h-96', bottom: 'w-full h-96' },
  full: { left: 'w-full h-full', right: 'w-full h-full', top: 'w-full h-full', bottom: 'w-full h-full' },
};

function getPanelTransition(
  variant: DialogVariant,
  drawerPosition: DialogDrawerPosition,
): { enter: string; enterFrom: string; enterTo: string; leave: string; leaveFrom: string; leaveTo: string } {
  if (variant === 'drawer') {
    const map: Record<DialogDrawerPosition, { from: string; to: string }> = {
      left:   { from: '-translate-x-full', to: 'translate-x-0' },
      right:  { from: 'translate-x-full',  to: 'translate-x-0' },
      top:    { from: '-translate-y-full', to: 'translate-y-0' },
      bottom: { from: 'translate-y-full',  to: 'translate-y-0' },
    };
    const { from, to } = map[drawerPosition];
    return {
      enter:     'transition ease-in-out duration-300 transform',
      enterFrom: from,
      enterTo:   to,
      leave:     'transition ease-in-out duration-200 transform',
      leaveFrom: to,
      leaveTo:   from,
    };
  }

  return {
    enter:     'transition ease-out duration-200',
    enterFrom: 'opacity-0 scale-95 translate-y-2',
    enterTo:   'opacity-100 scale-100 translate-y-0',
    leave:     'transition ease-in duration-150',
    leaveFrom: 'opacity-100 scale-100 translate-y-0',
    leaveTo:   'opacity-0 scale-95 translate-y-2',
  };
}

function getContainerClasses(variant: DialogVariant, drawerPosition: DialogDrawerPosition): string {
  if (variant === 'drawer') {
    const map: Record<DialogDrawerPosition, string> = {
      left:   'fixed inset-0 z-50 flex items-stretch justify-start',
      right:  'fixed inset-0 z-50 flex items-stretch justify-end',
      top:    'fixed inset-0 z-50 flex flex-col items-stretch justify-start',
      bottom: 'fixed inset-0 z-50 flex flex-col items-stretch justify-end',
    };
    return map[drawerPosition];
  }
  if (variant === 'alert') {
    return 'fixed inset-0 z-50 flex items-center justify-center p-4';
  }
  return 'fixed inset-0 z-50 flex items-center justify-center p-4';
}

const footerAlignStyles: Record<NonNullable<DialogProps['actionsAlign']>, string> = {
  left:    'justify-start',
  right:   'justify-end',
  center:  'justify-center',
  between: 'justify-between',
};

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  variant = 'default',
  drawerPosition = 'right',
  actions = [],
  actionsAlign = 'right',
  backdrop = true,
  transition = true,
  closeOnBackdropClick = true,
  showCloseButton = true,
  panelClassName,
  backdropClassName,
  overridePanelClassName,
  role = 'dialog',
  ...rest
}) => {
  const handleClose = React.useCallback(() => {
    if (closeOnBackdropClick) onClose();
  }, [closeOnBackdropClick, onClose]);

  const isDrawer = variant === 'drawer';

  const builtPanelClasses = overridePanelClassName
    ? overridePanelClassName
    : [
        'relative flex flex-col bg-surface3 text-surface3-contrast shadow-xl overflow-hidden',
        'max-h-[calc(100vh-2rem)]',
        isDrawer
          ? drawerSizeStyles[size][drawerPosition]
          : ['rounded-xl', sizeStyles[size]].join(' '),
        variant === 'alert' ? 'border-t-4 border-danger' : '',
        size === 'full' && !isDrawer ? 'h-full rounded-none max-h-full' : '',
        panelClassName ?? '',
      ]
        .filter(Boolean)
        .join(' ');

  const containerClasses = getContainerClasses(variant, drawerPosition);
  const panelTransition = getPanelTransition(variant, drawerPosition);
  const hasHeader = Boolean(title || showCloseButton);
  const hasFooter = actions.length > 0;

  const handleActionClick = (action: DialogAction) => {
    action.onClick(onClose);
    if (action.closes) onClose();
  };

  const panel = (
    <DialogPanel className={builtPanelClasses}>
      {hasHeader && (
        <div className="flex items-start justify-between px-6 py-4 border-b border-surface3-contrast">
          {title && (
            <DialogTitle
              as="h2"
              className="text-base font-semibold leading-snug pr-4"
            >
              {title}
            </DialogTitle>
          )}
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className={[
                'ml-auto -mr-1 -mt-0.5 flex items-center justify-center w-7 h-7 rounded-md',
                'text-surface3-contrast hover:bg-surface3-contrast',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                'transition-colors duration-150',
              ].join(' ')}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {description && (
          <Description className="text-sm text-surface3-contrast mb-3">{description}</Description>
        )}
        {children}
      </div>

      {hasFooter && (
        <div
          className={[
            'flex flex-wrap gap-2 px-6 py-4 border-t border-surface3-contrast',
            footerAlignStyles[actionsAlign],
          ].join(' ')}
        >
          {actions.map((action, i) => (
            <Button
              key={i}
              color={action.color ?? 'primary'}
              variant={action.variant ?? 'solid'}
              size={action.size ?? 'md'}
              leadingIcon={action.leadingIcon}
              trailingIcon={action.trailingIcon}
              fullWidth={action.fullWidth}
              disabled={action.disabled}
              onClick={() => handleActionClick(action)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </DialogPanel>
  );

  if (!transition) {
    return (
      <HeadlessDialog
        open={open}
        onClose={handleClose}
        role={role}
        {...rest}
      >
        {backdrop && (
          <div
            className={[
              'fixed inset-0 z-40 bg-black/40',
              backdropClassName ?? '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden="true"
          />
        )}
        <div className={containerClasses}>{panel}</div>
      </HeadlessDialog>
    );
  }

  return (
    <Transition show={open}>
      <HeadlessDialog
        onClose={handleClose}
        role={role}
        {...rest}
      >
        {backdrop && (
          <TransitionChild
            enter="transition ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className={[
                'fixed inset-0 z-40 bg-black/40',
                backdropClassName ?? '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden="true"
            />
          </TransitionChild>
        )}

        <div className={containerClasses}>
          <TransitionChild
            enter={panelTransition.enter}
            enterFrom={panelTransition.enterFrom}
            enterTo={panelTransition.enterTo}
            leave={panelTransition.leave}
            leaveFrom={panelTransition.leaveFrom}
            leaveTo={panelTransition.leaveTo}
          >
            {panel}
          </TransitionChild>
        </div>
      </HeadlessDialog>
    </Transition>
  );
};

export default Dialog;