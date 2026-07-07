import React, { useReducer, useTransition, useMemo, useState } from 'react';
import { Box, Button, Input, Select, Text, Checkbox, ThemeColorPicker } from '@inithium/ui';
import { z } from 'zod';
import {
  Page,
  NavigationConfig,
  NavLocation,
  AnimateEntry,
  AnimateExit,
  ThemeColor,
} from '@inithium/types';
import {
  useCreatePageMutation as useCreatePageDbMutation,
  useUpdatePageMutation,
  useCreatePageFileMutation,
} from '@inithium/store';

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
  label: z.string().min(1, 'Navigation label is required'),
  location: z.enum(['main', 'profile', 'footer', 'cms', 'none']),
  order: z.number().int('Order must be an integer').optional(),
  authenticated: z.boolean().optional(),
  anonymous: z.boolean().optional(),
  isButton: z.boolean().optional(),
  resolveNavPath: z.string().nullable().optional(),
});

export const CreatePageSchema = z.object({
  key: z.string().min(1, 'Page key is required'),
  path: z.string().min(1, 'Path is required').startsWith('/', 'Path must start with a "/"'),
  componentKey: z
    .string()
    .min(1, 'Component key is required')
    .regex(/^[A-Z][A-Za-z0-9]+$/, 'Component key must be PascalCase'),
  entry: AnimateEntrySchema,
  exit: AnimateExitSchema,
  entrySpeed: AnimateSpeedSchema.optional(),
  exitSpeed: AnimateSpeedSchema.optional(),
  bg: ThemeColorSchema,
  color: ThemeColorSchema.optional(),
  navigation: NavigationConfigSchema.optional(),
  centered: z.boolean().optional(),
  isErrorPage: z.boolean().optional(),
  is_system_page: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

const FileSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z][a-z0-9-]*$/, 'Slug format generated mismatch'),
  componentName: z
    .string()
    .min(1)
    .regex(/^[A-Z][A-Za-z0-9]+$/, 'Component key must be PascalCase'),
});

const ANIMATE_ENTRY_OPTIONS = [
  { value: 'fadeIn', label: 'Fade In' },
  { value: 'fadeInDown', label: 'Fade In Down' },
  { value: 'fadeInUp', label: 'Fade In Up' },
  { value: 'fadeInLeft', label: 'Fade In Left' },
  { value: 'fadeInRight', label: 'Fade In Right' },
  { value: 'slideInLeft', label: 'Slide In Left' },
  { value: 'slideInRight', label: 'Slide In Right' },
  { value: 'zoomIn', label: 'Zoom In' },
];

const ANIMATE_EXIT_OPTIONS = [
  { value: 'fadeOut', label: 'Fade Out' },
  { value: 'fadeOutDown', label: 'Fade Out Down' },
  { value: 'fadeOutUp', label: 'Fade Out Up' },
  { value: 'fadeOutLeft', label: 'Fade Out Left' },
  { value: 'fadeOutRight', label: 'Fade Out Right' },
  { value: 'slideOutLeft', label: 'Slide Out Left' },
  { value: 'slideOutRight', label: 'Slide Out Right' },
  { value: 'zoomOut', label: 'Zoom Out' },
];

const SPEED_OPTIONS = [
  { value: 'normal', label: 'Normal (None)' },
  { value: 'faster', label: 'Faster' },
  { value: 'fast', label: 'Fast' },
  { value: 'slow', label: 'Slow' },
  { value: 'slower', label: 'Slower' },
];

const NAV_LOCATION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'main', label: 'Main' },
  { value: 'profile', label: 'Profile' },
  { value: 'footer', label: 'Footer' },
  { value: 'cms', label: 'CMS' },
];

export const toSlug = (componentKey: string): string =>
  componentKey
    .replace(/(?<!^)([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^[^a-z]+/, '')
    .replace(/[^a-z0-9-]+/g, '');

export interface PageFormProps {
  page?: Page;
  onCancel: () => void;
}

type FormState = Partial<Page>;

type FormAction =
  | { type: 'SET_FIELD'; field: keyof Page; value: any }
  | { type: 'SET_NESTED_FIELD'; parent: 'navigation'; field: keyof NavigationConfig; value: any };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_NESTED_FIELD': {
      const currentParent = state[action.parent] ?? {
        label: '',
        location: 'none' as NavLocation,
      };
      return {
        ...state,
        [action.parent]: {
          ...currentParent,
          [action.field]: action.value,
        } as NavigationConfig,
      };
    }
    default:
      return state;
  }
};

const createInitialState = (page?: Page): FormState => ({
  key: '',
  path: '/',
  componentKey: '',
  entry: 'fadeIn' as AnimateEntry,
  entrySpeed: undefined,
  exit: 'fadeOut' as AnimateExit,
  exitSpeed: undefined,
  bg: 'primary' as ThemeColor,
  color: undefined,
  isActive: true,
  centered: false,
  isErrorPage: false,
  is_system_page: false,
  navigation: {
    location: 'none' as NavLocation,
    label: '',
    order: undefined,
    authenticated: false,
    anonymous: false,
  },
  ...page,
});

export const PageForm: React.FC<PageFormProps> = ({ page, onCancel }) => {
  const isEditMode = Boolean(page?._id);
  const [formState, dispatch] = useReducer(formReducer, page, createInitialState);
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [createPageDb] = useCreatePageDbMutation();
  const [updatePage] = useUpdatePageMutation();
  const [createPageFile] = useCreatePageFileMutation();

  const updateField = (field: keyof Page) => (value: any) =>
    dispatch({ type: 'SET_FIELD', field, value });

  const updateNestedField =
    (parent: 'navigation') => (field: keyof NavigationConfig) => (value: any) =>
      dispatch({ type: 'SET_NESTED_FIELD', parent, field, value });

  const handleInputChange =
    (field: keyof Page) => (e: React.ChangeEvent<HTMLInputElement>) =>
      updateField(field)(e.target.value);

  const handleNestedInputChange =
    (parent: 'navigation', field: keyof NavigationConfig) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      updateNestedField(parent)(field)(e.target.value);

  const handleNestedNumericInputChange =
    (parent: 'navigation', field: keyof NavigationConfig) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseInt(e.target.value, 10);
      updateNestedField(parent)(field)(isNaN(parsed) ? undefined : parsed);
    };

  const handleSelectChange = (field: keyof Page) => (val: any) => {
    const extracted = val?.target ? val.target.value : val;
    updateField(field)(extracted === 'normal' || extracted === '' ? undefined : extracted);
  };

  const handleNestedSelectChange =
    (parent: 'navigation', field: keyof NavigationConfig) => (val: any) => {
      const extracted = val?.target ? val.target.value : val;
      updateNestedField(parent)(field)(extracted);
    };

  const handleCheckboxChange = (field: keyof Page) => (val: any) => {
    const isChecked = val?.target ? val.target.checked : Boolean(val);
    updateField(field)(isChecked);
  };

  const handleNestedCheckboxChange =
    (parent: 'navigation', field: keyof NavigationConfig) => (val: any) => {
      const isChecked = val?.target ? val.target.checked : Boolean(val);
      updateNestedField(parent)(field)(isChecked);
    };

  const processedPayloads = useMemo(() => {
    const base: Record<string, any> = {
      key: formState.key ?? '',
      path: formState.path ?? '/',
      componentKey: formState.componentKey ?? '',
      entry: formState.entry ?? 'fadeIn',
      exit: formState.exit ?? 'fadeOut',
      bg: formState.bg ?? 'primary',
      isActive: formState.isActive ?? true,
      centered: formState.centered ?? false,
      isErrorPage: formState.isErrorPage ?? false,
      is_system_page: formState.is_system_page ?? false,
    };

    if (formState.color) base.color = formState.color;
    if (formState.entrySpeed) base.entrySpeed = formState.entrySpeed;
    if (formState.exitSpeed) base.exitSpeed = formState.exitSpeed;

    const nav = formState.navigation;
    if (nav && nav.location !== 'none' && nav.label !== '') {
      base.navigation = Object.fromEntries(
        Object.entries(nav).filter(([_, v]) => v !== undefined),
      );
    }

    const filePayload = {
      slug: toSlug(base.componentKey),
      componentName: base.componentKey,
    };

    return { dbPayload: base, filePayload };
  }, [formState]);

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!isSubmitted) return errors;

    const dbResult = CreatePageSchema.safeParse(processedPayloads.dbPayload);
    if (!dbResult.success) {
      dbResult.error.issues.forEach((issue) => {
        const pathStr = issue.path.join('.');
        errors[pathStr] = issue.message;
      });
    }

    if (!isEditMode) {
      const fileResult = FileSchema.safeParse(processedPayloads.filePayload);
      if (!fileResult.success) {
        fileResult.error.issues.forEach((issue) => {
          if (!errors[issue.path.join('.')]) {
            errors[issue.path.join('.')] = issue.message;
          }
        });
      }
    }

    return errors;
  }, [processedPayloads, isEditMode, isSubmitted]);

  const rawValidationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    const dbResult = CreatePageSchema.safeParse(processedPayloads.dbPayload);
    if (!dbResult.success) {
      dbResult.error.issues.forEach((issue) => {
        errors[issue.path.join('.')] = issue.message;
      });
    }
    if (!isEditMode) {
      const fileResult = FileSchema.safeParse(processedPayloads.filePayload);
      if (!fileResult.success) {
        fileResult.error.issues.forEach((issue) => {
          if (!errors[issue.path.join('.')]) {
            errors[issue.path.join('.')] = issue.message;
          }
        });
      }
    }
    return errors;
  }, [processedPayloads, isEditMode]);

  const isFormValid = Object.keys(rawValidationErrors).length === 0;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitted(true);
    if (!isFormValid) return;

    const { dbPayload, filePayload } = processedPayloads;

    startTransition(async () => {
      try {
        if (isEditMode && page?._id) {
          await updatePage({ id: page._id, data: dbPayload }).unwrap();
        } else {
          await createPageDb(dbPayload).unwrap();
          await createPageFile(filePayload).unwrap();
        }
        onCancel();
      } catch (error) {
        console.error('Failed to submit page mutation payload:', error);
      }
    });
  };

  return (
    <Box flex direction="col" className="gap-4 py-2 w-full">
      <Box flex direction="row" className="gap-4">
        <Box flex direction="col" className="gap-1 flex-1">
          <Input
            label="Page Key"
            variant="outline"
            color="primary"
            size="sm"
            fullWidth
            value={formState.key ?? ''}
            onChange={handleInputChange('key')}
            disabled={isEditMode}
            required
          />
          {validationErrors['key'] && (
            <Text overrideClassName="text-xs text-danger font-medium mt-0.5">
              {validationErrors['key']}
            </Text>
          )}
        </Box>
        <Box flex direction="col" className="gap-1 flex-1">
          <Input
            label="Path (Must start with /)"
            variant="outline"
            color="primary"
            size="sm"
            fullWidth
            value={formState.path ?? ''}
            onChange={handleInputChange('path')}
            leadingIcon="link"
            disabled={isEditMode}
            required
          />
          {validationErrors['path'] && (
            <Text overrideClassName="text-xs text-danger font-medium mt-0.5">
              {validationErrors['path']}
            </Text>
          )}
        </Box>
      </Box>

      <Box flex direction="col" className="gap-1">
        <Input
          label="Component Key (PascalCase)"
          variant="outline"
          color="primary"
          size="sm"
          fullWidth
          value={formState.componentKey ?? ''}
          onChange={handleInputChange('componentKey')}
          leadingIcon="code"
          disabled={isEditMode}
          required
        />
        {validationErrors['componentKey'] && (
          <Text overrideClassName="text-xs text-danger font-medium mt-0.5">
            {validationErrors['componentKey']}
          </Text>
        )}
        {validationErrors['componentName'] && (
          <Text overrideClassName="text-xs text-danger font-medium mt-0.5">
            {validationErrors['componentName']}
          </Text>
        )}
      </Box>

      <SectionLabel label="Animation" />

      <Box flex direction="row" className="gap-4">
        <Box className="flex-1">
          <Select
            label="Entry Animation"
            options={ANIMATE_ENTRY_OPTIONS}
            color="primary"
            variant="outline"
            size="sm"
            fullWidth
            value={formState.entry ?? ''}
            onChange={handleSelectChange('entry')}
          />
        </Box>
        <Box className="flex-1">
          <Select
            label="Entry Speed"
            options={SPEED_OPTIONS}
            color="primary"
            variant="outline"
            size="sm"
            fullWidth
            value={formState.entrySpeed ?? 'normal'}
            onChange={handleSelectChange('entrySpeed')}
          />
        </Box>
      </Box>

      <Box flex direction="row" className="gap-4">
        <Box className="flex-1">
          <Select
            label="Exit Animation"
            options={ANIMATE_EXIT_OPTIONS}
            color="primary"
            variant="outline"
            size="sm"
            fullWidth
            value={formState.exit ?? ''}
            onChange={handleSelectChange('exit')}
          />
        </Box>
        <Box className="flex-1">
          <Select
            label="Exit Speed"
            options={SPEED_OPTIONS}
            color="primary"
            variant="outline"
            size="sm"
            fullWidth
            value={formState.exitSpeed ?? 'normal'}
            onChange={handleSelectChange('exitSpeed')}
          />
        </Box>
      </Box>

      <SectionLabel label="Appearance" />

      <Box flex direction="row" className="gap-4">
        <Box className="flex-1">
          <ThemeColorPicker
            label="Background Color"
            value={formState.bg as ThemeColor}
            onChange={handleSelectChange('bg')}
          />
        </Box>
        <Box className="flex-1">
          <ThemeColorPicker
            label="Text Color"
            value={formState.color as ThemeColor}
            onChange={handleSelectChange('color')}
          />
        </Box>
      </Box>

      <SectionLabel label="Navigation" />

      <Box flex direction="row" className="gap-4">
        <Box className="flex-1">
          <Input
            label="Nav Label"
            variant="outline"
            color="primary"
            size="sm"
            fullWidth
            value={formState.navigation?.label ?? ''}
            onChange={handleNestedInputChange('navigation', 'label')}
          />
          {validationErrors['navigation.label'] && (
            <Text overrideClassName="text-xs text-danger font-medium mt-0.5">
              {validationErrors['navigation.label']}
            </Text>
          )}
        </Box>
        <Box className="flex-1">
          <Select
            label="Nav Location"
            options={NAV_LOCATION_OPTIONS}
            color="primary"
            variant="outline"
            size="sm"
            fullWidth
            value={formState.navigation?.location ?? 'none'}
            onChange={handleNestedSelectChange('navigation', 'location')}
          />
        </Box>
        <Box className="flex-1">
          <Input
            label="Nav Order"
            type="number"
            variant="outline"
            color="primary"
            size="sm"
            fullWidth
            value={formState.navigation?.order ?? ''}
            onChange={handleNestedNumericInputChange('navigation', 'order')}
          />
          {validationErrors['navigation.order'] && (
            <Text overrideClassName="text-xs text-danger font-medium mt-0.5">
              {validationErrors['navigation.order']}
            </Text>
          )}
        </Box>
      </Box>

      <SectionLabel label="Flags" />

      <Box flex direction="row" justify="between" className="gap-4 flex-wrap my-2">
        <Checkbox
          label="Active"
          checked={Boolean(formState.isActive)}
          onChange={handleCheckboxChange('isActive')}
          color="success"
          size="sm"
        />
        <Checkbox
          label="Centered"
          checked={Boolean(formState.centered)}
          onChange={handleCheckboxChange('centered')}
          color="primary"
          size="sm"
        />
        <Checkbox
          label="Error Page"
          checked={Boolean(formState.isErrorPage)}
          onChange={handleCheckboxChange('isErrorPage')}
          color="danger"
          size="sm"
        />
        <Checkbox
          label="Auth Required"
          checked={Boolean(formState.navigation?.authenticated)}
          onChange={handleNestedCheckboxChange('navigation', 'authenticated')}
          color="primary"
          size="sm"
        />
        <Checkbox
          label="Anonymous Only"
          checked={Boolean(formState.navigation?.anonymous)}
          onChange={handleNestedCheckboxChange('navigation', 'anonymous')}
          color="secondary"
          size="sm"
        />
      </Box>

      <Box flex justify="end" className="gap-2 mt-4">
        <Button
          variant="ghost"
          color="secondary"
          size="sm"
          onClick={onCancel}
          type="button"
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          variant="solid"
          color={isSubmitted && !isFormValid ? 'secondary' : 'primary'}
          size="sm"
          type="submit"
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isEditMode ? 'Save Modifications' : 'Create Page'}
        </Button>
      </Box>
    </Box>
  );
};

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <Text
    variant="caption"
    overrideClassName="text-xs font-bold uppercase tracking-wider text-secondary mt-2"
  >
    {label}
  </Text>
);
