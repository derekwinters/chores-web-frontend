import React, { useState } from "react";
import "./ChoreCard.css";

function ageLabel(age) {
  if (age == null) return "";
  if (age < 0) return `due in ${Math.abs(age)}d`;
  if (age === 0) return "due today";
  return `${age}d overdue`;
}

function ageSeverity(age, state) {
  if (state === "complete") return "done";
  if (state === "due") return "due";
  return "future";
}

export default function ChoreCard({ chore, selected, onClick, onEdit, onDelete, onHistory, onComplete, onSkip, onMarkDue, status, frequency, assignee, choreState }) {
  const [expanded, setExpanded] = useState(false);
  const severity = ageSeverity(chore.age, choreState);

  const handleClick = (e) => {
    e.stopPropagation?.();
    setExpanded(!expanded);
    onClick?.();
  };

  const handleAction = (action, e) => {
    e.stopPropagation?.();
    if (action === "edit") onEdit?.(chore);
    if (action === "delete") onDelete?.(chore);
    if (action === "history") onHistory?.(chore);
    if (action === "complete") onComplete?.(chore);
    if (action === "skip") onSkip?.(chore);
    if (action === "mark-due") onMarkDue?.(chore);
  };

  const cls = [
    "chore-card",
    selected ? "selected" : "",
    expanded ? "expanded" : "collapsed",
    severity,
  ]
    .filter(Boolean)
    .join(" ");

  const dueDate = chore.next_due ? new Date(chore.next_due + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null;

  return (
    <article className={cls} onClick={handleClick} tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick(e)}>
      <div className="accent-bar"></div>
      <div className="card-content">
        {!expanded ? (
          <div className="collapsed-view">
            <span className="chore-name">{chore.name}</span>
            {assignee && assignee !== "Unassigned" && <span className="chore-assignee">{assignee}</span>}
            {dueDate && <span className="chore-due-date">{dueDate}</span>}
          </div>
        ) : (
          <div className="expanded-view">
            <div className="expanded-header">
              <h3 className="chore-name">{chore.name}</h3>
              {dueDate && <span className="chore-due-date">{dueDate}</span>}
            </div>

            <div className="expanded-meta">
              {status && (
                <div className="meta-item">
                  <span className="meta-label">Status</span>
                  <span className="meta-value">{status}</span>
                </div>
              )}
              {frequency && (
                <div className="meta-item">
                  <span className="meta-label">Frequency</span>
                  <span className="meta-value">{frequency}</span>
                </div>
              )}
              {chore.points != null && (
                <div className="meta-item">
                  <span className="meta-label">Points</span>
                  <span className="meta-value">{chore.points}</span>
                </div>
              )}
              {assignee && (
                <div className="meta-item">
                  <span className="meta-label">Assignee</span>
                  <span className="meta-value">{assignee}</span>
                </div>
              )}
            </div>

            {(onComplete || onMarkDue || onSkip || onEdit || onHistory || onDelete) && (
              <div className="expanded-actions">
                {choreState === "due" ? (
                  <>
                    {onComplete && (
                      <button className="action-btn success" onClick={(e) => handleAction("complete", e)} aria-label={`Mark ${chore.name} complete`}>
                        Complete
                      </button>
                    )}
                    {onSkip && (
                      <button className="action-btn" onClick={(e) => handleAction("skip", e)} aria-label={`Skip ${chore.name}`}>
                        Skip
                      </button>
                    )}
                  </>
                ) : (
                  onMarkDue && (
                    <button className="action-btn" onClick={(e) => handleAction("mark-due", e)} aria-label={`Mark ${chore.name} due now`}>
                      Mark Due Now
                    </button>
                  )
                )}
                {onEdit && (
                  <button className="action-btn" onClick={(e) => handleAction("edit", e)} aria-label={`Edit ${chore.name}`}>
                    Edit
                  </button>
                )}
                {onHistory && (
                  <button className="action-btn" onClick={(e) => handleAction("history", e)} aria-label={`History for ${chore.name}`}>
                    History
                  </button>
                )}
                {onDelete && (
                  <button className="action-btn danger" onClick={(e) => handleAction("delete", e)} aria-label={`Delete ${chore.name}`}>
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
