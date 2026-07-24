import { loadJson, removeKey, saveJson, storageKeys } from "../lib/storage";
import {
  applySessionToStats,
  buildStatsSnapshot,
  computeStreak,
  DEFAULT_USER_STATS,
  normalizeSession,
} from "../lib/stats";
import type { SessionRecord, StatsSnapshot, UserStats } from "../types";

export { buildStatsSnapshot };

const MAX_HISTORY = 100;

export function loadSessionHistory(): SessionRecord[] {
  const raw = loadJson<Partial<SessionRecord>[]>(storageKeys.sessions, []);
  return raw.map((s) =>
    normalizeSession(
      s as Partial<SessionRecord> & Pick<SessionRecord, "id" | "questionIds" | "correct" | "incorrect" | "skipped" | "settings">,
    ),
  );
}

export function loadUserStats(): UserStats {
  return loadJson(storageKeys.stats, DEFAULT_USER_STATS);
}

export function recordSessionComplete(
  record: SessionRecord,
  sessionAnswers: Record<number, { selected: string; correct: boolean }>,
): { history: SessionRecord[]; userStats: UserStats } {
  const history = [record, ...loadSessionHistory()].slice(0, MAX_HISTORY);
  saveJson(storageKeys.sessions, history);

  const streak = computeStreak(record.questionIds, sessionAnswers);
  const userStats = applySessionToStats(loadUserStats(), record, streak);
  saveJson(storageKeys.stats, userStats);

  return { history, userStats };
}

export function clearAllStats(): void {
  removeKey(storageKeys.sessions);
  removeKey(storageKeys.stats);
}

export function getStatsSnapshot(
  history: SessionRecord[],
  userStats: UserStats,
): StatsSnapshot {
  return buildStatsSnapshot(userStats, history);
}
