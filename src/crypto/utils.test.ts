import { describe, expect, test } from 'bun:test';
import { derivePassword } from './utils';

describe('derivePassword', () => {
  const params = {
    seed: 'my-secret-seed',
    timestamp: '1705315800',
    identifier: 'user-database',
  };

  test('produces deterministic output for same inputs', () => {
    const result1 = derivePassword(params);
    const result2 = derivePassword(params);

    expect(result1).toBe(result2);
  });

  test('different seeds produce different outputs', () => {
    const result1 = derivePassword({ ...params, seed: 'seed-a' });
    const result2 = derivePassword({ ...params, seed: 'seed-b' });

    expect(result1).not.toBe(result2);
  });

  test('different timestamps produce different outputs', () => {
    const result1 = derivePassword({ ...params, timestamp: '1705315800' });
    const result2 = derivePassword({ ...params, timestamp: '1705315801' });

    expect(result1).not.toBe(result2);
  });

  test('different identifiers produce different outputs', () => {
    const result1 = derivePassword({ ...params, identifier: 'user-a' });
    const result2 = derivePassword({ ...params, identifier: 'user-b' });

    expect(result1).not.toBe(result2);
  });

  test('returns a 64-character hex string', () => {
    const result = derivePassword(params);

    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });
});
