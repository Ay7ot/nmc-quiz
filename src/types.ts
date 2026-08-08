export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: number;
  question: string;
  options: Option[];
  /** Single correct option (legacy / standard MCQ) */
  answer: string | null;
  /** Multiple correct options (select-all-that-apply) */
  answers?: string[];
}

export interface QuestionBank {
  meta: {
    title: string;
    total: number;
    withAnswers: number;
  };
  questions: Question[];
}

export interface ProgressEntry {
  selected: string;
  correct: boolean;
  answeredAt: string;
  attempts: number;
}

export type ProgressMap = Record<number, ProgressEntry>;

export type QuestionFilter = "all" | "unanswered" | "wrong";

/**
 * practice = Quick Quiz — instant feedback on check
 * exam = Practice — answers hidden until submit, then review all
 * timed = Exam — like Practice but with a countdown timer that auto-submits
 * read = Read — correct answers shown directly on each question
 */
export type QuizMode = "practice" | "exam" | "timed" | "read";

export const QUIZ_MODE_LABELS: Record<QuizMode, string> = {
  practice: "Quick Quiz",
  exam: "Practice",
  timed: "Exam",
  read: "Read",
};

export function quizModeLabel(mode: QuizMode): string {
  return QUIZ_MODE_LABELS[mode] ?? mode;
}

export interface QuizSettings {
  mode: QuizMode;
  questionsPerSession: number;
  randomize: boolean;
  questionFilter: QuestionFilter;
  autoAdvance: boolean;
  autoAdvanceDelayMs: number;
  shuffleOptions: boolean;
  /** Total time budget in minutes for a timed (Exam) session */
  timeLimitMin: number;
}

export interface SessionRecord {
  id: string;
  startedAt: string;
  completedAt: string;
  questionIds: number[];
  correct: number;
  incorrect: number;
  skipped: number;
  scorePercent: number;
  durationMs: number;
  settings: QuizSettings;
  /** Per-question answers — available for sessions completed after this field was added */
  answers?: Record<number, { selected: string; correct: boolean }>;
}

export interface ActiveSession {
  id: string;
  startedAt: string;
  questionIds: number[];
  settings: QuizSettings;
  currentIndex: number;
  sessionAnswers: Record<number, { selected: string; correct: boolean }>;
}

export interface HighScoreEntry {
  scorePercent: number;
  sessionId: string;
  date: string;
  questionCount: number;
  correct: number;
}

export interface UserStats {
  /** All-time best session score (answered questions only) */
  bestScore: HighScoreEntry | null;
  /** Best score per session size bucket (10, 20, 30, 50, 100, all) */
  bestBySize: Record<string, HighScoreEntry>;
  totalSessions: number;
  totalStudyTimeMs: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  firstSessionAt: string | null;
  lastSessionAt: string | null;
  /** Longest streak of correct answers within a single session */
  bestStreak: number;
  /** Rolling averages for trend */
  lastSessionScore: number | null;
}

export interface StatsSnapshot {
  userStats: UserStats;
  recentSessions: SessionRecord[];
  averageLast5: number | null;
  averagePrevious5: number | null;
  improvementDelta: number | null;
  weeklySessions: number;
  weeklyAverage: number | null;
  chartSessions: { label: string; score: number; date: string }[];
}

export type Screen = "home" | "stats" | "review" | "quiz" | "results";

export type Tab = "practice" | "review" | "stats";

export const SESSION_SIZE_PRESETS = [10, 20, 30, 50, 100] as const;

export const DEFAULT_SETTINGS: QuizSettings = {
  mode: "practice",
  questionsPerSession: 20,
  randomize: true,
  questionFilter: "all",
  autoAdvance: false,
  autoAdvanceDelayMs: 1500,
  shuffleOptions: false,
  timeLimitMin: 30,
};

export const DEFAULT_USER_STATS: UserStats = {
  bestScore: null,
  bestBySize: {},
  totalSessions: 0,
  totalStudyTimeMs: 0,
  totalQuestionsAnswered: 0,
  totalCorrect: 0,
  firstSessionAt: null,
  lastSessionAt: null,
  bestStreak: 0,
  lastSessionScore: null,
};

export function sessionScorePercent(
  record: Pick<SessionRecord, "correct" | "incorrect" | "skipped" | "questionIds">,
): number {
  const total =
    record.questionIds?.length ?? record.correct + record.incorrect + record.skipped;
  if (total === 0) return 0;
  return Math.round((record.correct / total) * 100);
}

export function sizeBucket(questionCount: number): string {
  const presets = [10, 20, 30, 50, 100];
  for (const p of presets) {
    if (questionCount <= p) return String(p);
  }
  return "all";
}
