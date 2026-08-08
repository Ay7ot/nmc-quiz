import {
  ArrowRight,
  ClipboardCheck,
  Eye,
  Filter,
  Hash,
  Shuffle,
  SlidersHorizontal,
  Timer,
  Zap,
} from "lucide-react";
import type { QuizSettings } from "../types";
import { SESSION_SIZE_PRESETS } from "../types";
import { Icon } from "./Icon";

interface SettingsFormProps {
  settings: QuizSettings;
  totalQuestions: number;
  onChange: (patch: Partial<QuizSettings>) => void;
}

export function SettingsForm({
  settings,
  totalQuestions,
  onChange,
}: SettingsFormProps) {
  const isCustomSize =
    !SESSION_SIZE_PRESETS.includes(
      settings.questionsPerSession as (typeof SESSION_SIZE_PRESETS)[number],
    ) && settings.questionsPerSession !== totalQuestions;

  return (
    <section className="panel settings-panel">
      <h2 className="panel-title type-title-md">
        <Icon icon={SlidersHorizontal} size="sm" className="inline-icon" />
        Configure session
      </h2>

      <div className="field">
        <span className="field-label type-label-sm">Study mode</span>
        <div className="mode-cards">
          <button
            type="button"
            className={`mode-card ${settings.mode === "practice" ? "on" : ""}`}
            onClick={() => onChange({ mode: "practice" })}
          >
            <Icon icon={Zap} size="md" />
            <span className="mode-card-title type-label-lg">Quick Quiz</span>
            <span className="mode-card-desc">See answers instantly when you check</span>
          </button>
          <button
            type="button"
            className={`mode-card ${settings.mode === "exam" ? "on" : ""}`}
            onClick={() => onChange({ mode: "exam", autoAdvance: false })}
          >
            <Icon icon={ClipboardCheck} size="md" />
            <span className="mode-card-title type-label-lg">Practice</span>
            <span className="mode-card-desc">No hints until submit — then review all</span>
          </button>
          <button
            type="button"
            className={`mode-card ${settings.mode === "timed" ? "on" : ""}`}
            onClick={() => onChange({ mode: "timed", autoAdvance: false })}
          >
            <Icon icon={Timer} size="md" />
            <span className="mode-card-title type-label-lg">Exam</span>
            <span className="mode-card-desc">Countdown timer — auto-submits when time&rsquo;s up</span>
          </button>
          <button
            type="button"
            className={`mode-card ${settings.mode === "read" ? "on" : ""}`}
            onClick={() => onChange({ mode: "read", autoAdvance: false })}
          >
            <Icon icon={Eye} size="md" />
            <span className="mode-card-title type-label-lg">Read</span>
            <span className="mode-card-desc">Correct answers shown directly on each question</span>
          </button>
        </div>
      </div>

      <div className="field">
        <span className="field-label type-label-sm">Questions per session</span>
        <div className="seg-control">
          {SESSION_SIZE_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              className={`seg-btn ${settings.questionsPerSession === n ? "on" : ""}`}
              onClick={() => onChange({ questionsPerSession: n })}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className={`seg-btn ${settings.questionsPerSession === totalQuestions ? "on" : ""}`}
            onClick={() => onChange({ questionsPerSession: totalQuestions })}
          >
            All
          </button>
        </div>
        <div className="field-inline">
          <Icon icon={Hash} size="xs" />
          <span className="field-hint type-body-md">Custom</span>
          <input
            className="input-minimal"
            type="number"
            min={1}
            max={totalQuestions}
            value={isCustomSize ? settings.questionsPerSession : ""}
            placeholder={`1 – ${totalQuestions}`}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val >= 1 && val <= totalQuestions) {
                onChange({ questionsPerSession: val });
              }
            }}
          />
        </div>
      </div>

      <div className="field">
        <span className="field-label type-label-sm">
          <Icon icon={Filter} size="xs" className="inline-icon" />
          Question pool
        </span>
        <div className="filter-cards">
          {(
            [
              ["all", "All", "Full bank"],
              ["unanswered", "New", "Not seen"],
              ["wrong", "Review", "Missed"],
            ] as const
          ).map(([value, title, desc]) => (
            <button
              key={value}
              type="button"
              className={`filter-card ${settings.questionFilter === value ? "on" : ""}`}
              onClick={() => onChange({ questionFilter: value })}
            >
              <span className="filter-card-title type-label-lg">{title}</span>
              <span className="filter-card-desc">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="switch-list">
        <Switch
          icon={Shuffle}
          label="Random order"
          hint="Shuffle each session"
          checked={settings.randomize}
          onChange={(v) => onChange({ randomize: v })}
        />
        <Switch
          icon={Shuffle}
          label="Shuffle options"
          hint="Mix A · B · C · D"
          checked={settings.shuffleOptions}
          onChange={(v) => onChange({ shuffleOptions: v })}
        />
        <Switch
          icon={ArrowRight}
          label="Auto-advance"
          hint="Next after check"
          checked={settings.autoAdvance}
          onChange={(v) => onChange({ autoAdvance: v })}
          disabled={settings.mode === "exam" || settings.mode === "timed" || settings.mode === "read"}
        />
      </div>

      {settings.autoAdvance && settings.mode === "practice" && (
        <div className="field field-slider">
          <div className="field-inline spread">
            <span className="field-label type-label-sm">
              <Icon icon={Timer} size="xs" className="inline-icon" />
              Delay
            </span>
            <span className="field-value">{settings.autoAdvanceDelayMs / 1000}s</span>
          </div>
          <input
            type="range"
            min={500}
            max={4000}
            step={250}
            value={settings.autoAdvanceDelayMs}
            onChange={(e) =>
              onChange({ autoAdvanceDelayMs: parseInt(e.target.value, 10) })
            }
            className="slider"
          />
        </div>
      )}

      {settings.mode === "timed" && (
        <div className="field field-slider">
          <div className="field-inline spread">
            <span className="field-label type-label-sm">
              <Icon icon={Timer} size="xs" className="inline-icon" />
              Session time
            </span>
            <span className="field-value">{settings.timeLimitMin}m</span>
          </div>
          <input
            type="range"
            min={5}
            max={180}
            step={5}
            value={settings.timeLimitMin}
            onChange={(e) =>
              onChange({ timeLimitMin: parseInt(e.target.value, 10) })
            }
            className="slider"
          />
        </div>
      )}
    </section>
  );
}

function Switch({
  icon,
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  icon: typeof Shuffle;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`switch ${checked ? "on" : ""} ${disabled ? "disabled" : ""}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
    >
      <span className="switch-icon">
        <Icon icon={icon} size="sm" />
      </span>
      <span className="switch-copy">
        <span className="switch-label type-body-lg">{label}</span>
        <span className="switch-hint type-body-md">{hint}</span>
      </span>
      <span className="switch-track">
        <span className="switch-thumb" />
      </span>
    </button>
  );
}
