import type { CSSProperties, ReactNode } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Play,
  RotateCcw,
  Stethoscope,
  Target,
  Trophy,
} from "lucide-react";
import { Icon } from "./Icon";
import type { HighScoreEntry, SessionRecord } from "../types";

interface HomeScreenProps {
  totalQuestions: number;
  answered: number;
  correct: number;
  wrong: number;
  poolSize: number;
  history: SessionRecord[];
  bestScore: HighScoreEntry | null;
  averageLast5: number | null;
  hasActiveSession: boolean;
  onStart: () => void;
  onResume: () => void;
  onViewStats: () => void;
  onResetProgress: () => void;
  settingsPanel: ReactNode;
}

export function HomeScreen({
  totalQuestions,
  answered,
  correct,
  wrong,
  poolSize,
  history,
  bestScore,
  averageLast5,
  hasActiveSession,
  onStart,
  onResume,
  onViewStats,
  onResetProgress,
  settingsPanel,
}: HomeScreenProps) {
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  const progressPct = totalQuestions
    ? Math.round((answered / totalQuestions) * 100)
    : 0;

  return (
    <div className="screen home-screen">
      <div className="ambient ambient-a" aria-hidden />
      <div className="ambient ambient-b" aria-hidden />

      <header className="hero-card">
        <div className="hero-top">
          <div className="hero-brand">
            <div className="hero-logo">
              <Icon icon={Stethoscope} size="md" strokeWidth={2.25} />
            </div>
            <span className="eyebrow">NMC · CBT Exam</span>
          </div>
          <div className="hero-ring" style={{ "--pct": `${accuracy}%` } as CSSProperties}>
            <svg viewBox="0 0 36 36" className="ring-svg" aria-hidden>
              <path
                className="ring-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="ring-fill"
                strokeDasharray={`${accuracy}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="ring-label">{accuracy}%</span>
          </div>
        </div>
        <h1 className="hero-title type-display-sm">Practice Quiz</h1>
        <p className="hero-sub type-body-md">
          <Icon icon={BookOpen} size="sm" className="inline-icon" />
          {totalQuestions.toLocaleString()} questions ·{" "}
          <strong>{progressPct}%</strong> covered
        </p>
      </header>

      {(bestScore || averageLast5 != null) && (
        <button type="button" className="panel score-teaser" onClick={onViewStats}>
          <Icon icon={Trophy} size="md" className="score-teaser-icon" />
          <div className="score-teaser-body">
            <span className="type-label-sm">High score</span>
            <span className="score-teaser-value">
              {bestScore ? `${bestScore.scorePercent}%` : "—"}
            </span>
            {averageLast5 != null && (
              <span className="type-body-md">Recent avg · {averageLast5}%</span>
            )}
          </div>
          <Icon icon={ChevronRight} size="sm" className="score-teaser-chevron" />
        </button>
      )}

      <div className="stat-strip">
        <StatPill icon={BookOpen} label="Answered" value={answered} />
        <StatPill icon={CheckCircle2} label="Correct" value={correct} variant="success" />
        <StatPill icon={Target} label="Review" value={wrong} variant="warn" />
      </div>

      {poolSize === 0 && (
        <div className="callout callout-warn type-body-md">
          No questions match this filter — try &ldquo;All questions&rdquo;.
        </div>
      )}

      {settingsPanel}

      {history.length > 0 && (
        <section className="panel history-panel">
          <div className="panel-head">
            <h2 className="panel-title type-title-md">Latest scores</h2>
            <button type="button" className="text-btn" onClick={onViewStats}>
              See all
              <Icon icon={ChevronRight} size="xs" />
            </button>
          </div>
          <ul className="timeline">
            {history.map((s) => {
              const pct = s.scorePercent;
              const date = new Date(s.completedAt);
              return (
                <li key={s.id} className="timeline-item">
                  <div className={`timeline-dot ${pct >= 75 ? "good" : pct >= 50 ? "mid" : "low"}`} />
                  <div className="timeline-body">
                    <span className="timeline-score">{pct}%</span>
                    <span className="timeline-desc type-body-md">
                      {s.correct}/{s.questionIds.length} ·{" "}
                      {date.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {answered > 0 && (
        <button type="button" className="text-btn text-btn-danger" onClick={onResetProgress}>
          Reset question progress
        </button>
      )}

      <div className="home-actions">
        {hasActiveSession && (
          <button type="button" className="btn btn-ghost full" onClick={onResume}>
            <Icon icon={RotateCcw} size="sm" />
            Resume session
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary full"
          onClick={onStart}
          disabled={poolSize === 0}
        >
          <Icon icon={Play} size="sm" fill="currentColor" />
          <span>{hasActiveSession ? "New session" : "Begin session"}</span>
          {poolSize > 0 && (
            <small>{Math.min(poolSize, totalQuestions)} Qs</small>
          )}
        </button>
      </div>

      <div className="bottom-nav-spacer" aria-hidden />
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
  variant,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number | string;
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
