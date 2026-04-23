import React, { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { MdFilterList, MdAdd } from "react-icons/md";
import { getChores, getPeople, createChore, updateChore, deleteChore } from "../api/client";
import ChoreForm from "../components/ChoreForm";
import ChoreList from "../components/ChoreList";
import Modal from "../components/Modal";
import { compareChoresByNextDue } from "../utils/choreSort";
import "./Manage.css";

function getFiltersFromSearchParams(searchParams) {
  const filters = {};
  const scheduleType = searchParams.get("schedule_type");
  const assignmentType = searchParams.get("assignment_type");
  const state = searchParams.get("state");
  const disabled = searchParams.get("disabled");

  if (scheduleType) filters.schedule_type = scheduleType;
  if (assignmentType) filters.assignment_type = assignmentType;
  if (state) filters.state = state;
  if (disabled === "true") filters.disabled = true;
  if (disabled === "false") filters.disabled = false;

  return filters;
}

export default function Manage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modal, setModal] = useState(null); // null | { mode: "create" } | { mode: "edit", chore }
  const [deleteTarget, setDeleteTarget] = useState(null); // chore to confirm-delete
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const filters = useMemo(() => getFiltersFromSearchParams(searchParams), [searchParams]);

  const { data: chores = [], isLoading } = useQuery({
    queryKey: ["chores"],
    queryFn: getChores,
  });

  const { data: people = [] } = useQuery({
    queryKey: ["people"],
    queryFn: getPeople,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["chores"] });

  const createMut = useMutation({
    mutationFn: createChore,
    onSuccess: () => { invalidate(); setModal(null); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateChore(id, data),
    onSuccess: () => { invalidate(); setModal(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteChore(id),
    onSuccess: () => { invalidate(); setDeleteTarget(null); },
  });

  const handleFilterChange = useCallback((key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);

      if (value === undefined || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }

      return next;
    });
  }, [setSearchParams]);

  const handleClearFilters = () => {
    setSearchParams({});
  };

  const filtered = useMemo(() => {
    return chores.filter((chore) => {
      if (filters.schedule_type && chore.schedule_type !== filters.schedule_type) return false;
      if (filters.assignment_type && chore.assignment_type !== filters.assignment_type) return false;
      if (filters.state && chore.state !== filters.state) return false;
      if (filters.disabled !== undefined && chore.disabled !== filters.disabled) return false;
      return true;
    });
  }, [chores, filters]);

  const sorted = [...filtered].sort(compareChoresByNextDue);

  const scheduleTypes = [...new Set(chores.map(c => c.schedule_type))].sort();
  const assignmentTypes = [...new Set(chores.map(c => c.assignment_type))].sort();
  const states = [...new Set(chores.map(c => c.state))].sort();

  return (
    <div className="manage-page">
      <div className="page-header">
        <h2>All Chores</h2>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => setFiltersExpanded(!filtersExpanded)} title={filtersExpanded ? "Hide filters" : "Show filters"}>
            <MdFilterList className="action-icon" />
            <span className="action-text">{filtersExpanded ? "Hide filters" : "Show filters"}</span>
          </button>
          <button className="btn-primary" onClick={() => setModal({ mode: "create" })} title="Add Chore">
            <MdAdd className="action-icon" />
            <span className="action-text">Add Chore</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading…</div>
      ) : (
        <>
          {Object.keys(filters).length > 0 && (
            <div className="filter-bar">
              <button className="btn-secondary" onClick={handleClearFilters}>
                Clear filters
              </button>
            </div>
          )}

          {filtersExpanded && (
            <div className="chore-filters">
              <div className="filter-group">
                <label htmlFor="filter-schedule">Schedule type</label>
                <select
                  id="filter-schedule"
                  value={filters.schedule_type || ""}
                  onChange={(e) => handleFilterChange("schedule_type", e.target.value)}
                >
                  <option value="">All types</option>
                  {scheduleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="filter-assignment">Assignment type</label>
                <select
                  id="filter-assignment"
                  value={filters.assignment_type || ""}
                  onChange={(e) => handleFilterChange("assignment_type", e.target.value)}
                >
                  <option value="">All types</option>
                  {assignmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="filter-state">State</label>
                <select
                  id="filter-state"
                  value={filters.state || ""}
                  onChange={(e) => handleFilterChange("state", e.target.value)}
                >
                  <option value="">All states</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="filter-disabled">Status</label>
                <select
                  id="filter-disabled"
                  value={filters.disabled === undefined ? "" : String(filters.disabled)}
                  onChange={(e) => {
                    handleFilterChange("disabled", e.target.value || undefined);
                  }}
                >
                  <option value="">All chores</option>
                  <option value="false">Enabled only</option>
                  <option value="true">Disabled only</option>
                </select>
              </div>
            </div>
          )}

          <div className="chore-count">
            Showing {sorted.length} of {chores.length} chore{chores.length !== 1 ? "s" : ""}
          </div>

          <ChoreList
            chores={sorted}
            people={people}
            onEdit={(chore) => setModal({ mode: "edit", chore })}
            onDelete={(chore) => setDeleteTarget(chore)}
          />
        </>
      )}

      {/* Create / Edit modal */}
      {modal && (
        <Modal
          title={modal.mode === "create" ? "Add Chore" : `Edit — ${modal.chore.name}`}
          onClose={() => setModal(null)}
        >
          <ChoreForm
            initial={modal.mode === "edit" ? modal.chore : null}
            people={people}
            submitLabel={modal.mode === "create" ? "Create" : "Save changes"}
            onCancel={() => setModal(null)}
            onSubmit={async (payload) => {
              if (modal.mode === "create") {
                await createMut.mutateAsync(payload);
              } else {
                await updateMut.mutateAsync({ id: modal.chore.id, data: payload });
              }
            }}
          />
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <Modal title="Delete chore?" onClose={() => setDeleteTarget(null)}>
          <div className="confirm-delete">
            <p>
              Delete <strong>{deleteTarget.name}</strong>? This also removes all points history
              for this chore and cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                disabled={deleteMut.isPending}
                onClick={() => deleteMut.mutate(deleteTarget.unique_id)}
              >
                {deleteMut.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
