import { describe, expect, it } from 'vitest';
import { deriveStatus } from './derive-status.js';

describe('deriveStatus', () => {
  it('is offline when not authenticated, regardless of idle or session state', () => {
    expect(deriveStatus({ isAuthenticated: false, isIdle: false })).toBe('offline');
    expect(deriveStatus({ isAuthenticated: false, isIdle: true, isInActiveSession: true })).toBe('offline');
  });

  it('is busy when authenticated and in an active session, even if idle', () => {
    expect(deriveStatus({ isAuthenticated: true, isIdle: true, isInActiveSession: true })).toBe('busy');
    expect(deriveStatus({ isAuthenticated: true, isIdle: false, isInActiveSession: true })).toBe('busy');
  });

  it('is away when authenticated, idle, and not in an active session', () => {
    expect(deriveStatus({ isAuthenticated: true, isIdle: true })).toBe('away');
  });

  it('is online when authenticated, active, and not in a session', () => {
    expect(deriveStatus({ isAuthenticated: true, isIdle: false })).toBe('online');
  });
});
