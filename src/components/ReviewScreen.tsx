import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  ListChecks,
  MinusCircle,
  Play,
  Target,
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

  useEffect(() => {
    setSelectedId((prev) => {
      if (prev && sessions.some((s) => s.id === prev)) return prev;
      return sessions.find(sessionHasReviewData)?.id ?? sessions[0]?.id ?? null;
    });
  }, [sessions]);

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
          Tap a past session to see your answers, then practice anything you missed.
        </p>
      </header>

      {sessions.length === 0 ? (
        <div className="panel review-empty-state">
          <Icon icon={ListChecks} size="lg" className="review-empty-icon" />
          <h2 className="type-title-md">No sessions yet</h2>
          <p className="type-body-md">
            Finish a practice or exam session on the Home tab — your answers will
            show up here so you can review them.
          </p>
        </div>
      ) : (
        <>
          <section className="review-step">
            <h2 className="review-step-label type-label-sm">
              <span className="review-step-num">1</span>
              Choose a session
            </h2>
            <div className="review-session-scroll" role="list">
              {sessions.map((session) => (
                <SessionChip
                  key={session.id}
                  session={session}
                  isSelected={session.id === selectedId}
                  isBest={session.id === bestSessionId}
                  onSelect={() => setSelectedId(session.id)}
                />
              ))}
            </div>
          </section>

          {selected ? (
            <>
              <section className="review-step">
                <h2 className="review-step-label type-label-sm">
                  <span className="review-step-num">2</span>
                  Session overview
                </h2>
                <SessionSummary
                  session={selected}
                  isBest={selected.id === bestSessionId}
                  wrongCount={wrongIds.length}
                  onPracticeWrong={
                    wrongIds.length > 0
                      ? () => onPracticeQuestions(wrongIds)
                      : undefined
                  }
                />
              </section>

              {canReview ? (
                <section className="review-step">
                  <h2 className="review-step-label type-label-sm">
                    <span className="review-step-num">3</span>
                    Question breakdown
                  </h2>
                  <SessionReview
                    items={reviewItems}
                    defaultFilter={wrongIds.length > 0 ? "wrong" : "all"}
                    showTitle={false}
                  />
                </section>
              ) : (
                <div className="callout review-no-data type-body-md">
                  <Icon icon={CircleHelp} size="sm" className="inline-icon" />
                  This session was completed before answer saving was added, so
                  individual questions aren&apos;t available. Complete a new session to
                  review answers here.
                </div>
              )}
            </>
          ) : (
            <div className="panel review-hint type-body-md">
              <Icon icon={ClipboardList} size="sm" className="inline-icon" />
              Select a session above to see how you did.
            </div>
          )}
        </>
      )}

      <div className="bottom-nav-spacer" aria-hidden />
    </div>
  );
}

function SessionChip({
  session,
  isSelected,
  isBest,
  onSelect,
}: {
  session: SessionRecord;
  isSelected: boolean;
  isBest: boolean;
  onSelect: () => void;
}) {
  const tier = scoreTier(session.scorePercent);
  const hasData = sessionHasReviewData(session);
  const mode = session.settings.mode === "exam" ? "Exam" : "Practice";

  return (
    <button
      type="button"
      role="listitem"
      className={`review-session-chip ${tier} ${isSelected ? "on" : ""}`}
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      <span className="review-session-chip-score">{session.scorePercent}%</span>
      <span className="review-session-chip-date">
        {formatSessionLabel(session.completedAt)}
      </span>
      <span className="review-session-chip-meta type-label-sm">
        {mode}
        {!hasData && " · Limited"}
      </span>
      {isBest && (
        <span className="review-session-chip-best" aria-label="Best score">
          <Icon icon={Trophy} size="xs" />
        </span>
      )}
    </button>
  );
}

function SessionSummary({
  session,
  isBest,
  wrongCount,
  onPracticeWrong,
}: {
  session: SessionRecord;
  isBest: boolean;
  wrongCount: number;
  onPracticeWrong?: () => void;
}) {
  const tier = scoreTier(session.scorePercent);
  const mode = session.settings.mode === "exam" ? "Exam mode" : "Practice mode";
  const date = formatSessionDate(session.completedAt);

  return (
    <div className="panel review-summary">
      <div className="review-summary-head">
        <div className={`review-summary-score ${tier}`}>{session.scorePercent}%</div>
        <div className="review-summary-copy">
          <p className="review-summary-title type-title-md">{date}</p>
          <p className="review-summary-meta type-body-md">
            {mode} · {session.questionIds.length} questions
          </p>
        </div>
        {isBest && (
          <span className="best-tag type-label-sm">
            <Icon icon={Trophy} size="xs" />
            Best
          </span>
        )}
      </div>

      <div className="stat-strip review-summary-stats">
        <SummaryStat
          icon={CheckCircle2}
          label="Correct"
          value={session.correct}
          variant="success"
        />
        <SummaryStat
          icon={Target}
          label="Wrong"
          value={session.incorrect}
          variant={session.incorrect > 0 ? "warn" : undefined}
        />
        <SummaryStat icon={MinusCircle} label="Skipped" value={session.skipped} />
      </div>

      {onPracticeWrong ? (
        <button type="button" className="btn btn-primary full" onClick={onPracticeWrong}>
          <Icon icon={Play} size="sm" fill="currentColor" />
          <span>Practice wrong answers</span>
          <small>{wrongCount} Qs</small>
        </button>
      ) : (
        <p className="review-summary-note type-body-md">
          <Icon icon={BookOpen} size="sm" className="inline-icon" />
          No wrong answers in this session — nice work.
        </p>
      )}
    </div>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  variant,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  variant?: "success" | "warn";
}) {
  return (
    <div className={`stat-pill ${variant ?? ""}`}>
      <Icon icon={icon} size="sm" className="stat-pill-icon" />
      <span className="stat-pill-value">{value}</span>
      <span className="stat-pill-label type-label-sm">{label}</span>
    </div>
  );
}

function scoreTier(pct: number): "good" | "mid" | "low" {
  if (pct >= 75) return "good";
  if (pct >= 50) return "mid";
  return "low";
}

function formatSessionLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000,
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatSessionDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
