import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminPointsLog,
  updateAdminPointsLog,
  deleteAdminPointsLog,
  getPeople,
} from "../api/client";
import Modal from "./Modal";
import "../pages/Settings.css";

const PAGE_SIZE = 20;

export default function DatabaseSection() {
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [editId, setEditId] = useState(null);
  const [editPoints, setEditPoints] = useState("");
  const [editPerson, setEditPerson] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-points-log", offset],
    queryFn: () => getAdminPointsLog({ limit: PAGE_SIZE, offset }),
  });

  const { data: people = [], isLoading: isPeopleLoading } = useQuery({
    queryKey: ["people"],
    queryFn: getPeople,
  });

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  const updateMutation = useMutation({
    mutationFn: ({ id, points, person }) =>
      updateAdminPointsLog(id, { points: Number(points), person }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-points-log"] });
      setEditId(null);
      setSuccess("Entry updated.");
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to update entry.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminPointsLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-points-log"] });
      setDeleteTarget(null);
      setSuccess("Entry deleted.");
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to delete entry.");
    },
  });

  function startEdit(item) {
    setEditId(item.id);
    setEditPoints(String(item.points));
    setEditPerson(item.person);
    setError(null);
  }

  function cancelEdit() {
    setEditId(null);
    setError(null);
  }

  function saveEdit(id) {
    const pts = parseInt(editPoints, 10);
    if (isNaN(pts)) {
      setError("Points must be a valid integer.");
      return;
    }
    if (!editPerson.trim()) {
      setError("Person cannot be empty.");
      return;
    }
    updateMutation.mutate({ id, points: pts, person: editPerson.trim() });
  }

  function confirmDelete(item) {
    setDeleteTarget(item);
    setError(null);
  }

  function doDelete() {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  }

  return (
    <section className="settings-section">
      <div className="section-row">
        <h3>Points Log</h3>
      </div>
      <hr />

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {isLoading && <div className="loading">Loading&hellip;</div>}
      {isError && <div className="error-message">Failed to load points log.</div>}

      {!isLoading && !isError && (
        <>
          <div className="db-table-wrapper">
            <table className="db-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Person</th>
                  <th>Points</th>
                  <th>Chore ID</th>
                  <th>Completed At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                      No entries found.
                    </td>
                  </tr>
                ) : (
                  items.map((item) =>
                    editId === item.id ? (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>
                          <select
                            className="db-edit-input"
                            value={editPerson}
                            onChange={(e) => setEditPerson(e.target.value)}
                            aria-label="Edit person"
                            disabled={updateMutation.isPending || isPeopleLoading}
                          >
                            {isPeopleLoading ? (
                              <option value={editPerson}>{editPerson}</option>
                            ) : (
                              people.map((p) => (
                                <option key={p.id} value={p.username}>
                                  {p.name}
                                </option>
                              ))
                            )}
                          </select>
                        </td>
                        <td>
                          <input
                            className="db-edit-input db-edit-input--narrow"
                            type="number"
                            value={editPoints}
                            onChange={(e) => setEditPoints(e.target.value)}
                            aria-label="Edit points"
                            disabled={updateMutation.isPending}
                          />
                        </td>
                        <td>{item.chore_id}</td>
                        <td>{new Date(item.completed_at).toLocaleString()}</td>
                        <td className="db-actions">
                          <button
                            className="btn-primary"
                            onClick={() => saveEdit(item.id)}
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? "Saving…" : "Save"}
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={cancelEdit}
                            disabled={updateMutation.isPending}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.person}</td>
                        <td>{item.points}</td>
                        <td>{item.chore_id}</td>
                        <td>{new Date(item.completed_at).toLocaleString()}</td>
                        <td className="db-actions">
                          <button
                            className="btn-secondary"
                            onClick={() => startEdit(item)}
                            aria-label={`Edit entry ${item.id}`}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => confirmDelete(item)}
                            aria-label={`Delete entry ${item.id}`}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="db-pagination">
            <span className="db-pagination-info">
              {total === 0
                ? "No entries"
                : `Showing ${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total}`}
            </span>
            <div className="db-pagination-controls">
              <button
                className="btn-secondary"
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={!hasPrev}
              >
                Previous
              </button>
              <button
                className="btn-secondary"
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={!hasNext}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {deleteTarget && (
        <Modal
          title="Confirm Delete"
          onClose={() => setDeleteTarget(null)}
        >
          <p>
            Delete PointsLog entry #{deleteTarget.id} ({deleteTarget.person},{" "}
            {deleteTarget.points} pts)?
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            This will reverse the points on the person (floored at 0) and cannot be undone.
          </p>
          <div className="db-modal-actions">
            <button
              className="btn-danger"
              onClick={doDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
