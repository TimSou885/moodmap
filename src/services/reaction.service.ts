import { query } from '../db/index.js';
import { CANNED_RESPONSES, EMOJI_REACTIONS } from '../types.js';

const VALID_TYPES = new Set([
  ...CANNED_RESPONSES,
  ...EMOJI_REACTIONS,
]);

export async function addReaction(
  moodId: string,
  userId: string,
  reactionType: string
): Promise<{ ok: boolean; error?: string }> {
  if (!VALID_TYPES.includes(reactionType as any)) {
    return { ok: false, error: 'INVALID_REACTION_TYPE' };
  }
  try {
    await query(
      `INSERT INTO reactions (mood_id, user_id, reaction_type) VALUES ($1, $2, $3)`,
      [moodId, userId, reactionType]
    );
    return { ok: true };
  } catch (err: any) {
    if (err.code === '23505') return { ok: false, error: 'ALREADY_REACTED' };
    throw err;
  }
}

export async function getReactionsByMoodId(moodId: string) {
  const result = await query<{ reaction_type: string; count: string }>(
    `SELECT reaction_type, COUNT(*) AS count FROM reactions WHERE mood_id = $1 GROUP BY reaction_type`,
    [moodId]
  );
  return result.rows.map((r) => ({ reaction_type: r.reaction_type, count: parseInt(r.count, 10) }));
}
