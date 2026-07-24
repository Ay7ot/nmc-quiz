import { useCallback, useEffect, useState } from "react";
import { loadJson, saveJson, storageKeys } from "../lib/storage";
import { DEFAULT_SETTINGS, type QuizSettings } from "../types";

export function useSettings() {
  const [settings, setSettings] = useState<QuizSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...loadJson<Partial<QuizSettings>>(storageKeys.settings, {}),
  }));

  useEffect(() => {
    saveJson(storageKeys.settings, settings);
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<QuizSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, updateSettings, resetSettings };
}
