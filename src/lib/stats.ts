import type { SessionRecord, StatsSnapshot, UserStats } from "../types";
import { DEFAULT_USER_STATS, sessionScorePercent, sizeBucket } from "../types";

export function computeStreak(
  questionIds: number[],
  answers: Record<number, { correct: boolean }>,
): number {
  let best = 0;
  let current = 0;
  for (const qid of questionIds) {
    const a = answers[qid];
    if (a?.correct) {
      current++;
      best = Math.max(best, current);
    } else if (a) {
      current = 0;
    }
  }
  return best;
}

export function buildHighScoreEntry(record: SessionRecord): {
  scorePercent: number;
  sessionId: string;
  date: string;
  questionCount: number;
  correct: number;
} {
  return {
    scorePercent: record.scorePercent,
    sessionId: record.id,
    date: record.completedAt,
    questionCount: record.questionIds.length,
    correct: record.correct,
  };
}

export function applySessionToStats(
  stats: UserStats,
  record: SessionRecord,
  streak: number,
): UserStats {
  const entry = buildHighScoreEntry(record);
  const answered = record.correct + record.incorrect;
  const bucket = sizeBucket(record.questionIds.length);

  const bestScore =
    !stats.bestScore || entry.scorePercent > stats.bestScore.scorePercent
      ? entry
      : stats.bestScore;

  const prevBucket = stats.bestBySize[bucket];
  const bestBySize = {
    ...stats.bestBySize,
    [bucket]:
      !prevBucket || entry.scorePercent > prevBucket.scorePercent
        ? entry
        : prevBucket,
  };

  return {
    bestScore,
    bestBySize,
    totalSessions: stats.totalSessions + 1,
    totalStudyTimeMs: stats.totalStudyTimeMs + record.durationMs,
    totalQuestionsAnswered: stats.totalQuestionsAnswered + answered,
    totalCorrect: stats.totalCorrect + record.correct,
    firstSessionAt: stats.firstSessionAt ?? record.completedAt,
    lastSessionAt: record.completedAt,
    bestStreak: Math.max(stats.bestStreak, streak),
    lastSessionScore: record.scorePercent,
  };
}

export function buildStatsSnapshot(
  userStats: UserStats,
  history: SessionRecord[],
): StatsSnapshot {
  const completed = history.filter(
    (s) => s.correct + s.incorrect > 0,
  );

  const scores = completed.map((s) => s.scorePercent);
  const last5 = scores.slice(0, 5);
  const prev5 = scores.slice(5, 10);

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  const averageLast5 = avg(last5);
  const averagePrevious5 = avg(prev5);
  const improvementDelta =
    averageLast5 != null && averagePrevious5 != null
      ? averageLast5 - averagePrevious5
      : null;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekly = completed.filter(
    (s) => new Date(s.completedAt).getTime() >= weekAgo,
  );
  const weeklyAverage = avg(weekly.map((s) => s.scorePercent));

  const chartSessions = completed.slice(0, 12).reverse().map((s, i) => ({
    label: `#${completed.length - i}`,
    score: s.scorePercent,
    date: s.completedAt,
  }));

  return {
    userStats,
    recentSessions: history,
    averageLast5,
    averagePrevious5,
    improvementDelta,
    weeklySessions: weekly.length,
    weeklyAverage,
    chartSessions,
  };
}

/** Migrate legacy session records missing scorePercent/durationMs */
export function normalizeSession(raw: Partial<SessionRecord> & Pick<SessionRecord, "id" | "questionIds" | "correct" | "incorrect" | "skipped" | "settings">): SessionRecord {
  const startedAt = raw.startedAt ?? raw.completedAt ?? new Date().toISOString();
  const completedAt = raw.completedAt ?? startedAt;
  const durationMs =
    raw.durationMs ??
    Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime());

  const base = {
    id: raw.id,
    startedAt,
    completedAt,
    questionIds: raw.questionIds,
    correct: raw.correct,
    incorrect: raw.incorrect,
    skipped: raw.skipped,
    durationMs,
    settings: raw.settings,
  };

  return {
    ...base,
    scorePercent: raw.scorePercent ?? sessionScorePercent(base),
  };
}

export { DEFAULT_USER_STATS };
