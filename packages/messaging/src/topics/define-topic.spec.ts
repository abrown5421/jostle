import { describe, expect, it } from 'vitest';
import { defineTopic } from './define-topic.js';

describe('defineTopic', () => {
  const topic = defineTopic<{ userId: string }, { text: string }>('user:{userId}:notifications');

  it('builds a channel string from params', () => {
    expect(topic.channel({ userId: 'abc-123' })).toBe('user:abc-123:notifications');
  });

  it('parses params back out of a matching channel', () => {
    expect(topic.match('user:abc-123:notifications')).toEqual({ userId: 'abc-123' });
  });

  it('returns undefined for a channel that does not match the pattern', () => {
    expect(topic.match('session:abc-123')).toBeUndefined();
  });

  it('percent-encodes params that contain reserved characters', () => {
    expect(topic.channel({ userId: 'a:b' })).toBe('user:a%3Ab:notifications');
  });
});
