import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildStatsSnapshot,
  clearAllStats,
  loadSessionHistory,
  loadUserStats,
  recordSessionComplete,
} from "../lib/statsStore";
import { loadJson, removeKey, saveJson, storageKeys } from "../lib/storage";
import type { ActiveSession, SessionRecord, StatsSnapshot, UserStats } from "../types";
import { DEFAULT_USER_STATS } from "../types";

export function useSessions() {
  const [history, setHistory] = useState<SessionRecord[]>(loadSessionHistory);
  const [userStats, setUserStats] = useState<UserStats>(loadUserStats);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(() =>
    loadJson(storageKeys.activeSession, null),
  );

  const snapshot = useMemo(
    () => buildStatsSnapshot(userStats, history),
    [userStats, history],
  );

  useEffect(() => {
    if (activeSession) {
      saveJson(storageKeys.activeSession, activeSession);
    } else {
      removeKey(storageKeys.activeSession);
    }
  }, [activeSession]);

  const startSession = useCallback((session: ActiveSession) => {
    setActiveSession(session);
  }, []);

  const updateActiveSession = useCallback((patch: Partial<ActiveSession>) => {
    setActiveSession((prev) => (prev ? { ...prev, ...patch } : null));
  }, []);

  const completeSession = useCallback(
    (
      record: SessionRecord,
      sessionAnswers: Record<number, { selected: string; correct: boolean }>,
    ) => {
      const { history: updated, userStats: stats } = recordSessionComplete(
        record,
        sessionAnswers,
      );
      setHistory(updated);
      setUserStats(stats);
      setActiveSession(null);
    },
    [],
  );

  const discardActiveSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  const clearHistory = useCallback(() => {
    clearAllStats();
    setHistory([]);
    setUserStats(DEFAULT_USER_STATS);
  }, []);

  return {
    history,
    userStats,
    snapshot,
    activeSession,
    startSession,
    updateActiveSession,
    completeSession,
    discardActiveSession,
    clearHistory,
  };
}

export type { StatsSnapshot };
