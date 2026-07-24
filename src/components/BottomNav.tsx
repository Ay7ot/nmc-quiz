import { BarChart3, Home } from "lucide-react";
import { Icon } from "./Icon";
import type { Tab } from "../types";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <button
        type="button"
        className={`nav-item ${active === "practice" ? "active" : ""}`}
        onClick={() => onChange("practice")}
        aria-current={active === "practice" ? "page" : undefined}
      >
        <Icon icon={Home} size="md" />
        <span>Practice</span>
      </button>
      <button
        type="button"
        className={`nav-item ${active === "stats" ? "active" : ""}`}
        onClick={() => onChange("stats")}
        aria-current={active === "stats" ? "page" : undefined}
      >
        <Icon icon={BarChart3} size="md" />
        <span>Progress</span>
      </button>
    </nav>
  );
}
