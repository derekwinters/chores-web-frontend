import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getChores, getPeople } from "../api/client";
import { MdSchedule, MdPerson, MdEdit, MdDelete, MdAccessTime } from "react-icons/md";
import { getChoreAssigneeLabel } from "../utils/choreAssignee";
import { compareChoresByNextDue } from "../utils/choreSort";
import "./ChoreList.css";

const STATE_LABELS = { due: "Due", complete: "Done" };

const ICONS = {
  schedule: MdSchedule,
  assignee: MdPerson,
};

export default function ChoreList({ onEdit, onDelete, chores: externalChores, people: externalPeople }) {
  const navigate = useNavigate();
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

  const sorted = [...chores].sort(compareChoresByNextDue);

  if (sorted.length === 0) {
    return <div className="empty">No chores yet. Add one to get started.</div>;
  }

  return (
    <div className="chore-list" role="region" aria-label="Chores list">
      {sorted.map((chore) => {
        const assigneeLabel = getChoreAssigneeLabel(chore);

        return (
          <article key={chore.id} className="chore-card" onClick={() => setExpandedChoreId(expandedChoreId === chore.id ? null : chore.id)}>
            <div className="chore-content">
              <div className="chore-left">
                <div className="chore-header">
                  <h3 className="chore-name">{chore.name}</h3>
                </div>

                <div className="chore-details">
                  <div className="chore-detail-item icon-only">
                    <div className="detail-content">
                      <div className="points-info">
                        <span className="points-value">{chore.points ?? 0}</span>
                        <span className="points-label">pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="chore-detail-item icon-only">
                    <div className="detail-content">
                      <div className="assignment-row">
                        <div className={`assignment-info ${chore.assignment_type}`}>
                          <ICONS.assignee className="assignment-icon" />
                          <span className="assignment-type">
                            {chore.assignment_type}
                          </span>
                        </div>
                        <span className="assignee-name">{assigneeLabel}</span>
                      </div>
                    </div>
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
                className="chore-action-link"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/log?chore_id=${encodeURIComponent(chore.id)}`);
                }}
                aria-label={`History for ${chore.name}`}
              >
                History
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
        );
      })}
    </div>
  );
}
