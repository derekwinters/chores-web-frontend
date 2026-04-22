import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getChores, getPeople } from "../api/client";
import { MdSchedule, MdPerson, MdStar, MdEdit, MdDelete, MdAccessTime } from "react-icons/md";
import "./ChoreList.css";

const STATE_LABELS = { due: "Due", complete: "Done" };

const ICONS = {
  schedule: MdSchedule,
  assignee: MdPerson,
  points: MdStar,
};

export default function ChoreList({ onEdit, onDelete, chores: externalChores, people: externalPeople }) {
  const [expandedChoreId, setExpandedChoreId] = useState(null);
  const { data: queriedChores = [], isLoading: choresLoading } = useQuery({
    queryKey: ["chores"],
    queryFn: getChores,
    enabled: !externalChores,
  });

  const { data: queriedPeople = [] } = useQuery({
    queryKey: ["people"],
    queryFn: getPeople,
    enabled: !externalPeople,
  });

  const chores = externalChores ?? queriedChores;
  const people = externalPeople ?? queriedPeople;

  if (choresLoading && !externalChores) return <div className="loading">Loading chores…</div>;

  const sorted = [...chores].sort((a, b) => a.name.localeCompare(b.name));

  if (sorted.length === 0) {
    return <div className="empty">No chores yet. Add one to get started.</div>;
  }

  return (
    <div className="chore-list" role="region" aria-label="Chores list">
      {sorted.map((chore) => (
        <article key={chore.id} className="chore-card" onClick={() => setExpandedChoreId(expandedChoreId === chore.id ? null : chore.id)}>
          <div className="chore-content">
            <div className="chore-left">
              <div className="chore-header">
                <h3 className="chore-name">{chore.name}</h3>
              </div>

              <div className="chore-details">
                <div className="chore-detail-item icon-only">
                  <div className="detail-content">
                    <span className="detail-value">{chore.points ?? 0}</span>
                  </div>
                  <ICONS.points className="detail-icon" />
                </div>

                <div className="chore-detail-item icon-only">
                  <div className="detail-content">
                    <div className="assignment-info">
                      {chore.assignment_type === "fixed" && chore.assignee ? (
                        <span className="assignee-name">{chore.assignee}</span>
                      ) : (
                        <>
                          <span className={`assignment-type ${chore.assignment_type}`}>
                            {chore.assignment_type}
                          </span>
                          {chore.current_assignee && (
                            <span className="assignee-name">{chore.current_assignee}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <ICONS.assignee className="detail-icon" />
                </div>
              </div>
            </div>

            {chore.next_due && (
              <div className="chore-right">
                <div className="due-content">
                  <div className="due-value">
                    {new Date(chore.next_due + "T00:00:00").toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="due-label">{chore.schedule_summary}</div>
                </div>
                <MdAccessTime className="due-icon" />
              </div>
            )}
          </div>

          <div className={`chore-actions ${expandedChoreId === chore.id ? "expanded" : ""}`}>
            <button
              className="chore-action-link"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(chore);
              }}
              aria-label={`Edit ${chore.name}`}
            >
              Edit
            </button>
            <button
              className="chore-action-link chore-action-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(chore);
              }}
              aria-label={`Delete ${chore.name}`}
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
