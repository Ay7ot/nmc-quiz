const KEYS = {
  progress: "nmc-quiz-progress",
  settings: "nmc-quiz-settings",
  sessions: "nmc-quiz-sessions",
  stats: "nmc-quiz-stats",
  activeSession: "nmc-quiz-active-session",
} as const;

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeKey(key: string): void {
  localStorage.removeItem(key);
}

export const storageKeys = KEYS;
