import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboard, getPersonHistory } from "../api/client";
import "./Points.css";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function Points() {
  const [selected, setSelected] = useState(null);

  const { data: board = [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["history", selected],
    queryFn: () => getPersonHistory(selected),
    enabled: !!selected,
  });

  return (
    <div className="points-page">
      <h2>Points Leaderboard</h2>

      {board.length === 0 ? (
        <p className="empty">No points recorded yet.</p>
      ) : (
        <table className="leaderboard">
          <thead>
            <tr><th>Person</th><th>Total Points</th></tr>
          </thead>
          <tbody>
            {board.map((entry) => (
              <tr
                key={entry.person}
                className={selected === entry.person ? "selected-row" : ""}
                onClick={() =>
                  setSelected((p) => (p === entry.person ? null : entry.person))
                }
              >
                <td>{entry.person}</td>
                <td>{entry.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <div className="history-panel">
          <h3>History — {selected}</h3>
          {history.length === 0 ? (
            <p className="empty">No history yet.</p>
          ) : (
            <table className="history-table">
              <thead>
                <tr><th>Chore</th><th>Points</th><th>Date</th></tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{h.chore_id}</td>
                    <td>+{h.points}</td>
                    <td>{formatDate(h.completed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
