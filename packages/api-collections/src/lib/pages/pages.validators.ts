import { z } from 'zod';
import type { Page } from '@inithium/types';

const AnimateEntrySchema = z.enum([
  'backInDown', 'backInLeft', 'backInRight', 'backInUp',
  'bounceIn', 'bounceInDown', 'bounceInLeft', 'bounceInRight', 'bounceInUp',
  'fadeIn', 'fadeInDown', 'fadeInLeft', 'fadeInRight', 'fadeInUp',
  'flipInX', 'flipInY',
  'lightSpeedInLeft', 'lightSpeedInRight',
  'rotateIn', 'rotateInDownLeft', 'rotateInDownRight', 'rotateInUpLeft', 'rotateInUpRight',
  'zoomIn', 'zoomInDown', 'zoomInLeft', 'zoomInRight', 'zoomInUp',
  'slideInDown', 'slideInLeft', 'slideInRight', 'slideInUp',
]);

const AnimateExitSchema = z.enum([
  'backOutDown', 'backOutLeft', 'backOutRight', 'backOutUp',
  'bounceOut', 'bounceOutDown', 'bounceOutLeft', 'bounceOutRight', 'bounceOutUp',
  'fadeOut', 'fadeOutDown', 'fadeOutLeft', 'fadeOutRight', 'fadeOutUp',
  'fadeOutTopLeft', 'fadeOutTopRight', 'fadeOutBottomLeft', 'fadeOutBottomRight',
  'flipOutX', 'flipOutY',
  'lightSpeedOutLeft', 'lightSpeedOutRight',
  'rotateOut', 'rotateOutDownLeft', 'rotateOutDownRight', 'rotateOutUpLeft', 'rotateOutUpRight',
  'zoomOut', 'zoomOutDown', 'zoomOutLeft', 'zoomOutRight', 'zoomOutUp',
  'slideOutDown', 'slideOutLeft', 'slideOutRight', 'slideOutUp',
  'hinge', 'rollOut',
]);

const AnimateSpeedSchema = z.enum(['slow', 'slower', 'fast', 'faster']);

const ThemeColorSchema = z.enum([
  'primary', 'primary-contrast',
  'secondary', 'secondary-contrast',
  'accent', 'accent-contrast',
  'success', 'success-contrast',
  'warning', 'warning-contrast',
  'danger', 'danger-contrast',
  'surface', 'surface-contrast',
  'surface2', 'surface2-contrast',
  'surface3', 'surface3-contrast',
  'surface4', 'surface4-contrast',
]);

const NavigationConfigSchema = z.object({
  label:           z.string().min(1),
  location:        z.enum(['main', 'profile', 'footer', 'cms', 'none']),
  order:           z.number().optional(),
  authenticated:   z.boolean().optional(),
  anonymous:       z.boolean().optional(),
  isButton:        z.boolean().optional(),
  resolveNavPath:  z.string().nullable().optional(),
});

export const CreatePageSchema = z.object({
  key:            z.string().min(1),
  path:           z.string().min(1).startsWith('/'),
  componentKey:   z.string().min(1),
  entry:          AnimateEntrySchema,
  exit:           AnimateExitSchema,
  entrySpeed:     AnimateSpeedSchema.optional(),
  exitSpeed:      AnimateSpeedSchema.optional(),
  bg:             ThemeColorSchema,
  color:          ThemeColorSchema.optional(),
  navigation:     NavigationConfigSchema.optional(),
  centered:       z.boolean().optional(),
  isErrorPage:    z.boolean().optional(),
  is_system_page: z.boolean().default(false),
  isActive:       z.boolean().default(true),
}) satisfies z.ZodType<Omit<Page, '_id' | 'createdAt' | 'updatedAt'>>;

export const UpdatePageSchema = CreatePageSchema.partial();

export type CreatePageDto = z.infer<typeof CreatePageSchema>;
export type UpdatePageDto = z.infer<typeof UpdatePageSchema>;
