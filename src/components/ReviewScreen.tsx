import { useMemo, useState } from "react";
import {
  ChevronRight,
  ClipboardList,
  ListChecks,
  Play,
  Trophy,
} from "lucide-react";
import { Icon } from "./Icon";
import { SessionReview } from "./SessionReview";
import {
  buildSessionReviewItems,
  sessionHasReviewData,
  sessionWrongQuestionIds,
} from "../lib/reviewUtils";
import type { Question, SessionRecord } from "../types";

interface ReviewScreenProps {
  sessions: SessionRecord[];
  bestSessionId: string | null;
  getQuestion: (id: number) => Question | undefined;
  onPracticeQuestions: (questionIds: number[]) => void;
}

export function ReviewScreen({
  sessions,
  bestSessionId,
  getQuestion,
  onPracticeQuestions,
}: ReviewScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    sessions.find(sessionHasReviewData)?.id ?? sessions[0]?.id ?? null,
  );

  const selected = sessions.find((s) => s.id === selectedId);
  const reviewItems = useMemo(
    () => (selected ? buildSessionReviewItems(selected, getQuestion) : []),
    [selected, getQuestion],
  );
  const wrongIds = selected ? sessionWrongQuestionIds(selected) : [];
  const canReview = selected != null && sessionHasReviewData(selected);

  return (
    <div className="screen review-screen">
      <div className="ambient ambient-a" aria-hidden />
      <div className="ambient ambient-b" aria-hidden />

      <header className="review-header">
        <h1 className="type-display-sm">Review</h1>
        <p className="type-body-md review-lead">
          Pick a session to see what you got right, wrong, or skipped
        </p>
      </header>

      {sessions.length === 0 ? (
        <div className="panel review-empty-state">
          <Icon icon={ListChecks} size="lg" className="review-empty-icon" />
          <h2 className="type-title-md">No sessions yet</h2>
          <p className="type-body-md">
            Complete a practice or exam session — you&apos;ll be able to review every
            answer here afterward.
          </p>
        </div>
      ) : (
        <>
          <section className="panel review-sessions-panel">
            <h2 className="panel-title type-title-md">
              <Icon icon={ClipboardList} size="sm" className="inline-icon" />
              Past sessions
            </h2>
            <ul className="review-session-list">
              {sessions.map((session) => {
                const isSelected = session.id === selectedId;
                const isBest = session.id === bestSessionId;
                const hasData = sessionHasReviewData(session);
                const wrongN = session.incorrect;
                const date = new Date(session.completedAt);

                return (
                  <li key={session.id}>
                    <button
                      type="button"
                      className={`review-session-row ${isSelected ? "on" : ""}`}
                      onClick={() => setSelectedId(session.id)}
                    >
                      <span className="review-session-score">{session.scorePercent}%</span>
                      <span className="review-session-body">
                        <span className="type-body-md">
                          {session.correct}/{session.questionIds.length} correct
                          {wrongN > 0 && ` · ${wrongN} wrong`}
                          {session.skipped > 0 && ` · ${session.skipped} skipped`}
                        </span>
                        <span className="review-session-meta type-label-sm">
                          {date.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {session.settings.mode === "exam" ? " · Exam" : " · Practice"}
                          {!hasData && " · No saved answers"}
                        </span>
                      </span>
                      {isBest && (
                        <span className="best-tag type-label-sm">
                          <Icon icon={Trophy} size="xs" />
                          Best
                        </span>
                      )}
                      <Icon icon={ChevronRight} size="sm" className="review-session-chevron" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {selected && (
            canReview ? (
              <>
                {wrongIds.length > 0 && (
                  <div className="review-actions">
                    <button
                      type="button"
                      className="btn btn-primary full"
                      onClick={() => onPracticeQuestions(wrongIds)}
                    >
                      <Icon icon={Play} size="sm" fill="currentColor" />
                      <span>Practice wrong from this session</span>
                      <small>{wrongIds.length} Qs</small>
                    </button>
                  </div>
                )}

                <SessionReview
                  items={reviewItems}
                  defaultFilter={wrongIds.length > 0 ? "wrong" : "all"}
                  title={`Session · ${formatSessionDate(selected.completedAt)}`}
                />
              </>
            ) : (
              <div className="callout type-body-md">
                Answer details aren&apos;t saved for this session. Complete a new session
                to review individual questions here.
              </div>
            )
          )}
        </>
      )}

      <div className="bottom-nav-spacer" aria-hidden />
    </div>
  );
}

function formatSessionDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
