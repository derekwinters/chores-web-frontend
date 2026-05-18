import React, { useState } from "react";
import Modal from "./Modal";

export default function CompleteWithActorModal({ chore, people, onConfirm, onCancel }) {
  const [selected, setSelected] = useState("");

  return (
    <Modal title={`Who completed ${chore.name}?`} onClose={onCancel}>
      <div className="complete-actor-modal">
        <div className="form-group">
          <label htmlFor="actor-select">Select a person</label>
          <select
            id="actor-select"
            aria-label="Select a person"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Select a person…</option>
            {people.map((p) => (
              <option key={p.username} value={p.username}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!selected}
            onClick={() => onConfirm(selected)}
          >
            Complete
          </button>
        </div>
      </div>
    </Modal>
  );
}
