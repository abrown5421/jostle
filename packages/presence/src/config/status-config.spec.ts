import { describe, expect, it } from 'vitest';
import { IDLE_THRESHOLD_MS, STATUS_INDICATOR_CONFIG } from './status-config.js';

describe('STATUS_INDICATOR_CONFIG', () => {
  it('defines every presence status', () => {
    expect(Object.keys(STATUS_INDICATOR_CONFIG).sort()).toEqual(['away', 'busy', 'offline', 'online']);
  });

  it.each([
    ['online', 'Online', 'bg-status-online'],
    ['away', 'Away', 'bg-status-away'],
    ['busy', 'Busy', 'bg-status-busy'],
    ['offline', 'Offline', 'bg-status-offline'],
  ] as const)('maps %s to label %s and class %s', (status, label, indicatorClassName) => {
    expect(STATUS_INDICATOR_CONFIG[status]).toMatchObject({ label, indicatorClassName });
  });
});

describe('IDLE_THRESHOLD_MS', () => {
  it('is 10 minutes', () => {
    expect(IDLE_THRESHOLD_MS).toBe(10 * 60 * 1000);
  });
});
