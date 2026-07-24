import { useCallback, useMemo, useState, type ReactNode } from "react";
import { BottomNav } from "./components/BottomNav";
import { HomeScreen } from "./components/HomeScreen";
import { InstallBanner } from "./components/InstallBanner";
import { QuizScreen, useAutoAdvance } from "./components/QuizScreen";
import { SessionResults } from "./components/SessionResults";
import type { ReviewItem } from "./components/SessionReview";
import { SettingsForm } from "./components/SettingsForm";
import { StatsScreen } from "./components/StatsScreen";
import { UpdatePrompt } from "./components/UpdatePrompt";
import questionBank from "./data/questions.json";
import { useProgress } from "./hooks/useProgress";
import { useSessions } from "./hooks/useSessions";
import { useSettings } from "./hooks/useSettings";
import { buildSessionOrder, filterQuestions, sessionId } from "./lib/quizEngine";
import type {
  ActiveSession,
  Question,
  Screen,
  SessionRecord,
  Tab,
} from "./types";
import { sessionScorePercent } from "./types";
import "./App.css";

const ALL_QUESTIONS = (questionBank.questions as Question[]).filter(
  (q) => q.id >= 1 && q.options.length >= 2,
);

function App() {
  const { settings, updateSettings } = useSettings();
  const { progress, recordAnswer, resetProgress, answered, correct, wrong } =
    useProgress();
  const {
    history,
    userStats,
    snapshot,
    activeSession,
    startSession,
    updateActiveSession,
    completeSession,
    discardActiveSession,
    clearHistory,
  } = useSessions();

  const [screen, setScreen] = useState<Screen>("home");
  const [lastResult, setLastResult] = useState<SessionRecord | null>(null);
  const [lastReviewItems, setLastReviewItems] = useState<ReviewItem[]>([]);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [previousSessionScore, setPreviousSessionScore] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const questionMap = useMemo(
    () => new Map(ALL_QUESTIONS.map((q) => [q.id, q])),
    [],
  );

  const pool = useMemo(
    () => filterQuestions(ALL_QUESTIONS, progress, settings.questionFilter),
    [progress, settings.questionFilter],
  );

  const poolSize = pool.length;
  const session = activeSession;
  const currentId = session?.questionIds[session.currentIndex];
  const current = currentId != null ? questionMap.get(currentId) : undefined;

  const sessionAnswers = session?.sessionAnswers ?? {};
  const sessionCorrect = Object.values(sessionAnswers).filter((a) => a.correct).length;
  const sessionAnswered = Object.keys(sessionAnswers).length;

  const loadQuestionState = useCallback(
    (qid: number, sessionMode = session?.settings.mode ?? "practice") => {
      const ans = session?.sessionAnswers[qid];
      setSelected(ans?.selected ?? null);
      setRevealed(sessionMode === "practice" && ans != null);
    },
    [session?.sessionAnswers, session?.settings.mode],
  );

  const beginSession = useCallback(
    (resume = false) => {
      if (resume && activeSession) {
        loadQuestionState(activeSession.questionIds[activeSession.currentIndex]);
        setScreen("quiz");
        return;
      }

      const ids = buildSessionOrder(ALL_QUESTIONS, progress, settings);
      if (ids.length === 0) return;

      const newSession: ActiveSession = {
        id: sessionId(),
        startedAt: new Date().toISOString(),
        questionIds: ids,
        settings: { ...settings },
        currentIndex: 0,
        sessionAnswers: {},
      };
      startSession(newSession);
      setSelected(null);
      setRevealed(false);
      setScreen("quiz");
    },
    [activeSession, progress, settings, startSession, loadQuestionState],
  );

  const goToIndex = useCallback(
    (idx: number) => {
      if (!session) return;
      const clamped = Math.max(0, Math.min(idx, session.questionIds.length - 1));
      updateActiveSession({ currentIndex: clamped });
      loadQuestionState(session.questionIds[clamped]);
    },
    [session, updateActiveSession, loadQuestionState],
  );

  const buildReviewItems = useCallback(
    (
      questionIds: number[],
      answers: Record<number, { selected: string; correct: boolean }>,
    ): ReviewItem[] => {
      const items: ReviewItem[] = [];
      for (const qid of questionIds) {
        const question = questionMap.get(qid);
        if (!question) continue;
        const ans = answers[qid];
        items.push({
          question,
          selected: ans?.selected ?? null,
          correct: ans != null ? ans.correct : null,
        });
      }
      return items;
    },
    [questionMap],
  );

  const finishSession = useCallback(() => {
    if (!session) return;

    const answers = session.sessionAnswers;
    let correctN = 0;
    let incorrectN = 0;
    let skippedN = 0;

    for (const qid of session.questionIds) {
      const a = answers[qid];
      if (!a) skippedN++;
      else if (a.correct) correctN++;
      else incorrectN++;
    }

    if (session.settings.mode === "exam" && skippedN > 0) {
      const ok = confirm(
        `You have ${skippedN} unanswered question${skippedN > 1 ? "s" : ""}. Submit anyway?`,
      );
      if (!ok) return;
    }

    const completedAt = new Date().toISOString();
    const durationMs = Math.max(
      0,
      new Date(completedAt).getTime() - new Date(session.startedAt).getTime(),
    );

    const partial = { correct: correctN, incorrect: incorrectN, skipped: skippedN };
    const record: SessionRecord = {
      id: session.id,
      startedAt: session.startedAt,
      completedAt,
      questionIds: session.questionIds,
      ...partial,
      scorePercent: sessionScorePercent(partial),
      durationMs,
      settings: session.settings,
    };

    const prevBest = userStats.bestScore?.scorePercent ?? -1;
    const answeredCount = correctN + incorrectN;
    setPreviousSessionScore(userStats.lastSessionScore);
    setIsNewHighScore(
      answeredCount > 0 &&
        (userStats.bestScore == null || record.scorePercent > prevBest),
    );

    setLastReviewItems(buildReviewItems(session.questionIds, answers));
    completeSession(record, answers);
    setLastResult(record);
    setScreen("results");
  }, [session, completeSession, userStats, buildReviewItems]);

  const handleCheck = useCallback(() => {
    if (!current || !selected || !session || !current.answer) return;
    const isCorrect = selected === current.answer;
    const isExam = session.settings.mode === "exam";

    recordAnswer(current.id, selected, isCorrect);
    updateActiveSession({
      sessionAnswers: {
        ...session.sessionAnswers,
        [current.id]: { selected, correct: isCorrect },
      },
    });

    if (isExam) {
      if (session.currentIndex >= session.questionIds.length - 1) {
        finishSession();
      } else {
        goToIndex(session.currentIndex + 1);
      }
    } else {
      setRevealed(true);
    }
  }, [current, selected, session, recordAnswer, updateActiveSession, finishSession, goToIndex]);

  const handleNext = useCallback(() => {
    if (!session) return;
    if (session.currentIndex >= session.questionIds.length - 1) {
      finishSession();
      return;
    }
    goToIndex(session.currentIndex + 1);
  }, [session, finishSession, goToIndex]);

  const handlePrev = useCallback(() => {
    if (!session) return;
    goToIndex(session.currentIndex - 1);
  }, [session, goToIndex]);

  const handleJump = useCallback(
    (num: number) => {
      if (!session) return;
      const idx = session.questionIds.indexOf(num);
      if (idx >= 0) goToIndex(idx);
    },
    [session, goToIndex],
  );

  const handleExit = useCallback(() => {
    setScreen("home");
  }, []);

  const handleTabChange = useCallback((tab: Tab) => {
    setScreen(tab === "stats" ? "stats" : "home");
  }, []);

  useAutoAdvance(
    session?.settings.mode !== "exam" && settings.autoAdvance,
    settings.autoAdvanceDelayMs,
    revealed,
    handleNext,
    session ? session.currentIndex >= session.questionIds.length - 1 : true,
  );

  const activeTab: Tab = screen === "stats" ? "stats" : "practice";

  if (screen === "results" && lastResult) {
    return (
      <AppShell showNav={false}>
        <SessionResults
          record={lastResult}
          reviewItems={lastReviewItems}
          isNewHighScore={isNewHighScore}
          previousScore={previousSessionScore}
          improvementDelta={snapshot.improvementDelta}
          onHome={() => setScreen("home")}
          onStats={() => setScreen("stats")}
          onRetry={() => {
            setLastResult(null);
            beginSession(false);
          }}
        />
      </AppShell>
    );
  }

  if (screen === "quiz" && session && current) {
    return (
      <AppShell showNav={false}>
        <QuizScreen
          mode={session.settings.mode ?? "practice"}
          question={current}
          index={session.currentIndex}
          total={session.questionIds.length}
          sessionCorrect={sessionCorrect}
          sessionAnswered={sessionAnswered}
          shuffleOptions={session.settings.shuffleOptions}
          selected={selected}
          revealed={revealed}
          onSelect={setSelected}
          onCheck={handleCheck}
          onNext={handleNext}
          onPrev={handlePrev}
          onExit={handleExit}
          onJump={handleJump}
        />
      </AppShell>
    );
  }

  if (screen === "stats") {
    return (
      <AppShell showNav={true} activeTab={activeTab} onTabChange={handleTabChange}>
        <StatsScreen
          snapshot={snapshot}
          totalQuestions={ALL_QUESTIONS.length}
          answered={answered}
          correct={correct}
          onClearHistory={() => {
            if (confirm("Clear all session history and stats?")) clearHistory();
          }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell showNav={true} activeTab={activeTab} onTabChange={handleTabChange}>
      <HomeScreen
        totalQuestions={ALL_QUESTIONS.length}
        answered={answered}
        correct={correct}
        wrong={wrong}
        poolSize={poolSize}
        history={history.slice(0, 3)}
        bestScore={userStats.bestScore}
        averageLast5={snapshot.averageLast5}
        hasActiveSession={activeSession != null}
        onStart={() => beginSession(false)}
        onResume={() => beginSession(true)}
        onViewStats={() => setScreen("stats")}
        onResetProgress={() => {
          if (confirm("Reset question progress? Session stats are kept.")) {
            resetProgress();
            discardActiveSession();
          }
        }}
        settingsPanel={
          <SettingsForm
            settings={settings}
            totalQuestions={ALL_QUESTIONS.length}
            onChange={updateSettings}
          />
        }
      />
    </AppShell>
  );
}

function AppShell({
  children,
  showNav,
  activeTab = "practice",
  onTabChange,
}: {
  children: ReactNode;
  showNav: boolean;
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
}) {
  return (
    <div className="pwa-app">
      <InstallBanner />
      <UpdatePrompt />
      <main className="pwa-main">{children}</main>
      {showNav && onTabChange && (
        <BottomNav active={activeTab} onChange={onTabChange} />
      )}
    </div>
  );
}

export default App;
