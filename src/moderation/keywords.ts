/**
 * Layer 1: 關鍵字與模式過濾
 * 硬性攔截（blocked）與高風險（red）關鍵字，含繁簡/諧音/數字替換
 * 上線前需與安全團隊審核並擴充
 */
const BLOCKED_PATTERNS: (RegExp | string)[] = [
  // 具體自殺/自傷手段描述（範例，需專業審核擴充）
  /自殺|自盡|自刎|上吊|跳樓|燒炭|割腕|服毒|尋死|了結|輕生/,
  /自殺方法|自殺方式|怎麼死|如何死/,
  // 煽動他人
  /去死|死一死|你該死|都去死/,
  // 仇恨言論（簡化範例）
  /殺光|滅族|去死吧/,
];

/** 高風險但非 100% 攔截的關鍵字 → 觸發 red 審核 */
const RED_FLAGS: (RegExp | string)[] = [
  /不想活|活不下去|活著沒意義|沒希望了|解脫/,
  /遺書|告別|最後一天/,
];

/** 諧音/數字替換對照（用於正規化後比對） */
const NORMALIZE_MAP: [RegExp, string][] = [
  [/4/g, '死'],
  [/ㄙ/g, '死'],
  [/亖/g, '死'],
  [/\s/g, ''],
];

function normalizeForMatch(text: string): string {
  let t = text;
  for (const [re, replacement] of NORMALIZE_MAP) {
    t = t.replace(re, replacement);
  }
  return t;
}

export type AlertLevel = 'safe' | 'yellow' | 'orange' | 'red' | 'blocked';

export interface ModerationResult {
  level: AlertLevel;
  matched?: string[];
  message?: string;
}

/**
 * 執行 Layer 1 關鍵字檢查
 * 回傳 blocked / red / safe（orange/yellow 留給 Layer 2 NLP 或行為）
 */
export function checkKeywordLayer(content: string): ModerationResult {
  if (!content || typeof content !== 'string') return { level: 'safe' };
  const normalized = normalizeForMatch(content);
  const matched: string[] = [];

  for (const p of BLOCKED_PATTERNS) {
    const re = typeof p === 'string' ? new RegExp(escapeRe(p), 'i') : p;
    if (re.test(content) || re.test(normalized)) {
      matched.push(p.toString());
      return {
        level: 'blocked',
        matched,
        message: '內容涉及不當資訊，無法發佈。如需傾訴，請使用下方資源。',
      };
    }
  }

  for (const p of RED_FLAGS) {
    const re = typeof p === 'string' ? new RegExp(escapeRe(p), 'i') : p;
    if (re.test(content) || re.test(normalized)) {
      matched.push(p.toString());
      return {
        level: 'red',
        matched,
        message: '我們注意到你可能正經歷很大的痛苦。你不是一個人。',
      };
    }
  }

  return { level: 'safe' };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
