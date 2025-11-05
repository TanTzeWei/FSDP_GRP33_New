import React from "react";
import "./Avatar.css";

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, size = 36 }) {
  const text = initials(name);
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: Math.round(size / 2.5) }}>
      {text}
    </div>
  );
}
