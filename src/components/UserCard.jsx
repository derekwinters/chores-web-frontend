import React from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import ProgressBar from "./ProgressBar";
import { getPersonColor } from "../utils/personColors";
import { getTrendStatus, getTrendColor } from "../utils/trendStatus";
import { UNASSIGNED_FILTER_VALUE } from "../utils/choreAssignee";
import "./UserCard.css";

const DUE_SOON_DAYS = 7;

function daysUntil(dateStr) {
  const due = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86_400_000);
}

export default function UserCard({ person, chores, people, summary }) {
  const navigate = useNavigate();
  const color = person.color || getPersonColor(person.name);
  const goal7d = person.goal_7d ?? 12;
  const goal30d = person.goal_30d ?? 50;
  const pts7 = summary?.points_7d ?? 0;
  const pts30 = summary?.points_30d ?? 0;
  const trend7d = getTrendStatus(pts7, goal7d);
  const trend30d = getTrendStatus(pts30, goal30d);
  const color7d = getTrendColor(trend7d);
  const color30d = getTrendColor(trend30d);

  const dueNow = chores
    .filter((c) => {
      if (c.state !== "due" || c.disabled) return false;
      if (c.assignment_type === "fixed") return c.assignee === person.name;
      if (c.assignment_type === "open") return c.current_assignee === null || c.current_assignee === person.name;
      return c.current_assignee === person.name;
    })
    .length;

  const dueSoon = chores
    .filter((c) => {
      if (c.state !== "complete" || !c.next_due || c.disabled) return false;
      const d = daysUntil(c.next_due);
      if (d < 0 || d > DUE_SOON_DAYS) return false;
      if (c.assignment_type === "fixed") return c.assignee === person.name;
      if (c.assignment_type === "open") return c.current_assignee === null || c.current_assignee === person.name;
      return c.current_assignee === person.name;
    })
    .length;

  return (
    <div className="user-card">
      <div className="uc-header">
        <div className="uc-identity">
          <Avatar name={person.name} size={44} color={color} />
          <span className="uc-name">{person.name}</span>
        </div>
      </div>

      <div className="uc-points-grid">
        <div className="uc-points-col">
          <div className="uc-points-label">Last 7 Days</div>
          <div className="uc-points-value"><span style={{ color: color7d }}>{pts7}</span><span className="uc-pts-unit">pts</span></div>
          <ProgressBar value={pts7} max={goal7d} color={color} />
          <div className="uc-goal-label">Goal: {goal7d} pts</div>
        </div>
        <div className="uc-points-col">
          <div className="uc-points-label">Last 30 Days</div>
          <div className="uc-points-value"><span style={{ color: color30d }}>{pts30}</span><span className="uc-pts-unit">pts</span></div>
          <ProgressBar value={pts30} max={goal30d} color={color} />
          <div className="uc-goal-label">Goal: {goal30d} pts</div>
        </div>
      </div>

      <div className="uc-divider" />

      <div className="uc-due-grid">
        <button
          className="uc-due-col uc-due-link"
          onClick={(e) => {
            e.stopPropagation();
            const params = new URLSearchParams();
            params.append("state", "due");
            params.append("assignee", person.name);
            params.append("assignee", UNASSIGNED_FILTER_VALUE);
            navigate(`/chores?${params.toString()}`);
          }}
        >
          <div className="uc-due-header">Due Now</div>
          <div className="uc-due-count" style={dueNow === 0 ? { color: "var(--text)" } : {}}>{dueNow}</div>
        </button>

        <button
          className="uc-due-col uc-due-link"
          onClick={(e) => {
            e.stopPropagation();
            const params = new URLSearchParams();
            params.append("daysFromNow", DUE_SOON_DAYS);
            params.append("assignee", person.name);
            params.append("assignee", UNASSIGNED_FILTER_VALUE);
            navigate(`/chores?${params.toString()}`);
          }}
        >
          <div className="uc-due-header">Due Soon</div>
          <div className="uc-due-count" style={dueSoon === 0 ? { color: "var(--text)" } : {}}>{dueSoon}</div>
        </button>
      </div>
    </div>
  );
}
