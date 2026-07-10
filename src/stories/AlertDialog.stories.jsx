import React from "react";
import Modal from "../components/Modal";
import "../pages/Chores.css";

// Dialog/Modal contract (mapping matrix): size.modal-max, radius.md,
// color.overlay backdrop, surface-contrast header without divider;
// destructive confirms use the error-tinted confirm action. The markup is
// the real delete-confirmation modal from pages/Chores.jsx. Pairs with the
// Android golden alertdialog_deleteconfirm_<theme>.png.

export default {
  title: "AlertDialog",
  parameters: { layout: "fullscreen" },
};

const noop = () => {};

export const DeleteConfirm = {
  render: () => (
    <div style={{ height: "100vh" }}>
      <Modal title="Delete chore?" onClose={noop}>
        <div className="confirm-delete">
          <p>
            Delete <strong>Take out trash</strong>? This also removes all points history for this
            chore and cannot be undone.
          </p>
          <div className="confirm-actions">
            <button className="btn-secondary" onClick={noop}>
              Cancel
            </button>
            <button className="btn-error" onClick={noop}>
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  ),
};
