export interface User {
  id: string;
  anonymous_alias: string;
  device_fingerprint: string;
  subscription_tier: string;
  created_at: Date;
  last_active_at: Date;
}

export interface MoodTag {
  tag: string;
  valence: number;
  arousal: number;
  weather_emoji: string;
}

export type AlertLevel = 'safe' | 'yellow' | 'orange' | 'red' | 'blocked';

export interface Mood {
  id: string;
  user_id: string;
  content: string;
  mood_tag: string;
  valence: number;
  arousal: number;
  location: string;
  location_fuzzy: string;
  precision_level: string;
  h3_index_res7: string | null;
  h3_index_res5: string | null;
  h3_index_res3: string | null;
  is_active: boolean;
  expires_at: Date;
  alert_level: AlertLevel;
  created_at: Date;
  anonymous_alias?: string;
  weather_emoji?: string;
  reaction_count?: number;
  lat?: number;
  lng?: number;
}

export interface Reaction {
  id: string;
  mood_id: string;
  user_id: string;
  reaction_type: string;
  created_at: Date;
}

export const CANNED_RESPONSES = ['hug', 'cheer', 'feel_you', 'together', 'hang_in'] as const;
export const CANNED_LABELS: Record<string, string> = {
  hug: '抱抱',
  cheer: '加油',
  feel_you: '我懂',
  together: '一起吧',
  hang_in: '辛苦了',
};
export const EMOJI_REACTIONS = ['❤️', '🫂', '💪', '😢', '🌈', '☀️'] as const;
