import React, { useState } from "react";
import CalendarPicker from "./CalendarPicker";
import "./ChoreForm.css";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_MAP = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th"];
const FIBONACCI = [1, 2, 3, 5, 8, 13];

function emptyState() {
  return {
    name: "",
    schedule_type: "weekly",
    // weekly fields
    weekly_days: [],
    every_other_week: false,
    // monthly fields
    monthly_mode: "day",   // "day" | "nth"
    day_of_month: "1",
    nth_week: "1",
    nth_weekday: "0",
    // interval fields
    interval_days: "7",
    // constraints
    cond_even: false,
    cond_odd: false,
    cond_weekdays: [],    // [] = inactive; non-empty = only these weekdays
    condition_failure: "skip",
    // assignment
    assignment_type: "open",
    eligible_people: [],
    assignee: "",
    current_assignee: "",
    next_assignee: "",
    points: "1",
    disabled: false,
    // dates
    next_due: null,
  };
}

function choreToState(chore) {
  const s = emptyState();
  s.name = chore.name;
  s.schedule_type = chore.schedule_type;
  s.assignment_type = chore.assignment_type;
  s.eligible_people = chore.eligible_people ?? [];
  s.assignee = chore.assignee ?? "";
  s.current_assignee = chore.current_assignee ?? "";
  s.next_assignee = chore.next_assignee ?? "";
  s.points = String(chore.points ?? 0);
  s.disabled = chore.disabled ?? false;
  s.next_due = chore.next_due ?? null;

  const cfg = chore.schedule_config ?? {};
  if (chore.schedule_type === "weekly") {
    s.weekly_days = (cfg.days ?? []).map((d) =>
      typeof d === "string" ? WEEKDAY_MAP[d.charAt(0).toUpperCase() + d.slice(1, 3).toLowerCase()] ?? 0 : d
    );
    s.every_other_week = cfg.every_other_week ?? false;
  } else if (chore.schedule_type === "monthly") {
    if (cfg.weekday_occurrence) {
      s.monthly_mode = "nth";
      s.nth_week = String(cfg.weekday_occurrence.week ?? 1);
      s.nth_weekday = String(cfg.weekday_occurrence.weekday ?? 0);
    } else {
      s.monthly_mode = "day";
      s.day_of_month = String(cfg.day_of_month ?? 1);
    }
  } else if (chore.schedule_type === "interval") {
    s.interval_days = String(cfg.days ?? 7);
  }

  // Parse conditions
  s.condition_failure = cfg.condition_failure ?? "skip";
  for (const cond of cfg.conditions ?? []) {
    if (cond.type === "even_days") s.cond_even = true;
    else if (cond.type === "odd_days") s.cond_odd = true;
    else if (cond.type === "weekdays") {
      s.cond_weekdays = (cond.days ?? []).map((d) =>
        typeof d === "string" ? (WEEKDAY_MAP[d.charAt(0).toUpperCase() + d.slice(1, 3).toLowerCase()] ?? 0) : d
      );
    }
  }
  return s;
}

function stateToPayload(s, { isEditing = false } = {}) {
  let schedule_config = {};
  if (s.schedule_type === "weekly") {
    schedule_config = {
      days: s.weekly_days,
      every_other_week: s.every_other_week,
    };
  } else if (s.schedule_type === "monthly") {
    if (s.monthly_mode === "nth") {
      schedule_config = {
        weekday_occurrence: {
          week: parseInt(s.nth_week),
          weekday: parseInt(s.nth_weekday),
        },
      };
    } else {
      schedule_config = { day_of_month: parseInt(s.day_of_month) };
    }
  } else {
    schedule_config = { days: parseInt(s.interval_days) };
  }

  // Build conditions array
  const conditions = [];
  if (s.cond_even) conditions.push({ type: "even_days" });
  if (s.cond_odd)  conditions.push({ type: "odd_days" });
  if (s.cond_weekdays.length > 0) conditions.push({ type: "weekdays", days: s.cond_weekdays });
  if (conditions.length > 0) {
    schedule_config.conditions = conditions;
    schedule_config.condition_failure = s.condition_failure;
  }

  const payload = {
    name: s.name.trim(),
    schedule_type: s.schedule_type,
    schedule_config,
    assignment_type: s.assignment_type,
    eligible_people: s.eligible_people,
    assignee: s.assignment_type === "fixed" ? s.assignee : null,
    points: parseInt(s.points) || 0,
    disabled: s.disabled,
  };

  if (isEditing) {
    if (s.assignment_type === "rotating") {
      payload.current_assignee = s.current_assignee || null;
      payload.next_assignee = s.next_assignee || null;
    } else if (s.assignment_type === "open") {
      payload.current_assignee = s.current_assignee || null;
    } else if (s.assignment_type === "fixed") {
      payload.current_assignee = s.assignee || null;
    }
  }

  if (s.next_due) {
    payload.next_due = s.next_due;
  }

  return payload;
}

function validate(s) {
  if (!s.name.trim()) return "Name is required.";
  if (s.schedule_type === "weekly" && s.weekly_days.length === 0)
    return "Select at least one day.";
  if (s.schedule_type === "interval" && parseInt(s.interval_days) < 1)
    return "Interval must be at least 1 day.";
  if (s.cond_even && s.cond_odd)
    return "Even days and odd days constraints cannot both be active.";
  if (s.assignment_type === "fixed" && !s.assignee)
    return "Fixed assignment requires an assignee.";
  if (s.assignment_type === "rotating" && s.eligible_people.length < 2)
    return "Rotating assignment needs at least 2 people.";
  if (s.assignment_type === "rotating" && s.current_assignee && !s.eligible_people.includes(s.current_assignee))
    return "Current assignee must be part of the rotation.";
  if (s.assignment_type === "rotating" && s.next_assignee && !s.eligible_people.includes(s.next_assignee))
    return "Next assignee must be part of the rotation.";
  return null;
}

export default function ChoreForm({ initial, people, onSubmit, onCancel, submitLabel = "Save" }) {
  const [s, setS] = useState(initial ? choreToState(initial) : emptyState());
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const initialState = initial ? choreToState(initial) : emptyState();
  const hasInitialConstraints = initialState.cond_even || initialState.cond_odd || initialState.cond_weekdays.length > 0;
  const [constraintsExpanded, setConstraintsExpanded] = useState(hasInitialConstraints);

  const set = (key, val) => setS((prev) => ({ ...prev, [key]: val }));

  const toggleDay = (idx) =>
    set("weekly_days", s.weekly_days.includes(idx)
      ? s.weekly_days.filter((d) => d !== idx)
      : [...s.weekly_days, idx].sort((a, b) => a - b)
    );

  const togglePerson = (name) =>
    set("eligible_people", s.eligible_people.includes(name)
      ? s.eligible_people.filter((p) => p !== name)
      : [...s.eligible_people, name]
    );

  const toggleConstraintDay = (idx) =>
    set("cond_weekdays", s.cond_weekdays.includes(idx)
      ? s.cond_weekdays.filter((d) => d !== idx)
      : [...s.cond_weekdays, idx].sort((a, b) => a - b)
    );

  const hasConstraints = s.cond_even || s.cond_odd || s.cond_weekdays.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate(s);
    if (err) { setError(err); return; }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(stateToPayload(s, { isEditing: Boolean(initial) }));
    } catch (ex) {
      setError(ex.message);
      setBusy(false);
    }
  };

  return (
    <form className="chore-form" onSubmit={handleSubmit}>
      {/* Name Section */}
      <div className="form-section">
        <div className="form-row">
          <label>Name</label>
          <input
            type="text"
            value={s.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Vacuum downstairs"
          />
        </div>

        {/* Next Due Date (editable) */}
        {initial && (
          <div className="form-row">
            <label>Next Due</label>
            <div className="next-due-controls">
              <div className="next-due-display">
                {s.next_due
                  ? new Date(s.next_due + "T00:00:00").toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : initial.next_due
                  ? new Date(initial.next_due + "T00:00:00").toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Not set"}
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowCalendar(true)}
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {/* Next Assignee (display only) */}
        {initial && initial.next_assignee && (
          <div className="form-row">
            <label>Assigned to Next</label>
            <div className="form-display">{s.next_assignee || initial.next_assignee}</div>
          </div>
        )}
      </div>

      <hr className="form-divider" />

      {/* Points & Enabled Section */}
      <div className="form-section">
        <div className="form-row-inline">
          <div className="form-column">
            <label>Points</label>
            <select value={s.points} onChange={(e) => set("points", e.target.value)} style={{ width: "8rem" }}>
              {FIBONACCI.map((p, idx) => (
                <option key={idx} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Enabled Toggle */}
          <div className="form-column">
            <label>Enabled</label>
            <button
              type="button"
              className={`toggle-pill ${!s.disabled ? "active" : ""}`}
              onClick={() => set("disabled", !s.disabled)}
              aria-label={s.disabled ? "Enable chore" : "Disable chore"}
            >
              <span className="toggle-circle" />
            </button>
          </div>
        </div>
      </div>

      <hr className="form-divider" />

      {/* Assignment Section */}
      <div className="form-section">
        {/* Assignment type */}
        <div className="form-row">
          <label>Assignment</label>
          <div className="radio-group">
            {["open", "fixed", "rotating"].map((t) => (
              <label key={t} className="radio-label">
                <input
                  type="radio"
                  name="assignment_type"
                  value={t}
                  checked={s.assignment_type === t}
                  onChange={() => set("assignment_type", t)}
                />
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </label>
            ))}
          </div>
        </div>

      {/* Fixed assignee */}
      {s.assignment_type === "fixed" && people.length > 0 && (
        <div className="form-row">
          <label>Assignee</label>
          <div className="people-picker">
            {people.map((p) => (
              <button
                type="button"
                key={p.name}
                className={s.assignee === p.name ? "person-btn active" : "person-btn"}
                onClick={() => set("assignee", s.assignee === p.name ? "" : p.name)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {initial && s.assignment_type === "open" && people.length > 0 && (
        <div className="form-row">
          <label>Current assignee</label>
          <div className="people-picker">
            <button
              type="button"
              className={!s.current_assignee ? "person-btn active" : "person-btn"}
              onClick={() => set("current_assignee", "")}
            >
              Unassigned
            </button>
            {people.map((p) => (
              <button
                type="button"
                key={p.name}
                className={s.current_assignee === p.name ? "person-btn active" : "person-btn"}
                onClick={() => set("current_assignee", s.current_assignee === p.name ? "" : p.name)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Eligible people (rotating or open with suggestions) */}
      {(s.assignment_type === "rotating" || s.assignment_type === "open") && people.length > 0 && (
        <div className="form-row">
          <label>{s.assignment_type === "rotating" ? "Rotation" : "Eligible people"}</label>
          <div className="people-picker">
            {people.map((p) => (
              <button
                type="button"
                key={p.name}
                className={s.eligible_people.includes(p.name) ? "person-btn active" : "person-btn"}
                onClick={() => togglePerson(p.name)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {initial && s.assignment_type === "rotating" && s.eligible_people.length > 0 && (
        <>
          <div className="form-row">
            <label>Current assignee</label>
            <div className="people-picker">
              {s.eligible_people.map((name) => (
                <button
                  type="button"
                  key={name}
                  className={s.current_assignee === name ? "person-btn active" : "person-btn"}
                  onClick={() => set("current_assignee", name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label>Assigned to next</label>
            <div className="people-picker">
              {s.eligible_people.map((name) => (
                <button
                  type="button"
                  key={name}
                  className={s.next_assignee === name ? "person-btn active" : "person-btn"}
                  onClick={() => set("next_assignee", name)}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="form-hint">
              Pick the person who should be next in the rotation after the current assignee.
            </div>
          </div>
        </>
      )}
      </div>

      <hr className="form-divider" />

      {/* Schedule Section */}
      <div className="form-section">
        {/* Schedule type */}
      <div className="form-row">
        <label>Schedule</label>
        <div className="radio-group">
          {["weekly", "monthly", "interval"].map((t) => (
            <label key={t} className="radio-label">
              <input
                type="radio"
                name="schedule_type"
                value={t}
                checked={s.schedule_type === t}
                onChange={() => set("schedule_type", t)}
              />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* Weekly sub-fields */}
      {s.schedule_type === "weekly" && (
        <>
          <div className="form-row">
            <label>Days</label>
            <div className="day-picker">
              {DAYS.map((day, idx) => (
                <button
                  type="button"
                  key={day}
                  className={s.weekly_days.includes(idx) ? "day-btn active" : "day-btn"}
                  onClick={() => toggleDay(idx)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="form-row">
            <label>
              <input
                type="checkbox"
                checked={s.every_other_week}
                onChange={(e) => set("every_other_week", e.target.checked)}
              />
              {" "}Every other week
            </label>
          </div>
        </>
      )}

      {/* Monthly sub-fields */}
      {s.schedule_type === "monthly" && (
        <>
          <div className="form-row">
            <label>Mode</label>
            <div className="radio-group">
              <label className="radio-label">
                <input type="radio" checked={s.monthly_mode === "day"}
                  onChange={() => set("monthly_mode", "day")} /> Day of month
              </label>
              <label className="radio-label">
                <input type="radio" checked={s.monthly_mode === "nth"}
                  onChange={() => set("monthly_mode", "nth")} /> Nth weekday
              </label>
            </div>
          </div>
          {s.monthly_mode === "day" ? (
            <div className="form-row">
              <label>Day</label>
              <select value={s.day_of_month} onChange={(e) => set("day_of_month", e.target.value)}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
                <option value="-1">Last day</option>
              </select>
            </div>
          ) : (
            <div className="form-row">
              <label>Occurrence</label>
              <div className="inline-selects">
                <select value={s.nth_week} onChange={(e) => set("nth_week", e.target.value)}>
                  {ORDINALS.map((o, i) => <option key={i} value={i + 1}>{o}</option>)}
                </select>
                <select value={s.nth_weekday} onChange={(e) => set("nth_weekday", e.target.value)}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {/* Interval sub-fields */}
      {s.schedule_type === "interval" && (
        <div className="form-row">
          <label>Every N days</label>
          <input
            type="number"
            min="1"
            value={s.interval_days}
            onChange={(e) => set("interval_days", e.target.value)}
            style={{ width: "6rem" }}
          />
        </div>
      )}

        {/* Constraints */}
        <div className="form-constraints-header">
          <button
            type="button"
            className="collapse-toggle"
            onClick={() => setConstraintsExpanded(!constraintsExpanded)}
          >
            {constraintsExpanded ? "▼" : "▶"} Constraints
          </button>
        </div>
      {constraintsExpanded && (
        <>
          <div className="form-row">
            <label>Day-of-month</label>
            <div className="checkbox-group">
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={s.cond_even}
                  onChange={(e) => set("cond_even", e.target.checked)}
                />
                Even days only
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={s.cond_odd}
                  onChange={(e) => set("cond_odd", e.target.checked)}
                />
                Odd days only
              </label>
            </div>
          </div>
          <div className="form-row">
            <label>Weekdays only</label>
            <div className="day-picker">
              {DAYS.map((day, idx) => (
                <button
                  type="button"
                  key={day}
                  className={s.cond_weekdays.includes(idx) ? "day-btn active" : "day-btn"}
                  onClick={() => toggleConstraintDay(idx)}
                >
                  {day}
                </button>
              ))}
            </div>
            {s.cond_weekdays.length > 0 && (
              <button
                type="button"
                className="clear-link"
                onClick={() => set("cond_weekdays", [])}
              >
                Clear
              </button>
            )}
          </div>
          {hasConstraints && (
            <div className="form-row">
              <label>When constraint not met</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    checked={s.condition_failure === "skip"}
                    onChange={() => set("condition_failure", "skip")}
                  />
                  Skip to next occurrence
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    checked={s.condition_failure === "delay"}
                    onChange={() => set("condition_failure", "delay")}
                  />
                  Delay day-by-day
                </label>
              </div>
            </div>
          )}
        </>
      )}
      </div>

      {error && <div className="form-error">{error}</div>}

      {showCalendar && (
        <div className="modal-overlay" onClick={() => setShowCalendar(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Due Date</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowCalendar(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <CalendarPicker
                initialDate={s.next_due || initial.next_due}
                onSelect={(date) => {
                  set("next_due", date);
                  setShowCalendar(false);
                }}
                onCancel={() => setShowCalendar(false)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
