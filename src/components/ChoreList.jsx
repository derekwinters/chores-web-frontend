import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getChores, getPeople } from "../api/client";
import { getChoreAssigneeLabel } from "../utils/choreAssignee";
import { compareChoresByNextDue } from "../utils/choreSort";
import ChoreCard from "./ChoreCard";
import "./ChoreList.css";

function calculateAge(nextDue) {
  if (!nextDue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDue + "T00:00:00");
  const diff = Math.floor((due - today) / (1000 * 60 * 60 * 24));
  return diff;
}

const STATE_LABELS = { due: "Due", complete: "Done" };

export default function ChoreList({ onEdit, onDelete, onComplete, onSkip, onMarkDue, chores: externalChores, people: externalPeople }) {
  const navigate = useNavigate();
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
          <ChoreCard
            key={chore.id}
            chore={{ ...chore, age: calculateAge(chore.next_due) }}
            choreState={chore.state}
            status={STATE_LABELS[chore.state] || chore.state}
            frequency={chore.schedule_summary}
            assignee={assigneeLabel}
            onEdit={onEdit}
            onDelete={onDelete}
            onComplete={onComplete}
            onSkip={onSkip}
            onMarkDue={onMarkDue}
            onHistory={(c) => navigate(`/log?chore_id=${encodeURIComponent(c.id)}`)}
            onClick={() => {}}
          />
        );
      })}
    </div>
  );
}
