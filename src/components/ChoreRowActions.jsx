import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeChore, skipChore, reassignChore, markDueChore } from "../api/client";
import { getPersonColor } from "../utils/personColors";
import Toast from "./Toast";
import "./ChoreRowActions.css";

function ageLabel(age) {
  if (age == null) return "";
  if (age < 0) return `in ${Math.abs(age)}d`;
  if (age === 0) return "today";
  return `${age}d overdue`;
}

function ageCls(age) {
  if (age == null || age < 0) return "future";
  if (age === 0) return "today";
  return "overdue";
}

export default function ChoreRowActions({ chore, person, people, mode }) {
  const qc = useQueryClient();
  const [reassignTarget, setReassignTarget] = useState("");
  const [justDone, setJustDone] = useState(false);
  const [toast, setToast] = useState(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["chores"] });
    qc.invalidateQueries({ queryKey: ["points-summary"] });
  };

  const complete = useMutation({
    mutationFn: () => completeChore(chore.id, person ?? null),
    onSuccess: () => {
      setJustDone(true);
      if (chore.points) setToast(`+${chore.points} pts!`);
      invalidate();
    },
  });
  const skip = useMutation({
    mutationFn: () => skipChore(chore.id),
    onSuccess: invalidate,
  });
  const reassign = useMutation({
    mutationFn: () => reassignChore(chore.id, reassignTarget),
    onSuccess: () => { invalidate(); setReassignTarget(""); },
  });
  const markDue = useMutation({
    mutationFn: () => markDueChore(chore.id),
    onSuccess: invalidate,
  });

  const busy = complete.isPending || skip.isPending || reassign.isPending || markDue.isPending;
  const assigneeColor = person ? getPersonColor(person) : 'var(--text-muted)';

  return (
    <>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      <div className={`chore-row ${justDone ? "done" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className={`chore-row-icon ${justDone ? "done" : ""}`}>
          {justDone
            ? <span className="chore-icon-check">✓</span>
            : chore.points
              ? <span className="chore-icon-pts">{chore.points}pt</span>
              : null
          }
        </div>

        <div className="chore-row-info">
          <span className="chore-row-name">{chore.name}</span>
          {chore.age != null && mode === "due" && (
            <span className={`chore-row-age ${ageCls(chore.age)}`}>{ageLabel(chore.age)}</span>
          )}
          {mode === "soon" && chore.next_due && (
            <span className="chore-row-due">
              due {new Date(chore.next_due + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
          {person && (
            <span className="chore-row-assignee">
              <span className="assignee-dot" style={{ background: assigneeColor }} />
              {person}
            </span>
          )}
        </div>

        <div className="chore-row-btns">
          {chore.points > 0 && (
            <span className="pts-badge">+{chore.points} pts</span>
          )}

          {mode === "due" && (
            <>
              <button className="btn-primary btn-xs" disabled={busy || justDone} onClick={() => complete.mutate()}>
                Complete
              </button>
              <button className="btn-secondary btn-xs" disabled={busy} onClick={() => skip.mutate()}>
                Skip
              </button>
            </>
          )}
          {mode === "soon" && (
            <button className="btn-secondary btn-xs" disabled={busy} onClick={() => markDue.mutate()}>
              Mark due
            </button>
          )}
          {people.length > 1 && (
            <div className="chore-row-reassign">
              <select
                value={reassignTarget}
                onChange={(e) => setReassignTarget(e.target.value)}
                className="reassign-select-xs"
                disabled={busy}
              >
                <option value="">Reassign…</option>
                {people.filter((p) => p.name !== person).map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
              {reassignTarget && (
                <button className="btn-secondary btn-xs" disabled={busy} onClick={() => reassign.mutate()}>
                  ✓
                </button>
              )}
            </div>
          )}
        </div>

        {(complete.isError || skip.isError || reassign.isError) && (
          <div className="chore-row-error">
            {complete.error?.message ?? skip.error?.message ?? reassign.error?.message}
          </div>
        )}
      </div>
    </>
  );
}
