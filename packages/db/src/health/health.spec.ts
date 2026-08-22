import { describe, expect, it, vi } from 'vitest';

const commandMock = vi.fn();
const dbMock = vi.fn(() => ({ command: commandMock }));

vi.mock('../connection/index.js', () => ({
  getClient: () => ({ db: dbMock }),
}));

const { checkDatabaseHealth } = await import('./health.js');

describe('checkDatabaseHealth', () => {
  it('reports connected when the ping succeeds', async () => {
    commandMock.mockResolvedValueOnce({ ok: 1 });

    const result = await checkDatabaseHealth();

    expect(result).toEqual({ connected: true });
    expect(commandMock).toHaveBeenCalledWith({ ping: 1 });
  });

  it('reports disconnected with the error message when the ping fails', async () => {
    commandMock.mockRejectedValueOnce(new Error('connection timed out'));

    const result = await checkDatabaseHealth();

    expect(result).toEqual({ connected: false, error: 'connection timed out' });
  });

  it('falls back to String(error) for a non-Error rejection', async () => {
    commandMock.mockRejectedValueOnce('boom');

    const result = await checkDatabaseHealth();

    expect(result).toEqual({ connected: false, error: 'boom' });
  });
});
