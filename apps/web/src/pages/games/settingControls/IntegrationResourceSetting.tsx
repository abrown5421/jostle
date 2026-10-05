import { skipToken } from '@reduxjs/toolkit/query';
import { Alert, Box, Button, Icon, Loader, Text, mergeClassNames, resolveColorClass } from '@inithium/ui';
import type { IconName } from '@inithium/ui';
import { useListIntegrationResourcesQuery } from '@inithium/api-client';
import type { GameSettingDefinition, GameSettingValues, IntegrationResource } from '@inithium/api-client';
import { SECONDARY_BUTTON_PROPS, SURFACE_BORDER, SURFACE_TEXT } from '../surfaceColors';

export type IntegrationResourceSettingDefinition = Extract<GameSettingDefinition, { type: 'integration-resource' }>;

// How each provider's resource list reads - the item noun and an icon for art-less entries.
// Anything unlisted falls back to generic wording.
const PRESENTATIONS: Record<string, { readonly itemNoun: string; readonly icon: IconName; readonly providerName: string }> = {
  'spotify:playlist': { itemNoun: 'songs', icon: 'MusicNotes', providerName: 'Spotify' },
};
const presentationOf = ({ provider, resource }: IntegrationResourceSettingDefinition) =>
  PRESENTATIONS[`${provider}:${resource}`] ?? { itemNoun: 'items', icon: 'Folder' as IconName, providerName: provider };

// The fewest items the chosen resource must hold, from the setting it's tied to (iPod War: Songs).
export const minItemsFor = (definition: IntegrationResourceSettingDefinition, values: GameSettingValues): number =>
  definition.minItemsFromSetting ? Number(values[definition.minItemsFromSetting] ?? 0) : 0;

const unusableReason = (resource: IntegrationResource, minItems: number, itemNoun: string): string | null => {
  if (!resource.selectable) return resource.unselectableReason ?? 'Not available';
  if (resource.itemCount < minItems) return `Only ${resource.itemCount} ${itemNoun} - needs at least ${minItems}`;
  return null;
};

// Why the game can't start with this setting as it stands, if it can't. The resources come from
// the same (cached) query the picker uses. Advisory: the server re-checks when the game starts.
export const resolveResourceSettingBlocker = (
  definition: IntegrationResourceSettingDefinition,
  values: GameSettingValues,
  resources: readonly IntegrationResource[] | undefined,
): string | null => {
  const value = String(values[definition.key] ?? '');
  if (!value) return definition.required ? `Choose a ${definition.label.toLowerCase()} first.` : null;
  const chosen = resources?.find((resource) => resource.id === value);
  if (!resources) return null;
  if (!chosen) return `Your ${definition.label.toLowerCase()} is no longer available - choose another.`;
  return unusableReason(chosen, minItemsFor(definition, values), presentationOf(definition).itemNoun);
};

// The start blocker for a game's (first) integration-resource setting - games have at most one
// today; a second would need its own query here.
export const useIntegrationResourceBlocker = (
  definitions: readonly GameSettingDefinition[],
  values: GameSettingValues,
): string | null => {
  const definition = definitions.find((candidate): candidate is IntegrationResourceSettingDefinition => candidate.type === 'integration-resource');
  const { data } = useListIntegrationResourcesQuery(definition ? { provider: definition.provider, resource: definition.resource } : skipToken);
  return definition ? resolveResourceSettingBlocker(definition, values, data) : null;
};

export interface IntegrationResourceSettingProps {
  readonly definition: IntegrationResourceSettingDefinition;
  readonly value: string;
  // Every setting's current value - for minItemsFromSetting.
  readonly values: GameSettingValues;
  readonly disabled?: boolean;
  readonly onChange: (value: string) => void;
}

// Picks one of the host's own things at a provider (iPod War: a Spotify playlist). Anything that
// can't be used - not theirs, or smaller than the game needs - is listed but not selectable, with
// the reason, so the host can see why a playlist they expected is greyed out.
export const IntegrationResourceSetting = ({ definition, value, values, disabled, onChange }: IntegrationResourceSettingProps) => {
  const { data: resources, isLoading, isError, refetch, isFetching } = useListIntegrationResourcesQuery({
    provider: definition.provider,
    resource: definition.resource,
  });
  const { itemNoun, icon, providerName } = presentationOf(definition);
  const minItems = minItemsFor(definition, values);
  const noun = definition.label.toLowerCase();

  const header = (
    <Box flex={{ direction: 'row', justify: 'between', align: 'center', gap: 8 }}>
      <Text as="span" className="text-sm font-medium" textColor={SURFACE_TEXT}>
        {definition.label}
      </Text>
      <Button
        {...SECONDARY_BUTTON_PROPS}
        className="px-2 py-1 text-xs disabled:opacity-50"
        disabled={isFetching}
        onClick={() => void refetch()}
        entryAdornment={<Icon as="span" name="ArrowClockwise" size={14} />}
      >
        Refresh
      </Button>
    </Box>
  );

  if (isLoading) {
    return (
      <Box flex={{ direction: 'col', gap: 8 }}>
        {header}
        <Loader variant="dots" color={{ color: 'primary', intensity: 500 }} label={`Loading your ${providerName} ${noun}s…`} />
      </Box>
    );
  }

  if (isError || !resources) {
    return (
      <Box flex={{ direction: 'col', gap: 8 }}>
        {header}
        <Alert
          severity="danger"
          closeable={false}
          duration={0}
          message={`Couldn't load your ${providerName} ${noun}s. Check your ${providerName} connection on your profile, then refresh.`}
        />
      </Box>
    );
  }

  const usable = resources.filter((resource) => unusableReason(resource, minItems, itemNoun) === null);
  const largest = Math.max(0, ...resources.filter((resource) => resource.selectable).map((resource) => resource.itemCount));
  const chosen = resources.find((resource) => resource.id === value);
  const chosenProblem = chosen ? unusableReason(chosen, minItems, itemNoun) : null;
  // Usable first, then the rest, each alphabetical.
  const sorted = [...resources].sort(
    (a, b) =>
      Number(unusableReason(a, minItems, itemNoun) !== null) - Number(unusableReason(b, minItems, itemNoun) !== null) ||
      a.name.localeCompare(b.name),
  );

  return (
    <Box flex={{ direction: 'col', gap: 8 }}>
      {header}
      {usable.length === 0 && (
        <Alert
          severity="warning"
          closeable={false}
          duration={0}
          message={
            largest > 0
              ? `None of your ${noun}s has ${minItems} ${itemNoun}. Lower the setting to at most ${largest}, or add ${itemNoun} in ${providerName}.`
              : `You don't have any ${noun}s you can use yet - make one in ${providerName}, then refresh.`
          }
        />
      )}
      {chosenProblem && (
        <Alert severity="warning" closeable={false} duration={0} message={`"${chosen?.name}" can't be used: ${chosenProblem}.`} />
      )}
      {value && !chosen && (
        <Alert severity="warning" closeable={false} duration={0} message={`Your chosen ${noun} is no longer available - choose another.`} />
      )}
      <ul
        role="listbox"
        aria-label={definition.label}
        className={mergeClassNames('flex max-h-80 flex-col gap-1 overflow-y-auto rounded-md border p-1', resolveColorClass('border', SURFACE_BORDER))}
      >
        {sorted.map((resource) => {
          const problem = unusableReason(resource, minItems, itemNoun);
          const isChosen = resource.id === value;
          return (
            <li key={resource.id} role="option" aria-selected={isChosen} aria-disabled={problem !== null}>
              <button
                type="button"
                disabled={disabled || problem !== null}
                onClick={() => onChange(resource.id)}
                className={mergeClassNames(
                  'flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors enabled:hover:bg-surface-200 disabled:cursor-not-allowed',
                  problem !== null && 'opacity-50',
                  isChosen && 'ring-2 ring-primary-500',
                  resolveColorClass('text', SURFACE_TEXT),
                )}
              >
                {resource.imageUrl ? (
                  <img src={resource.imageUrl} alt="" className="h-10 w-10 flex-none rounded object-cover" />
                ) : (
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded bg-surface-200">
                    <Icon as="span" name={icon} size={20} />
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{resource.name}</span>
                  <span className="truncate text-xs">
                    {problem ?? `${resource.itemCount} ${itemNoun}${resource.ownerName ? ` · ${resource.ownerName}` : ''}`}
                  </span>
                </span>
                {isChosen && <Icon as="span" name="CheckCircle" size={20} weight="fill" />}
              </button>
            </li>
          );
        })}
      </ul>
      <Text as="p" className="text-xs" textColor={SURFACE_TEXT}>
        Counts include {itemNoun} that may not be playable (local files, region-locked) - the exact number is checked when the
        game starts.
      </Text>
    </Box>
  );
};
