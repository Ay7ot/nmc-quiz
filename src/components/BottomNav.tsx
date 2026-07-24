import { BarChart3, Home, ListChecks } from "lucide-react";
import { Icon } from "./Icon";
import type { Tab } from "../types";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="bottom-nav-glass">
        <button
          type="button"
          className={`nav-pill ${active === "practice" ? "active" : ""}`}
          onClick={() => onChange("practice")}
          aria-current={active === "practice" ? "page" : undefined}
        >
          <Icon icon={Home} size="md" />
          <span className="nav-pill-label">Practice</span>
        </button>
        <button
          type="button"
          className={`nav-pill ${active === "review" ? "active" : ""}`}
          onClick={() => onChange("review")}
          aria-current={active === "review" ? "page" : undefined}
        >
          <Icon icon={ListChecks} size="md" />
          <span className="nav-pill-label">Review</span>
        </button>
        <button
          type="button"
          className={`nav-pill ${active === "stats" ? "active" : ""}`}
          onClick={() => onChange("stats")}
          aria-current={active === "stats" ? "page" : undefined}
        >
          <Icon icon={BarChart3} size="md" />
          <span className="nav-pill-label">Progress</span>
        </button>
      </div>
    </nav>
  );
}
