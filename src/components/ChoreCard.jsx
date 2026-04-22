import React from "react";
import "./ChoreCard.css";

function ageLabel(age) {
  if (age == null) return "";
  if (age < 0) return `due in ${Math.abs(age)}d`;
  if (age === 0) return "due today";
  return `${age}d overdue`;
}

function ageSeverity(age) {
  if (age == null || age < 0) return "future";
  if (age === 0) return "today";
  if (age <= 2) return "warn";
  return "overdue";
}

export default function ChoreCard({ chore, selected, onClick }) {
  const cls = [
    "chore-card",
    selected ? "selected" : "",
    ageSeverity(chore.age),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}>
      <span className="chore-name">{chore.name}</span>
      <span className="chore-age">{ageLabel(chore.age)}</span>
    </div>
  );
}
