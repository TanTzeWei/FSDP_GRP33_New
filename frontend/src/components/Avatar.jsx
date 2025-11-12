import React from 'react';
import './Avatar.css';

const Avatar = ({ name, size = 40, src, onClick }) => {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  const style = {
    width: size,
    height: size,
    fontSize: size * 0.4,
  };

  if (src) {
    return (
      <div className="avatar" style={style} onClick={onClick}>
        <img src={src} alt={name} className="avatar-image" />
      </div>
    );
  }

  return (
    <div className="avatar avatar-initials" style={style} onClick={onClick}>
      {initials}
    </div>
  );
};

export default Avatar;