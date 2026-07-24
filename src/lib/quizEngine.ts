import type { ProgressMap, Question, QuestionFilter, QuizSettings } from "../types";

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function filterQuestions(
  questions: Question[],
  progress: ProgressMap,
  filter: QuestionFilter,
): Question[] {
  switch (filter) {
    case "unanswered":
      return questions.filter((q) => !progress[q.id]);
    case "wrong":
      return questions.filter((q) => progress[q.id]?.correct === false);
    default:
      return questions;
  }
}

export function buildSessionOrder(
  questions: Question[],
  progress: ProgressMap,
  settings: QuizSettings,
): number[] {
  const pool = filterQuestions(questions, progress, settings.questionFilter);
  const ids = pool.map((q) => q.id);
  const ordered = settings.randomize ? shuffleArray(ids) : ids;
  const limit =
    settings.questionsPerSession >= questions.length
      ? ordered.length
      : Math.min(settings.questionsPerSession, ordered.length);
  return ordered.slice(0, limit);
}

export function sessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
