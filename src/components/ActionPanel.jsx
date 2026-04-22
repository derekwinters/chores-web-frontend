import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  completeChore,
  skipChore,
  skipReassignChore,
  reassignChore,
  markDueChore,
} from "../api/client";
import "./ActionPanel.css";

export default function ActionPanel({ chore, people, onDismiss }) {
  const qc = useQueryClient();
  const [assignee, setAssignee] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["chores"] });

  const complete = useMutation({
    mutationFn: ({ id, by }) => completeChore(id, by || null),
    onSuccess: () => { invalidate(); onDismiss(); },
  });
  const skip = useMutation({
    mutationFn: (id) => skipChore(id),
    onSuccess: () => { invalidate(); onDismiss(); },
  });
  const skipReassign = useMutation({
    mutationFn: ({ id, assignee }) => skipReassignChore(id, assignee || null),
    onSuccess: () => { invalidate(); onDismiss(); },
  });
  const reassign = useMutation({
    mutationFn: ({ id, assignee }) => reassignChore(id, assignee),
    onSuccess: invalidate,
  });
  const markDue = useMutation({
    mutationFn: (id) => markDueChore(id),
    onSuccess: invalidate,
  });

  const busy =
    complete.isPending || skip.isPending || skipReassign.isPending ||
    reassign.isPending || markDue.isPending;

  const isDue = chore.state === "due";

  return (
    <div className="action-panel">
      <div className="action-info">
        <div className="action-title">{chore.name}</div>
        <div className="action-meta">
          {chore.current_assignee && (
            <span>Assigned to <strong>{chore.current_assignee}</strong></span>
          )}
          {chore.schedule_summary && (
            <span className="schedule-summary">{chore.schedule_summary}</span>
          )}
          <span className={`state-badge ${chore.state}`}>{chore.state}</span>
        </div>
      </div>

      <div className="action-controls">
        {isDue && (
          <>
            <button
              className="btn-primary"
              disabled={busy}
              onClick={() => complete.mutate({ id: chore.id })}
            >
              Complete
            </button>

            {people.length > 0 && (
              <button
                className="btn-secondary"
                disabled={busy}
                onClick={() => {
                  const by = window.prompt("Completed by:", people[0]?.name ?? "");
                  if (by) complete.mutate({ id: chore.id, by });
                }}
              >
                Complete by…
              </button>
            )}

            <button
              className="btn-warning"
              disabled={busy}
              onClick={() => skip.mutate(chore.id)}
            >
              Skip
            </button>
          </>
        )}

        {!isDue && (
          <button
            className="btn-secondary"
            disabled={busy}
            onClick={() => markDue.mutate(chore.id)}
          >
            Mark due
          </button>
        )}

        {people.length > 0 && (
          <div className="reassign-row">
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="assignee-select"
            >
              <option value="">— reassign to —</option>
              {people.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
            <button
              className="btn-secondary"
              disabled={busy || !assignee}
              onClick={() => reassign.mutate({ id: chore.id, assignee })}
            >
              Reassign
            </button>
            {isDue && (
              <button
                className="btn-secondary"
                disabled={busy || !assignee}
                onClick={() => skipReassign.mutate({ id: chore.id, assignee })}
              >
                Skip + reassign
              </button>
            )}
          </div>
        )}
      </div>

      {(complete.isError || skip.isError || reassign.isError) && (
        <div className="action-error">
          {complete.error?.message ?? skip.error?.message ?? reassign.error?.message}
        </div>
      )}
    </div>
  );
}
