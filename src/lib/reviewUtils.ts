import type { ReviewItem } from "../components/SessionReview";
import type { Question, SessionRecord } from "../types";

export function buildSessionReviewItems(
  session: SessionRecord,
  getQuestion: (id: number) => Question | undefined,
): ReviewItem[] {
  const items: ReviewItem[] = [];
  for (const qid of session.questionIds) {
    const question = getQuestion(qid);
    if (!question) continue;
    const ans = session.answers?.[qid];
    items.push({
      question,
      selected: ans?.selected ?? null,
      correct: ans != null ? ans.correct : null,
    });
  }
  return items;
}

export function sessionWrongQuestionIds(session: SessionRecord): number[] {
  if (!session.answers) return [];
  return session.questionIds.filter((qid) => session.answers?.[qid]?.correct === false);
}

export function sessionHasReviewData(session: SessionRecord): boolean {
  return session.answers != null && Object.keys(session.answers).length > 0;
}
