import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { MdFilterList, MdAdd } from "react-icons/md";
import { Select, MenuItem, Chip, Box } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { getChores, getPeople, createChore, updateChore, deleteChore, completeChore, skipChore, markDueChore, getPointsSummary } from "../api/client";
import ChoreForm from "../components/ChoreForm";
import ChoreList from "../components/ChoreList";
import Modal from "../components/Modal";
import {
  choreMatchesAssigneeFilter,
  UNASSIGNED_FILTER_VALUE,
  UNASSIGNED_LABEL,
} from "../utils/choreAssignee";
import { compareChoresByNextDue } from "../utils/choreSort";
import "./Chores.css";

const SELECT_CONFIG = {
  sx: {
    color: "var(--text)",
    backgroundColor: "var(--surface)",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--border)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--text-muted)",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "var(--accent)",
    },
  },
  MenuProps: {
    PaperProps: {
      sx: {
        backgroundColor: "var(--surface) !important",
        color: "var(--text) !important",
        "& .MuiMenuItem-root": {
          color: "var(--text) !important",
          "&:hover": {
            backgroundColor: "var(--surface2) !important",
          },
          "&.Mui-selected": {
            backgroundColor: "var(--accent-bg) !important",
            color: "var(--text) !important",
            "&:hover": {
              backgroundColor: "var(--accent-bg) !important",
            },
          },
        },
      },
    },
  },
};

function getFiltersFromSearchParams(searchParams) {
  const filters = {};
  const scheduleType = searchParams.get("schedule_type");
  const assignmentType = searchParams.get("assignment_type");
  const state = searchParams.get("state");
  const disabled = searchParams.get("disabled");
  const assignees = searchParams.getAll("assignee");
  const daysFromNow = searchParams.get("daysFromNow");

  if (scheduleType) filters.schedule_type = scheduleType;
  if (assignmentType) filters.assignment_type = assignmentType;
  if (state) filters.state = state;
  if (disabled === "true") filters.disabled = true;
  if (disabled === "false") filters.disabled = false;
  if (assignees.length > 0) filters.assignees = assignees;
  if (daysFromNow) filters.daysFromNow = parseInt(daysFromNow, 10);

  return filters;
}

export default function Manage() {
  const qc = useQueryClient();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
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

  const { data: pointsSummary = [] } = useQuery({
    queryKey: ["points-summary"],
    queryFn: getPointsSummary,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["chores"] });

  const createMut = useMutation({
    mutationFn: createChore,
    onSuccess: () => { invalidate(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateChore(id, data),
    onSuccess: () => { invalidate(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteChore(id),
    onSuccess: () => { invalidate(); setDeleteTarget(null); },
  });

  const completeMut = useMutation({
    mutationFn: (id) => completeChore(id),
    onSuccess: () => { invalidate(); setCompleteTarget(null); },
  });

  const skipMut = useMutation({
    mutationFn: (id) => skipChore(id),
    onSuccess: () => { invalidate(); },
  });

  const markDueMut = useMutation({
    mutationFn: (id) => markDueChore(id),
    onSuccess: () => { invalidate(); },
  });

  const handleFilterChange = useCallback((key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);

      if (key === "assignees") {
        next.delete("assignee");
        if (value && value.length > 0) {
          value.forEach((assignee) => {
            next.append("assignee", assignee);
          });
        }
      } else if (value === undefined || value === "") {
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return chores.filter((chore) => {
      if (filters.schedule_type && chore.schedule_type !== filters.schedule_type) return false;
      if (filters.assignment_type && chore.assignment_type !== filters.assignment_type) return false;
      if (filters.state && chore.state !== filters.state) return false;
      if (filters.disabled !== undefined && chore.disabled !== filters.disabled) return false;
      if (filters.assignees && filters.assignees.length > 0) {
        const matches = filters.assignees.some(
          (filterValue) => choreMatchesAssigneeFilter(chore, filterValue)
        );
        if (!matches) return false;
      }
      if (filters.daysFromNow !== undefined) {
        if (chore.next_due === null) return false;
        const dueDate = new Date(chore.next_due);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
        if (daysUntilDue > filters.daysFromNow) return false;
      }
      return true;
    });
  }, [chores, filters]);

  const sorted = [...filtered].sort(compareChoresByNextDue);

  const scheduleTypes = [...new Set(chores.map(c => c.schedule_type))].sort();
  const assignmentTypes = [...new Set(chores.map(c => c.assignment_type))].sort();
  const assignees = people.map(p => p.name).sort();
  const states = [...new Set(chores.map(c => c.state))].sort();

  const summaryStats = useMemo(() => {
    const totalChores = chores.filter(c => !c.disabled).length;
    const totalPoints = chores.filter(c => !c.disabled).reduce((sum, c) => sum + (c.points || 0), 0);
    const points7d = pointsSummary.reduce((sum, p) => sum + (p.points_7d || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + 7);

    const pointsDueNext7 = chores
      .filter(c => !c.disabled && c.next_due)
      .filter(c => {
        const d = new Date(c.next_due);
        d.setHours(0, 0, 0, 0);
        return d >= today && d <= cutoff;
      })
      .reduce((sum, c) => sum + (c.points || 0), 0);

    return { totalChores, totalPoints, points7d, pointsDueNext7 };
  }, [chores, pointsSummary]);

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

      <div className="chore-stats-grid">
        <div className="chore-stat-card">
          <div className="chore-stat-label">Chores</div>
          <div className="chore-stat-value">{summaryStats.totalChores}</div>
        </div>
        <div className="chore-stat-card">
          <div className="chore-stat-label">Total Points</div>
          <div className="chore-stat-value">{summaryStats.totalPoints}</div>
        </div>
        <div className="chore-stat-card">
          <div className="chore-stat-label">Completed Last 7 Days</div>
          <div className="chore-stat-value">{summaryStats.points7d}</div>
        </div>
        <div className="chore-stat-card">
          <div className="chore-stat-label">Due Next 7 Days</div>
          <div className="chore-stat-value">{summaryStats.pointsDueNext7}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading…</div>
      ) : (
        <>
          {Object.keys(filters).length > 0 && (
            <div className="filter-bar">
              {user && filters.assignees?.length === 2 && Object.keys(filters).length === 1 && (
                <span className="filter-hint">Showing chores assigned to you and unassigned</span>
              )}
              <button className="btn-secondary" onClick={handleClearFilters}>
                Clear filters
              </button>
            </div>
          )}

          {filtersExpanded && (
            <div className="chore-filters">
              <div className="filter-group">
                <label htmlFor="filter-schedule">Schedule type</label>
                <Select
                  id="filter-schedule"
                  value={filters.schedule_type || ""}
                  onChange={(e) => handleFilterChange("schedule_type", e.target.value)}
                  {...SELECT_CONFIG}
                >
                  <MenuItem value="">All types</MenuItem>
                  {scheduleTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </div>

              <div className="filter-group">
                <label htmlFor="filter-assignment">Assignment type</label>
                <Select
                  id="filter-assignment"
                  value={filters.assignment_type || ""}
                  onChange={(e) => handleFilterChange("assignment_type", e.target.value)}
                  {...SELECT_CONFIG}
                >
                  <MenuItem value="">All types</MenuItem>
                  {assignmentTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </div>

              <div className="filter-group">
                <label htmlFor="filter-assignee">Assignee</label>
                <Select
                  id="filter-assignee"
                  multiple
                  value={filters.assignees || []}
                  onChange={(e) => handleFilterChange("assignees", e.target.value)}
                  {...SELECT_CONFIG}
                  sx={{
                    ...SELECT_CONFIG.sx,
                    "& .MuiChip-root": {
                      backgroundColor: "var(--accent-bg)",
                      color: "var(--text)",
                      borderColor: "var(--accent)",
                    },
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={value === UNASSIGNED_FILTER_VALUE ? UNASSIGNED_LABEL : value}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {assignees.map((assignee) => (
                    <MenuItem key={assignee} value={assignee}>
                      {assignee}
                    </MenuItem>
                  ))}
                  <MenuItem value={UNASSIGNED_FILTER_VALUE}>{UNASSIGNED_LABEL}</MenuItem>
                </Select>
              </div>

              <div className="filter-group">
                <label htmlFor="filter-state">State</label>
                <Select
                  id="filter-state"
                  value={filters.state || ""}
                  onChange={(e) => handleFilterChange("state", e.target.value)}
                  {...SELECT_CONFIG}
                >
                  <MenuItem value="">All states</MenuItem>
                  {states.map((state) => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </Select>
              </div>

              <div className="filter-group">
                <label htmlFor="filter-days">Due within</label>
                <Select
                  id="filter-days"
                  value={filters.daysFromNow !== undefined ? String(filters.daysFromNow) : ""}
                  onChange={(e) => {
                    handleFilterChange("daysFromNow", e.target.value ? parseInt(e.target.value, 10) : undefined);
                  }}
                  {...SELECT_CONFIG}
                >
                  <MenuItem value="">All chores</MenuItem>
                  <MenuItem value="0">Today</MenuItem>
                  <MenuItem value="3">Next 3 days</MenuItem>
                  <MenuItem value="7">Next 7 days</MenuItem>
                  <MenuItem value="30">Next 30 days</MenuItem>
                </Select>
              </div>

              <div className="filter-group">
                <label htmlFor="filter-disabled">Status</label>
                <Select
                  id="filter-disabled"
                  value={filters.disabled === undefined ? "" : String(filters.disabled)}
                  onChange={(e) => {
                    handleFilterChange("disabled", e.target.value || undefined);
                  }}
                  {...SELECT_CONFIG}
                >
                  <MenuItem value="">All chores</MenuItem>
                  <MenuItem value="false">Enabled only</MenuItem>
                  <MenuItem value="true">Disabled only</MenuItem>
                </Select>
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
            onComplete={(chore) => {
              completeMut.mutate(chore.id);
            }}
            onSkip={(chore) => skipMut.mutate(chore.id)}
            onMarkDue={(chore) => markDueMut.mutate(chore.id)}
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
            onSaveSuccess={() => setModal(null)}
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
                className="btn-error"
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
