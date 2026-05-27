import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MdAdd } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getPeople, createPerson, updatePerson, deletePerson } from "../api/client";
import Toast from "./Toast";
import { useSaveStatus } from "../hooks/useSaveStatus";
import "./UserManagement.css";

export default function UserManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { data: people = [], isLoading } = useQuery({
    queryKey: ["people"],
    queryFn: getPeople,
  });
  const isAdmin = authUser?.is_admin ?? false;

  const [modal, setModal] = useState(null); // null | { mode: "create" } | { mode: "edit", person }
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    goal_7d: 0,
    goal_30d: 0,
    is_admin: false,
    password: "",
  });
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null); // null | { message, variant }
  const { saveStatus, saveBtnClass, triggerSaving, triggerSuccess, triggerError, reset: resetSaveStatus, getCloseDelay } = useSaveStatus();

  const createMutation = useMutation({
    mutationFn: ({ name, password }) => createPerson(name, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      triggerSuccess();
      setError(null);
      setTimeout(() => setModal(null), getCloseDelay());
    },
    onError: (err) => {
      triggerError();
      setToast({ message: err.message || "Failed to create user", variant: "error" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePerson(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      triggerSuccess();
      setError(null);
      setTimeout(() => setModal(null), getCloseDelay());
    },
    onError: (err) => {
      triggerError();
      setToast({ message: err.message || "Failed to update user", variant: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePerson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Failed to delete user");
    },
  });

  const handleOpenCreateDialog = () => {
    setEditForm({
      name: "",
      username: "",
      goal_7d: 0,
      goal_30d: 0,
      is_admin: false,
      password: "",
    });
    setError(null);
    resetSaveStatus();
    setModal({ mode: "create" });
  };

  const handleOpenEditDialog = (person) => {
    setEditForm({
      name: person.name,
      username: person.username,
      goal_7d: person.goal_7d,
      goal_30d: person.goal_30d,
      is_admin: person.is_admin,
      password: "",
    });
    setError(null);
    resetSaveStatus();
    setModal({ mode: "edit", person });
  };

  const handleCloseDialog = () => {
    setModal(null);
    setEditForm({ name: "", username: "", goal_7d: 0, goal_30d: 0, is_admin: false, password: "" });
    setError(null);
  };

  const handleSaveForm = () => {
    if (!editForm.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!editForm.username.trim()) {
      setError("Username is required");
      return;
    }

    triggerSaving();
    if (modal.mode === "create") {
      createMutation.mutate({
        name: editForm.name.trim(),
        password: editForm.password,
      });
    } else {
      const updates = {
        name: editForm.name,
        username: editForm.username,
        goal_7d: editForm.goal_7d,
        goal_30d: editForm.goal_30d,
        is_admin: editForm.is_admin,
      };
      if (editForm.password?.trim()) {
        updates.password = editForm.password.trim();
      }
      updateMutation.mutate({ id: modal.person.id, data: updates });
    }
  };

  const handleDeleteUser = (id, name) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="loading">Loading users…</div>;

  const uniquePeople = Array.from(new Map(people.map(p => [p.name, p])).values());
  const admins = uniquePeople.filter(p => p.is_admin);
  const regularUsers = uniquePeople.filter(p => !p.is_admin);

  const renderUserCards = (users) => (
    <>
      {users.map((person) => (
          <div key={person.name} className="admin-user-card">
            <div className="user-header">
              <div className="user-info">
                <div
                  className="user-avatar"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {person.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <span className="user-name">{person.name}</span>
                  <span className={`user-role-pill ${person.is_admin ? "admin" : "member"}`}>
                    {person.is_admin ? "Admin" : "Member"}
                  </span>
                </div>
              </div>
            </div>
            {isAdmin && (
              <div className="user-actions">
                <button
                  className="user-action-link"
                  onClick={() => handleOpenEditDialog(person)}
                >
                  Edit
                </button>
                <button
                  className="user-action-link"
                  onClick={() => navigate(`/log?person=${encodeURIComponent(person.name)}`)}
                >
                  History
                </button>
                <button
                  className="user-action-link user-action-delete"
                  onClick={() => handleDeleteUser(person.id, person.name)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </>
    );

  return (
    <div className="user-management">
      <div className="page-header">
        <h2>Manage Users</h2>
        {isAdmin && (
          <button className="btn-primary" onClick={handleOpenCreateDialog} title="Add user">
            <MdAdd className="action-icon" />
            <span className="action-text">Add User</span>
          </button>
        )}
      </div>

      {uniquePeople.length === 0 && !modal && (
        <div className="empty-state">
          <p>No users yet. Add one to get started!</p>
        </div>
      )}

      {admins.length > 0 && (
        <div className="users-section">
          <h3 className="section-header">Administrators</h3>
          <div className="users-list">
            {renderUserCards(admins)}
          </div>
        </div>
      )}

      {admins.length === 0 && regularUsers.length > 0 && (
        <div className="users-section">
          <h3 className="section-header">Administrators</h3>
          <div className="empty-section">No administrators</div>
        </div>
      )}

      {regularUsers.length > 0 && (
        <div className="users-section">
          <h3 className="section-header">Members</h3>
          <div className="users-list">
            {renderUserCards(regularUsers)}
          </div>
        </div>
      )}

      {regularUsers.length === 0 && admins.length > 0 && (
        <div className="users-section">
          <h3 className="section-header">Members</h3>
          <div className="empty-section">No members</div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={handleCloseDialog}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal.mode === "create" ? "Add User" : "Edit User"}</h2>
              <button
                className="modal-close"
                onClick={handleCloseDialog}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}

              <div className="edit-user-form">
                <div className="form-row">
                  <label htmlFor="edit-display-name">Display Name</label>
                  <input
                    id="edit-display-name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="edit-username">Username</label>
                  <input
                    id="edit-username"
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  />
                </div>

                {modal.mode === "edit" && (
                  <>
                    <div className="form-row">
                      <label htmlFor="edit-goal-7d">7-day goal</label>
                      <input
                        id="edit-goal-7d"
                        type="number"
                        value={editForm.goal_7d}
                        onChange={(e) => setEditForm({ ...editForm, goal_7d: parseInt(e.target.value, 10) })}
                        disabled={updateMutation.isPending}
                        min="0"
                      />
                    </div>

                    <div className="form-row">
                      <label htmlFor="edit-goal-30d">30-day goal</label>
                      <input
                        id="edit-goal-30d"
                        type="number"
                        value={editForm.goal_30d}
                        onChange={(e) => setEditForm({ ...editForm, goal_30d: parseInt(e.target.value, 10) })}
                        disabled={updateMutation.isPending}
                        min="0"
                      />
                    </div>
                  </>
                )}

                <div className="form-row">
                  <label htmlFor="edit-password">{modal.mode === "create" ? "Password" : "Change Password (optional)"}</label>
                  <input
                    id="edit-password"
                    type="password"
                    placeholder={modal.mode === "create" ? "Enter password" : "Leave empty to keep current"}
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  />
                </div>

                {modal.mode === "edit" && (
                  <div className="form-row">
                    <label htmlFor="edit-admin">
                      <input
                        id="edit-admin"
                        type="checkbox"
                        checked={editForm.is_admin}
                        onChange={(e) => setEditForm({ ...editForm, is_admin: e.target.checked })}
                        disabled={updateMutation.isPending || people.length === 1}
                        title={people.length === 1 ? "First user must be admin" : ""}
                      />
                      {" "}Administrator
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={handleCloseDialog}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </button>
              <button
                className={saveBtnClass}
                onClick={handleSaveForm}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {saveStatus === "saving" ? "Saving…" : saveStatus === "success" ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
