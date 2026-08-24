import { describe, expect, it, vi } from 'vitest';
import { bootstrapExampleMessaging } from './register-handlers.js';

describe('bootstrapExampleMessaging', () => {
  it('delivers each domain event to its registered handler', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { teardown } = await bootstrapExampleMessaging();

    expect(logSpy).toHaveBeenCalledWith('presence:user-1 is now online');
    expect(logSpy).toHaveBeenCalledWith('notification request_sent from user-2 to user-1');
    expect(logSpy).toHaveBeenCalledWith('session tick 1: state_sync (player)');

    teardown();
    logSpy.mockRestore();
  });
});
