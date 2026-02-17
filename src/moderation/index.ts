import { checkKeywordLayer, type AlertLevel, type ModerationResult } from './keywords.js';

export type { AlertLevel, ModerationResult };
export { checkKeywordLayer };

/**
 * 即時安全掃描入口（Phase 0 以 Layer 1 為主，Layer 2 NLP 可後接）
 * 目標 ≤200ms
 */
export function scanContent(content: string): ModerationResult {
  return checkKeywordLayer(content);
}
