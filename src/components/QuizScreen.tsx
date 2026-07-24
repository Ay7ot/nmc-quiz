import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Hash,
  Send,
  SkipForward,
  Trophy,
  X,
} from "lucide-react";
import { shuffleArray } from "../lib/quizEngine";
import {
  formatAnswerLabels,
  getCorrectAnswers,
  hasKnownAnswer,
  isAnswerCorrect,
  isMultiSelect,
} from "../lib/questionUtils";
import type { Question, QuizMode } from "../types";
import { Icon } from "./Icon";

interface QuizScreenProps {
  mode: QuizMode;
  question: Question;
  index: number;
  total: number;
  sessionCorrect: number;
  sessionAnswered: number;
  shuffleOptions: boolean;
  selected: string[];
  revealed: boolean;
  onSelect: (id: string) => void;
  onCheck: () => void;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
  onJump: (questionNum: number) => void;
}

export function QuizScreen({
  mode,
  question,
  index,
  total,
  sessionCorrect,
  sessionAnswered,
  shuffleOptions,
  selected,
  revealed,
  onSelect,
  onCheck,
  onNext,
  onPrev,
  onExit,
  onJump,
}: QuizScreenProps) {
  const [jumpValue, setJumpValue] = useState("");
  const isExam = mode === "exam";
  const multiSelect = isMultiSelect(question);
  const correctAnswers = getCorrectAnswers(question);

  const options = useMemo(() => {
    const opts = [...question.options];
    return shuffleOptions ? shuffleArray(opts) : opts;
  }, [question.id, question.options, shuffleOptions]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [question.id]);

  const isCorrect = !isExam && revealed && isAnswerCorrect(question, selected);
  const isLast = index >= total - 1;
  const progressPct = ((index + 1) / total) * 100;
  const showFeedback = !isExam && revealed;
  const canCheck = selected.length > 0 && hasKnownAnswer(question);

  return (
    <div className={`screen quiz-screen ${isExam ? "exam-mode" : "practice-mode"}`}>
      <div className="ambient ambient-a" aria-hidden />
      <div className="ambient ambient-c" aria-hidden />

      <header className="quiz-nav">
        <button type="button" className="nav-close" onClick={onExit} aria-label="Exit">
          <Icon icon={X} size="md" />
        </button>

        <div className="quiz-nav-mid">
          <div className="quiz-progress-label">
            <span className="quiz-step">{String(index + 1).padStart(2, "0")}</span>
            <span className="quiz-of type-body-md">/ {total}</span>
          </div>
          <div className="quiz-progress-track">
            <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {isExam ? (
          <div className="quiz-answered-chip type-label-sm">
            {sessionAnswered}/{total}
          </div>
        ) : (
          <div className="quiz-score-chip">
            <Icon icon={Trophy} size="xs" />
            <span className="quiz-score-num">{sessionCorrect}</span>
            <span className="quiz-score-div">/</span>
            <span className="quiz-score-den">{sessionAnswered}</span>
          </div>
        )}
      </header>

      {isExam && (
        <div className="exam-banner type-body-md">
          Exam mode — answers hidden until you submit
        </div>
      )}

      <main className="quiz-main">
        <div className="q-meta">
          <span className="q-badge type-label-sm">Question {question.id}</span>
          {multiSelect && (
            <span className="q-badge q-badge-multi type-label-sm">Select all that apply</span>
          )}
        </div>

        <h2 className="q-text type-headline-sm">{question.question}</h2>

        <div
          className="q-options"
          role={multiSelect ? "group" : "radiogroup"}
          aria-label="Answer options"
        >
          {options.map((opt, i) => {
            const isPicked = selected.includes(opt.id);
            const isRightAnswer = correctAnswers.includes(opt.id);
            let state = "";
            if (isPicked) state = "picked";
            if (showFeedback && isRightAnswer) state = "right";
            if (showFeedback && isPicked && !isRightAnswer) state = "wrong";

            return (
              <button
                key={opt.id}
                type="button"
                role={multiSelect ? "checkbox" : "radio"}
                aria-checked={isPicked}
                className={`q-opt ${state}`}
                onClick={() => onSelect(opt.id)}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="q-opt-marker">{opt.id.toUpperCase()}</span>
                <span className="q-opt-body type-body-lg">{opt.text}</span>
                <span className="q-opt-ring" aria-hidden />
                {showFeedback && isRightAnswer && (
                  <Icon icon={Check} size="sm" className="q-opt-check" />
                )}
              </button>
            );
          })}
        </div>

        {!hasKnownAnswer(question) && (
          <p className="q-note type-body-md">No answer marked in the PDF for this one.</p>
        )}

        {showFeedback && (
          <div className={`q-feedback ${isCorrect ? "is-right" : "is-wrong"}`}>
            <span className="q-feedback-icon">
              <Icon icon={isCorrect ? Check : ArrowRight} size="sm" />
            </span>
            <div className="q-feedback-text type-body-md">
              {isCorrect ? (
                <strong>Correct — well done.</strong>
              ) : (
                <>
                  <strong>Answer: {formatAnswerLabels(question)}</strong>
                  <span>
                    {correctAnswers
                      .map((id) => {
                        const opt = question.options.find((o) => o.id === id);
                        return opt ? `${id.toUpperCase()}) ${opt.text}` : id.toUpperCase();
                      })
                      .join(" · ")}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {!isExam && (
          <div className="q-jump">
            <Icon icon={Hash} size="sm" className="q-jump-icon" />
            <input
              className="input-minimal input-jump"
              type="number"
              inputMode="numeric"
              placeholder="Jump to question #"
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const num = parseInt(jumpValue, 10);
                  if (num >= 1) onJump(num);
                  setJumpValue("");
                }
              }}
              aria-label="Jump to question number"
            />
          </div>
        )}
      </main>

      <footer className="quiz-bar">
        <button
          type="button"
          className="bar-btn bar-btn-muted"
          onClick={onPrev}
          disabled={index === 0}
        >
          <Icon icon={ChevronLeft} size="sm" />
          Back
        </button>

        {isExam ? (
          <>
            <button
              type="button"
              className="bar-btn bar-btn-main"
              onClick={onCheck}
              disabled={!canCheck}
            >
              <Icon icon={isLast ? Send : Check} size="sm" />
              {isLast ? "Submit test" : "Save & next"}
            </button>
            {!isLast && (
              <button type="button" className="bar-btn bar-btn-muted" onClick={onNext}>
                <Icon icon={SkipForward} size="sm" />
              </button>
            )}
          </>
        ) : !revealed ? (
          <>
            <button
              type="button"
              className="bar-btn bar-btn-main"
              onClick={onCheck}
              disabled={!canCheck}
            >
              <Icon icon={Check} size="sm" />
              Check
            </button>
            <button
              type="button"
              className="bar-btn bar-btn-muted"
              onClick={onNext}
              disabled={isLast}
            >
              <Icon icon={SkipForward} size="sm" />
            </button>
          </>
        ) : (
          <button type="button" className="bar-btn bar-btn-main bar-btn-wide" onClick={onNext}>
            {isLast ? "See results" : "Continue"}
            <Icon icon={ArrowRight} size="sm" />
          </button>
        )}
      </footer>
    </div>
  );
}

export function useAutoAdvance(
  enabled: boolean,
  delayMs: number,
  revealed: boolean,
  onNext: () => void,
  isLast: boolean,
) {
  useEffect(() => {
    if (!enabled || !revealed || isLast) return;
    const t = setTimeout(onNext, delayMs);
    return () => clearTimeout(t);
  }, [enabled, delayMs, revealed, onNext, isLast]);
}
