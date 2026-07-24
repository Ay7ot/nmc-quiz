import { BarChart3, Home, RefreshCw, Sparkles, Trophy, TrendingUp } from "lucide-react";
import { Icon } from "./Icon";
import { SessionReview, type ReviewItem } from "./SessionReview";
import type { QuizMode, SessionRecord } from "../types";

interface SessionResultsProps {
  record: SessionRecord;
  reviewItems: ReviewItem[];
  isNewHighScore: boolean;
  previousScore: number | null;
  improvementDelta: number | null;
  onHome: () => void;
  onStats: () => void;
  onRetry: () => void;
}

export function SessionResults({
  record,
  reviewItems,
  isNewHighScore,
  previousScore,
  improvementDelta,
  onHome,
  onStats,
  onRetry,
}: SessionResultsProps) {
  const total = record.questionIds.length;
  const pct = record.scorePercent;
  const mode: QuizMode = record.settings.mode ?? "practice";
  const isExam = mode === "exam";
  const duration = Math.round(record.durationMs / 1000);
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  const vsLast =
    previousScore != null && previousScore !== pct
      ? pct - previousScore
      : null;

  let message = isExam ? "Test complete" : "Keep practising";
  let sub = isExam
    ? "Review your answers below."
    : "Every session gets you closer.";
  const answered = record.correct + record.incorrect;

  if (record.skipped > 0) {
    sub = `${answered} of ${total} answered · ${record.skipped} unanswered. Score is based on all ${total} questions.`;
  }

  if (pct >= 90 && record.skipped === 0) {
    message = "Brilliant work";
    sub = isExam ? "Outstanding score — review any slips below." : "You're exam-ready on this set.";
  } else if (pct >= 75 && record.skipped === 0) {
    message = "Strong session";
    sub = "Solid grasp — review the ones you missed.";
  } else if (pct >= 50 && record.skipped === 0) {
    message = "Good effort";
    sub = "Focus on the review pool next time.";
  }

  const tier = pct >= 75 ? "good" : pct >= 50 ? "mid" : "low";
  const showReview = reviewItems.length > 0 && (isExam || record.incorrect > 0);

  return (
    <div className="screen results-screen results-scroll">
      <div className="ambient ambient-a" aria-hidden />
      <div className="ambient ambient-b" aria-hidden />

      {isNewHighScore && (
        <div className="new-high-banner">
          <Icon icon={Sparkles} size="sm" />
          <span>New personal best!</span>
          <Icon icon={Trophy} size="sm" />
        </div>
      )}

      {isExam && (
        <div className="mode-result-badge type-label-sm">Exam mode</div>
      )}

      <div className="results-hero">
        <div className={`score-display ${tier}`}>
          <svg viewBox="0 0 120 120" className="score-arc" aria-hidden>
            <circle className="score-arc-bg" cx="60" cy="60" r="52" />
            <circle
              className="score-arc-fill"
              cx="60"
              cy="60"
              r="52"
              style={{ strokeDasharray: `${(pct / 100) * 327} 327` }}
            />
          </svg>
          <div className="score-inner">
            <div className="score-nums">
              <span className="score-num">{pct}</span>
              <span className="score-pct">%</span>
            </div>
          </div>
        </div>

        <h1 className="results-heading type-display-sm">{message}</h1>
        <p className="results-lead type-body-lg">{sub}</p>
        <p className="results-time type-label-sm">
          {mins > 0 ? `${mins}m ` : ""}
          {secs}s · {total} questions
        </p>

        {(vsLast != null || improvementDelta != null) && (
          <div className="results-deltas">
            {vsLast != null && vsLast !== 0 && (
              <span className={`delta-chip ${vsLast > 0 ? "up" : "down"}`}>
                <Icon icon={TrendingUp} size="xs" />
                {vsLast > 0 ? "+" : ""}
                {vsLast}% vs last
              </span>
            )}
            {improvementDelta != null && improvementDelta !== 0 && (
              <span className="delta-chip neutral type-body-md">
                5-session trend: {improvementDelta > 0 ? "+" : ""}
                {improvementDelta}%
              </span>
            )}
          </div>
        )}
      </div>

      <div className="results-grid">
        <div className="results-stat is-green">
          <span className="results-stat-n">{record.correct}</span>
          <span className="results-stat-l type-label-sm">Correct</span>
        </div>
        <div className="results-stat is-red">
          <span className="results-stat-n">{record.incorrect}</span>
          <span className="results-stat-l type-label-sm">Wrong</span>
        </div>
        <div className="results-stat is-neutral">
          <span className="results-stat-n">{record.skipped}</span>
          <span className="results-stat-l type-label-sm">Unanswered</span>
        </div>
      </div>

      {showReview && (
        <SessionReview
          items={reviewItems}
          defaultFilter={isExam ? "all" : "wrong"}
        />
      )}

      <div className="results-actions">
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          <Icon icon={RefreshCw} size="sm" />
          {isExam ? "Take again" : "Practice again"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onStats}>
          <Icon icon={BarChart3} size="sm" />
          View progress
        </button>
        <button type="button" className="btn btn-ghost" onClick={onHome}>
          <Icon icon={Home} size="sm" />
          Back home
        </button>
      </div>
    </div>
  );
}
