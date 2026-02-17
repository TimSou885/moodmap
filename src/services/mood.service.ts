import { latLngToCell } from 'h3-js';
import { query } from '../db/index.js';
import { config } from '../config.js';
import { scanContent } from '../moderation/index.js';
import type { Mood, AlertLevel } from '../types.js';

const MOOD_TAG_VALENCE_AROUSAL: Record<string, { valence: number; arousal: number }> = {
  happy: { valence: 0.8, arousal: 0.3 },
  excited: { valence: 0.7, arousal: 0.9 },
  grateful: { valence: 0.9, arousal: -0.2 },
  peaceful: { valence: 0.5, arousal: -0.7 },
  tired: { valence: -0.3, arousal: -0.6 },
  anxious: { valence: -0.5, arousal: 0.7 },
  sad: { valence: -0.7, arousal: -0.5 },
  angry: { valence: -0.8, arousal: 0.9 },
  lonely: { valence: -0.6, arousal: -0.4 },
  accomplished: { valence: 0.7, arousal: 0.5 },
  confused: { valence: -0.2, arousal: 0.2 },
  hopeful: { valence: 0.6, arousal: 0.4 },
};

export interface CreateMoodInput {
  userId: string;
  content: string;
  moodTag: string;
  latitude: number;
  longitude: number;
  precisionLevel: 'exact' | 'neighborhood';
}

export interface CreateMoodResult {
  mood: Mood | null;
  blocked: boolean;
  alertLevel: AlertLevel;
  careMessage?: string;
  moderationMessage?: string;
}

export async function createMood(input: CreateMoodInput): Promise<CreateMoodResult> {
  const { userId, content, moodTag, latitude, longitude, precisionLevel } = input;

  if (content.length > 150) {
    throw new Error('CONTENT_TOO_LONG');
  }
  const tagMeta = MOOD_TAG_VALENCE_AROUSAL[moodTag];
  if (!tagMeta) {
    throw new Error('INVALID_MOOD_TAG');
  }

  const rateLimit = await query<{ count: string }>(
    `SELECT COUNT(*) FROM moods WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [userId]
  );
  const count = parseInt(rateLimit.rows[0]?.count ?? '0', 10);
  if (count >= config.MOOD_RATE_LIMIT_PER_HOUR) {
    throw new Error('RATE_LIMIT_MOOD');
  }

  const moderation = scanContent(content);
  if (moderation.level === 'blocked') {
    return {
      mood: null,
      blocked: true,
      alertLevel: 'blocked',
      moderationMessage: moderation.message,
    };
  }

  const alertLevel = moderation.level === 'red' ? 'red' : 'safe';
  const expiresAt = new Date(Date.now() + config.MOOD_EXPIRY_HOURS * 60 * 60 * 1000);

  const lng = longitude;
  const lat = latitude;
  const point = `SRID=4326;POINT(${lng} ${lat})`;
  let fuzzyPoint = point;
  if (precisionLevel === 'neighborhood') {
    const h9 = latLngToCell(lat, lng, 9);
    const [fLat, fLng] = (await import('h3-js')).cellToLatLng(h9);
    fuzzyPoint = `SRID=4326;POINT(${fLng} ${fLat})`;
  }

  const h3_7 = latLngToCell(lat, lng, 7);
  const h3_5 = latLngToCell(lat, lng, 5);
  const h3_3 = latLngToCell(lat, lng, 3);

  const insert = await query<{
    id: string; user_id: string; content: string; mood_tag: string; valence: number; arousal: number;
    precision_level: string; h3_index_res7: string; h3_index_res5: string; h3_index_res3: string;
    is_active: boolean; expires_at: Date; alert_level: string; created_at: Date;
  }>(
    `INSERT INTO moods (
      user_id, content, mood_tag, valence, arousal,
      location, location_fuzzy, precision_level,
      h3_index_res7, h3_index_res5, h3_index_res3,
      is_active, expires_at, alert_level
    ) VALUES (
      $1, $2, $3, $4, $5,
      ST_GeogFromText($6), ST_GeogFromText($7), $8,
      $9, $10, $11,
      true, $12, $13
    ) RETURNING id, user_id, content, mood_tag, valence, arousal, precision_level,
      h3_index_res7, h3_index_res5, h3_index_res3, is_active, expires_at, alert_level, created_at`,
    [
      userId, content.slice(0, 150), moodTag, tagMeta.valence, tagMeta.arousal,
      point, fuzzyPoint, precisionLevel,
      h3_7, h3_5, h3_3,
      expiresAt, alertLevel,
    ]
  );
  const row = insert.rows[0];

  if (alertLevel === 'red') {
    await query(
      `INSERT INTO moderation_queue (mood_id, alert_level, reason, status) VALUES ($1, 'red', $2, 'pending')`,
      [row.id, moderation.matched?.join(', ') ?? 'Layer1 red flag']
    );
  }

  const tagRow = await query<{ weather_emoji: string }>('SELECT weather_emoji FROM mood_tags WHERE tag = $1', [moodTag]);
  const weather_emoji = tagRow.rows[0]?.weather_emoji ?? '⛅';

  const mood: Mood = {
    id: row.id,
    user_id: row.user_id,
    content: row.content,
    mood_tag: row.mood_tag,
    valence: row.valence,
    arousal: row.arousal,
    location: point,
    location_fuzzy: fuzzyPoint,
    precision_level: row.precision_level,
    h3_index_res7: row.h3_index_res7,
    h3_index_res5: row.h3_index_res5,
    h3_index_res3: row.h3_index_res3,
    is_active: row.is_active,
    expires_at: row.expires_at,
    alert_level: row.alert_level as AlertLevel,
    created_at: row.created_at,
    weather_emoji,
  };

  return {
    mood,
    blocked: false,
    alertLevel: mood.alert_level,
    careMessage: moderation.level === 'red' ? moderation.message : undefined,
  };
}

export async function getNearbyMoods(
  lat: number,
  lng: number,
  radiusMeters: number,
  limit: number,
  userId: string
): Promise<Mood[]> {
  const result = await query<{
    id: string; user_id: string; content: string; mood_tag: string; valence: number; arousal: number;
    precision_level: string; h3_index_res7: string; h3_index_res5: string; h3_index_res3: string;
    is_active: boolean; expires_at: Date; alert_level: string; created_at: Date;
    anonymous_alias: string; weather_emoji: string; reaction_count: string;
    lat: string; lng: string;
  }>(
    `SELECT m.id, m.user_id, m.content, m.mood_tag, m.valence, m.arousal, m.precision_level,
            m.h3_index_res7, m.h3_index_res5, m.h3_index_res3, m.is_active, m.expires_at, m.alert_level, m.created_at,
            u.anonymous_alias, t.weather_emoji,
            (SELECT COUNT(*) FROM reactions r WHERE r.mood_id = m.id) AS reaction_count,
            ST_Y(m.location_fuzzy::geometry) AS lat, ST_X(m.location_fuzzy::geometry) AS lng
     FROM moods m
     JOIN users u ON u.id = m.user_id
     JOIN mood_tags t ON t.tag = m.mood_tag
     WHERE m.is_active = true AND m.expires_at > NOW()
       AND (m.alert_level != 'red' OR m.user_id = $5)
       AND ST_DWithin(m.location_fuzzy::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
     ORDER BY m.created_at DESC
     LIMIT $4`,
    [lat, lng, radiusMeters, limit, userId]
  );

  return result.rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    content: r.content,
    mood_tag: r.mood_tag,
    valence: r.valence,
    arousal: r.arousal,
    location: '',
    location_fuzzy: '',
    precision_level: r.precision_level,
    h3_index_res7: r.h3_index_res7,
    h3_index_res5: r.h3_index_res5,
    h3_index_res3: r.h3_index_res3,
    is_active: r.is_active,
    expires_at: r.expires_at,
    alert_level: r.alert_level as AlertLevel,
    created_at: r.created_at,
    anonymous_alias: r.anonymous_alias,
    weather_emoji: r.weather_emoji,
    reaction_count: parseInt(r.reaction_count, 10),
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lng),
  }));
}

export async function getMoodById(moodId: string, userId: string): Promise<Mood | null> {
  const result = await query<{
    id: string; user_id: string; content: string; mood_tag: string; valence: number; arousal: number;
    precision_level: string; h3_index_res7: string; h3_index_res5: string; h3_index_res3: string;
    is_active: boolean; expires_at: Date; alert_level: string; created_at: Date;
    anonymous_alias: string; weather_emoji: string; reaction_count: string;
    lat: string; lng: string;
  }>(
    `SELECT m.id, m.user_id, m.content, m.mood_tag, m.valence, m.arousal, m.precision_level,
            m.h3_index_res7, m.h3_index_res5, m.h3_index_res3, m.is_active, m.expires_at, m.alert_level, m.created_at,
            u.anonymous_alias, t.weather_emoji,
            (SELECT COUNT(*) FROM reactions r WHERE r.mood_id = m.id) AS reaction_count,
            ST_Y(m.location_fuzzy::geometry) AS lat, ST_X(m.location_fuzzy::geometry) AS lng
     FROM moods m
     JOIN users u ON u.id = m.user_id
     JOIN mood_tags t ON t.tag = m.mood_tag
     WHERE m.id = $1 AND m.is_active = true AND (m.alert_level != 'red' OR m.user_id = $2)`,
    [moodId, userId]
  );
  const r = result.rows[0];
  if (!r) return null;
  return {
    id: r.id,
    user_id: r.user_id,
    content: r.content,
    mood_tag: r.mood_tag,
    valence: r.valence,
    arousal: r.arousal,
    location: '',
    location_fuzzy: '',
    precision_level: r.precision_level,
    h3_index_res7: r.h3_index_res7,
    h3_index_res5: r.h3_index_res5,
    h3_index_res3: r.h3_index_res3,
    is_active: r.is_active,
    expires_at: r.expires_at,
    alert_level: r.alert_level as AlertLevel,
    created_at: r.created_at,
    anonymous_alias: r.anonymous_alias,
    weather_emoji: r.weather_emoji,
    reaction_count: parseInt(r.reaction_count, 10),
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lng),
  };
}
