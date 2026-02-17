import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import type { User } from '../types.js';

const ADJECTIVES = ['深夜的', '安靜的', '溫柔的', '好奇的', '孤單的', '勇敢的', '疲憊的', '微笑的'];
const NOUNS = ['貓頭鷹', '旅人', '星星', '海風', '路人', '雲朵', '螢火蟲', '書頁'];

function generateAnonymousAlias(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj}${noun}`;
}

export async function findOrCreateUser(deviceFingerprint: string): Promise<User> {
  const existing = await query<{ id: string; anonymous_alias: string; device_fingerprint: string; subscription_tier: string; created_at: Date; last_active_at: Date }>(
    `SELECT id, anonymous_alias, device_fingerprint, subscription_tier, created_at, last_active_at
     FROM users WHERE device_fingerprint = $1 LIMIT 1`,
    [deviceFingerprint]
  );
  if (existing.rows[0]) {
    await query(
      'UPDATE users SET last_active_at = NOW() WHERE id = $1',
      [existing.rows[0].id]
    );
    return {
      id: existing.rows[0].id,
      anonymous_alias: existing.rows[0].anonymous_alias,
      device_fingerprint: existing.rows[0].device_fingerprint,
      subscription_tier: existing.rows[0].subscription_tier,
      created_at: existing.rows[0].created_at,
      last_active_at: new Date(),
    };
  }
  const alias = generateAnonymousAlias();
  const insert = await query<{ id: string; anonymous_alias: string; device_fingerprint: string; subscription_tier: string; created_at: Date; last_active_at: Date }>(
    `INSERT INTO users (anonymous_alias, device_fingerprint, subscription_tier)
     VALUES ($1, $2, 'free') RETURNING id, anonymous_alias, device_fingerprint, subscription_tier, created_at, last_active_at`,
    [alias, deviceFingerprint]
  );
  const row = insert.rows[0];
  return {
    id: row.id,
    anonymous_alias: row.anonymous_alias,
    device_fingerprint: row.device_fingerprint,
    subscription_tier: row.subscription_tier,
    created_at: row.created_at,
    last_active_at: row.last_active_at,
  };
}

export async function getUserById(userId: string): Promise<User | null> {
  const result = await query<{ id: string; anonymous_alias: string; device_fingerprint: string; subscription_tier: string; created_at: Date; last_active_at: Date }>(
    'SELECT id, anonymous_alias, device_fingerprint, subscription_tier, created_at, last_active_at FROM users WHERE id = $1',
    [userId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    anonymous_alias: row.anonymous_alias,
    device_fingerprint: row.device_fingerprint,
    subscription_tier: row.subscription_tier,
    created_at: row.created_at,
    last_active_at: row.last_active_at,
  };
}
