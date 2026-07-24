import { useCallback, useEffect, useState } from "react";
import { loadJson, removeKey, saveJson, storageKeys } from "../lib/storage";
import type { ProgressMap } from "../types";

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>(() =>
    loadJson(storageKeys.progress, {}),
  );

  useEffect(() => {
    saveJson(storageKeys.progress, progress);
  }, [progress]);

  const recordAnswer = useCallback(
    (questionId: number, selected: string, correct: boolean) => {
      setProgress((prev) => {
        const existing = prev[questionId];
        return {
          ...prev,
          [questionId]: {
            selected,
            correct,
            answeredAt: new Date().toISOString(),
            attempts: (existing?.attempts ?? 0) + 1,
          },
        };
      });
    },
    [],
  );

  const resetProgress = useCallback(() => {
    setProgress({});
    removeKey(storageKeys.progress);
  }, []);

  const entries = Object.values(progress);
  const answered = entries.length;
  const correctCount = entries.filter((s) => s.correct).length;
  const wrongCount = entries.filter((s) => !s.correct).length;

  return {
    progress,
    recordAnswer,
    resetProgress,
    answered,
    correct: correctCount,
    wrong: wrongCount,
  };
}
