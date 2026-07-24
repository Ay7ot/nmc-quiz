import { useState } from "react";
import { Check, ClipboardList, X } from "lucide-react";
import { Icon } from "./Icon";
import {
  formatAnswerLabels,
  getCorrectAnswers,
  parseSelection,
} from "../lib/questionUtils";
import type { Question } from "../types";

export interface ReviewItem {
  question: Question;
  selected: string | null;
  correct: boolean | null;
}

interface SessionReviewProps {
  items: ReviewItem[];
  defaultFilter?: "all" | "wrong" | "skipped";
  title?: string;
  showFilters?: boolean;
}

export function SessionReview({
  items,
  defaultFilter = "all",
  title = "Answer review",
  showFilters = true,
}: SessionReviewProps) {
  const [filter, setFilter] = useState<"all" | "wrong" | "skipped">(defaultFilter);

  const filtered = items.filter((item) => {
    if (filter === "wrong") return item.selected != null && item.correct === false;
    if (filter === "skipped") return item.selected == null;
    return true;
  });

  const wrongCount = items.filter((i) => i.selected != null && i.correct === false).length;
  const skippedCount = items.filter((i) => i.selected == null).length;

  return (
    <section className="panel review-panel">
      <h2 className="panel-title type-title-md">
        <Icon icon={ClipboardList} size="sm" className="inline-icon" />
        {title}
      </h2>

      {showFilters && (
      <div className="review-filters">
        <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>
          All ({items.length})
        </FilterBtn>
        <FilterBtn active={filter === "wrong"} onClick={() => setFilter("wrong")}>
          Wrong ({wrongCount})
        </FilterBtn>
        <FilterBtn active={filter === "skipped"} onClick={() => setFilter("skipped")}>
          Unanswered ({skippedCount})
        </FilterBtn>
      </div>
      )}

      <ul className="review-list">
        {filtered.map((item) => (
          <ReviewCard key={item.question.id} item={item} />
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="review-empty type-body-md">Nothing in this filter.</p>
      )}
    </section>
  );
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={`review-filter ${active ? "on" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function ReviewCard({ item }: { item: ReviewItem }) {
  const { question, selected, correct } = item;
  const isSkipped = selected == null;
  const isWrong = selected != null && correct === false;
  const isRight = selected != null && correct === true;
  const selectedIds = parseSelection(selected);
  const correctIds = getCorrectAnswers(question);

  let status = "skipped";
  if (isRight) status = "right";
  if (isWrong) status = "wrong";

  return (
    <li className={`review-card ${status}`}>
      <div className="review-card-head">
        <span className="review-card-num">Q{question.id}</span>
        <span className={`review-status type-label-sm ${status}`}>
          {isSkipped && "Unanswered"}
          {isRight && (
            <>
              <Icon icon={Check} size="xs" /> Correct
            </>
          )}
          {isWrong && (
            <>
              <Icon icon={X} size="xs" /> Wrong
            </>
          )}
        </span>
      </div>

      <p className="review-question type-body-lg">{question.question}</p>

      {!isSkipped && selectedIds.length > 0 && (
        <div className={`review-answer-row ${isWrong ? "your-wrong" : "your-right"}`}>
          <span className="type-label-sm">Your answer</span>
          <span>
            {selectedIds.map((id) => {
              const opt = question.options.find((o) => o.id === id);
              return (
                <span key={id} className="review-answer-chip">
                  <strong>{id.toUpperCase()})</strong> {opt?.text ?? id}
                </span>
              );
            })}
          </span>
        </div>
      )}

      {(isWrong || isSkipped) && correctIds.length > 0 && (
        <div className="review-answer-row correct-answer">
          <span className="type-label-sm">Correct answer</span>
          <span>
            <strong>{formatAnswerLabels(question)}</strong>
            {" — "}
            {correctIds
              .map((id) => question.options.find((o) => o.id === id)?.text ?? id)
              .join(" · ")}
          </span>
        </div>
      )}
    </li>
  );
}
