import type { Question } from "../types";

/** All correct option ids for a question (supports legacy single `answer`). */
export function getCorrectAnswers(question: Question): string[] {
  if (question.answers?.length) return [...question.answers];
  if (question.answer) return [question.answer];
  return [];
}

export function isMultiSelect(question: Question): boolean {
  return getCorrectAnswers(question).length > 1;
}

export function hasKnownAnswer(question: Question): boolean {
  return getCorrectAnswers(question).length > 0;
}

export function serializeSelection(ids: string[]): string {
  return [...ids].sort().join(",");
}

export function parseSelection(value: string | null | undefined): string[] {
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

export function selectionsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((id, index) => id === right[index]);
}

export function isAnswerCorrect(question: Question, selected: string[]): boolean {
  return selectionsEqual(selected, getCorrectAnswers(question));
}

export function formatAnswerLabels(question: Question): string {
  return getCorrectAnswers(question)
    .map((id) => id.toUpperCase())
    .join(", ");
}

export function isPlayableQuestion(question: Question): boolean {
  if (question.options.length < 2) return false;
  if (question.options.some((opt) => !opt.text.trim())) return false;
  if (!hasKnownAnswer(question)) return false;
  return !question.options.some((opt) => /\b[e-z]\)\s/i.test(opt.text));
}
