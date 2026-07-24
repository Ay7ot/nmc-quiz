import type { Question } from "../types";

/** PDF formula working lines that leaked into question/option text. */
const FORMULA_PATTERN =
  /\)\s*%\s*<|I##|ℎ"|\/#\$|#\$\-|[\]\\^_=`]|!\s*["']|^\s*[iI]\)\s|\d+\s*\)\s*%\s*</;

export function isFormulaArtifact(text: string): boolean {
  if (FORMULA_PATTERN.test(text)) return true;
  const words = text.match(/[a-zA-Z]{4,}/g) ?? [];
  const symbols = (text.match(/[^a-zA-Z0-9\s.,?!;'"/\-()%]/g) ?? []).length;
  return words.length <= 1 && symbols >= 3;
}

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
  if (question.id < 1) return false;
  if (question.options.length < 2) return false;
  if (question.options.some((opt) => !opt.text.trim())) return false;
  if (!hasKnownAnswer(question)) return false;
  if (isFormulaArtifact(question.question)) return false;
  if (question.options.some((opt) => isFormulaArtifact(opt.text))) return false;
  return !question.options.some((opt) => /\b[e-z]\)\s/i.test(opt.text));
}

export function commitSelection(
  answers: Record<number, { selected: string; correct: boolean }>,
  question: Question,
  selected: string[],
): Record<number, { selected: string; correct: boolean }> {
  if (selected.length === 0 || !hasKnownAnswer(question)) return answers;
  const selectedStr = serializeSelection(selected);
  if (answers[question.id]?.selected === selectedStr) return answers;
  return {
    ...answers,
    [question.id]: {
      selected: selectedStr,
      correct: isAnswerCorrect(question, selected),
    },
  };
}
