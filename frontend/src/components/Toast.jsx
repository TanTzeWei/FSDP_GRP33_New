import React from "react";
import "./Toast.css";

export default function Toast({ toast, onClose }) {
  const { message, type = "info" } = toast;
  return (
    <div className={`toast ${type}`}>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose} aria-label="Close">
        ×
      </button>
    </div>
  );
}
