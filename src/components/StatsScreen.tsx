import {
  Award,
  Calendar,
  Clock,
  Flame,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { Icon } from "./Icon";
import type { StatsSnapshot } from "../hooks/useSessions";
import type { SessionRecord } from "../types";

interface StatsScreenProps {
  snapshot: StatsSnapshot;
  totalQuestions: number;
  answered: number;
  correct: number;
  onClearHistory: () => void;
}

export function StatsScreen({
  snapshot,
  totalQuestions,
  answered,
  correct,
  onClearHistory,
}: StatsScreenProps) {
  const { userStats, recentSessions, chartSessions } = snapshot;
  const masteryPct = totalQuestions
    ? Math.round((answered / totalQuestions) * 100)
    : 0;
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;

  const studyHours = Math.floor(userStats.totalStudyTimeMs / 3600000);
  const studyMins = Math.floor(
    (userStats.totalStudyTimeMs % 3600000) / 60000,
  );

  return (
    <div className="screen stats-screen">
      <div className="ambient ambient-a" aria-hidden />
      <div className="ambient ambient-b" aria-hidden />

      <header className="stats-header">
        <h1 className="type-display-sm">Your Progress</h1>
        <p className="type-body-md stats-lead">All stored on this device</p>
      </header>

      {/* High score hero */}
      <section className="panel high-score-card">
        <div className="high-score-icon">
          <Icon icon={Trophy} size="xl" />
        </div>
        <div className="high-score-body">
          <span className="type-label-sm">Personal best</span>
          <span className="high-score-value">
            {userStats.bestScore ? `${userStats.bestScore.scorePercent}%` : "—"}
          </span>
          {userStats.bestScore && (
            <span className="type-body-md high-score-meta">
              {userStats.bestScore.correct}/{userStats.bestScore.questionCount} ·{" "}
              {formatDate(userStats.bestScore.date)}
            </span>
          )}
        </div>
        {snapshot.improvementDelta != null && (
          <div
            className={`improvement-badge ${snapshot.improvementDelta >= 0 ? "up" : "down"}`}
          >
            <Icon
              icon={snapshot.improvementDelta >= 0 ? TrendingUp : TrendingDown}
              size="sm"
            />
            {snapshot.improvementDelta >= 0 ? "+" : ""}
            {snapshot.improvementDelta}% vs prior 5
          </div>
        )}
      </section>

      {/* Key metrics */}
      <div className="metrics-grid">
        <MetricCard
          icon={Zap}
          label="Last score"
          value={userStats.lastSessionScore != null ? `${userStats.lastSessionScore}%` : "—"}
        />
        <MetricCard
          icon={Target}
          label="Avg (5 sessions)"
          value={snapshot.averageLast5 != null ? `${snapshot.averageLast5}%` : "—"}
        />
        <MetricCard
          icon={Flame}
          label="Best streak"
          value={String(userStats.bestStreak)}
        />
        <MetricCard
          icon={Award}
          label="Sessions"
          value={String(userStats.totalSessions)}
        />
      </div>

      {/* Mastery */}
      <section className="panel">
        <h2 className="panel-title type-title-md">Question bank mastery</h2>
        <div className="mastery-bar">
          <div className="mastery-fill" style={{ width: `${masteryPct}%` }} />
        </div>
        <div className="mastery-labels type-body-md">
          <span>{answered.toLocaleString()} / {totalQuestions.toLocaleString()} seen</span>
          <span>{accuracy}% accuracy</span>
        </div>
      </section>

      {/* Score chart */}
      {chartSessions.length > 1 && (
        <section className="panel">
          <h2 className="panel-title type-title-md">Recent scores</h2>
          <div className="score-chart" role="img" aria-label="Recent session scores">
            {chartSessions.map((pt, i) => (
              <div key={i} className="chart-col">
                <div
                  className={`chart-bar ${pt.score >= 75 ? "good" : pt.score >= 50 ? "mid" : "low"}`}
                  style={{ height: `${Math.max(pt.score, 4)}%` }}
                  title={`${pt.score}%`}
                />
                <span className="chart-label">{pt.score}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Weekly + totals */}
      <section className="panel stats-summary">
        <div className="summary-row">
          <Icon icon={Calendar} size="sm" />
          <span className="type-body-md">This week</span>
          <strong>
            {snapshot.weeklySessions} sessions
            {snapshot.weeklyAverage != null && ` · ${snapshot.weeklyAverage}% avg`}
          </strong>
        </div>
        <div className="summary-row">
          <Icon icon={Clock} size="sm" />
          <span className="type-body-md">Total study time</span>
          <strong>
            {studyHours > 0 ? `${studyHours}h ` : ""}
            {studyMins}m
          </strong>
        </div>
        <div className="summary-row">
          <Icon icon={Target} size="sm" />
          <span className="type-body-md">Questions answered</span>
          <strong>{userStats.totalQuestionsAnswered.toLocaleString()}</strong>
        </div>
      </section>

      {/* Best by session size */}
      {Object.keys(userStats.bestBySize).length > 0 && (
        <section className="panel">
          <h2 className="panel-title type-title-md">Best by session size</h2>
          <ul className="best-by-size">
            {Object.entries(userStats.bestBySize)
              .sort(([a], [b]) => Number(a === "all" ? 9999 : a) - Number(b === "all" ? 9999 : b))
              .map(([size, entry]) => (
                <li key={size} className="best-row">
                  <span className="best-size">{size === "all" ? "All" : `${size} Qs`}</span>
                  <span className="best-pct">{entry.scorePercent}%</span>
                  <span className="best-date type-body-md">{formatDate(entry.date)}</span>
                </li>
              ))}
          </ul>
        </section>
      )}

      {/* Full history */}
      {recentSessions.length > 0 && (
        <section className="panel history-panel">
          <h2 className="panel-title type-title-md">All test scores</h2>
          <ul className="score-history">
            {recentSessions.map((s) => (
              <SessionRow key={s.id} session={s} isBest={s.id === userStats.bestScore?.sessionId} />
            ))}
          </ul>
          <button type="button" className="text-btn text-btn-danger" onClick={onClearHistory}>
            Clear all history & stats
          </button>
        </section>
      )}

      {recentSessions.length === 0 && (
        <div className="empty-stats type-body-md">
          Complete a practice session to start tracking scores and improvements.
        </div>
      )}

      <div className="bottom-nav-spacer" aria-hidden />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
}) {
  return (
    <div className="metric-card">
      <Icon icon={icon} size="sm" className="metric-icon" />
      <span className="metric-value">{value}</span>
      <span className="metric-label type-label-sm">{label}</span>
    </div>
  );
}

function SessionRow({
  session,
  isBest,
}: {
  session: SessionRecord;
  isBest: boolean;
}) {
  const total = session.questionIds.length;
  const duration = Math.round(session.durationMs / 1000);
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  return (
    <li className={`score-row ${isBest ? "is-best" : ""}`}>
      <div className="score-row-main">
        <span className="score-row-pct">{session.scorePercent}%</span>
        <div className="score-row-detail">
          <span className="type-body-md">
            {session.correct}/{total} correct
            {session.incorrect > 0 && ` · ${session.incorrect} wrong`}
          </span>
          <span className="score-row-meta type-label-sm">
            {formatDateTime(session.completedAt)}
            {mins > 0 ? ` · ${mins}m ${secs}s` : ` · ${secs}s`}
            {session.settings.randomize && " · random"}
          </span>
        </div>
      </div>
      {isBest && (
        <span className="best-tag type-label-sm">
          <Icon icon={Trophy} size="xs" />
          Best
        </span>
      )}
    </li>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
