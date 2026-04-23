import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getChores, getPeople, getPointsSummary } from "../api/client";
import UserCard from "../components/UserCard";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: chores = [], isLoading } = useQuery({
    queryKey: ["chores"],
    queryFn: getChores,
    refetchInterval: 60_000,
  });

  const { data: people = [] } = useQuery({
    queryKey: ["people"],
    queryFn: getPeople,
  });

  const { data: summary = [] } = useQuery({
    queryKey: ["points-summary"],
    queryFn: getPointsSummary,
    refetchInterval: 60_000,
  });

  const summaryByPerson = Object.fromEntries(summary.map((s) => [s.person, s]));

  const openDueCount = chores.filter(
    (c) => c.state === "due" && c.assignment_type === "open" && !c.disabled
  ).length;

  if (isLoading) return <div className="loading">Loading…</div>;

  if (people.length === 0) {
    return (
      <div className="dashboard-empty">
        <p>No people added yet. Go to <strong>Manage</strong> to add chores and people.</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>Board</h2>
      </div>
      <div className="user-grid">
        {people.map((person) => (
          <div
            key={person.name}
            onClick={() => navigate(`/users/${encodeURIComponent(person.name)}`)}
            style={{ cursor: "pointer" }}
          >
            <UserCard
              person={person}
              chores={chores}
              people={people}
              summary={summaryByPerson[person.name]}
            />
          </div>
        ))}
      </div>

      {openDueCount > 0 && (
        <section className="open-section">
          <button
            className="open-section-link"
            onClick={() => navigate(`/chores?state=due&assignment_type=open`)}
          >
            <h3 className="open-section-title">Open / Unassigned</h3>
            <div className="open-section-count">{openDueCount}</div>
          </button>
        </section>
      )}
    </div>
  );
}
