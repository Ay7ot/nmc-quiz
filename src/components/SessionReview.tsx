import { useState } from "react";
import { Check, ClipboardList, X } from "lucide-react";
import { Icon } from "./Icon";
import type { Question } from "../types";

export interface ReviewItem {
  question: Question;
  selected: string | null;
  correct: boolean | null;
}

interface SessionReviewProps {
  items: ReviewItem[];
  defaultFilter?: "all" | "wrong" | "skipped";
}

export function SessionReview({ items, defaultFilter = "all" }: SessionReviewProps) {
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
        Answer review
      </h2>

      <div className="review-filters">
        <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>
          All ({items.length})
        </FilterBtn>
        <FilterBtn active={filter === "wrong"} onClick={() => setFilter("wrong")}>
          Wrong ({wrongCount})
        </FilterBtn>
        <FilterBtn active={filter === "skipped"} onClick={() => setFilter("skipped")}>
          Skipped ({skippedCount})
        </FilterBtn>
      </div>

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

  let status = "skipped";
  if (isRight) status = "right";
  if (isWrong) status = "wrong";

  const selectedOpt = question.options.find((o) => o.id === selected);
  const correctOpt = question.options.find((o) => o.id === question.answer);

  return (
    <li className={`review-card ${status}`}>
      <div className="review-card-head">
        <span className="review-card-num">Q{question.id}</span>
        <span className={`review-status type-label-sm ${status}`}>
          {isSkipped && "Skipped"}
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

      {!isSkipped && selectedOpt && (
        <div className={`review-answer-row ${isWrong ? "your-wrong" : "your-right"}`}>
          <span className="type-label-sm">Your answer</span>
          <span>
            <strong>{selected?.toUpperCase()})</strong> {selectedOpt.text}
          </span>
        </div>
      )}

      {(isWrong || isSkipped) && question.answer && correctOpt && (
        <div className="review-answer-row correct-answer">
          <span className="type-label-sm">Correct answer</span>
          <span>
            <strong>{question.answer.toUpperCase()})</strong> {correctOpt.text}
          </span>
        </div>
      )}
    </li>
  );
}
