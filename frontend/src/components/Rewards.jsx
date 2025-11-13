// components/Rewards.js
import React from 'react';
import './Rewards.css';

const Rewards = () => {
  return (
    <div className="rewards-container">
      <h2>Hawker Rewards</h2>
      <div className="rewards-card">
        <div className="points-balance">
          <h3>Your Points</h3>
          <div className="points">1,250</div>
          <p>Earn 1 point for every $1 spent</p>
        </div>
        
        <div className="rewards-list">
          <h3>Available Rewards</h3>
          <div className="reward-item">
            <span>Free Drink - 100 points</span>
            <button>Redeem</button>
          </div>
          <div className="reward-item">
            <span>50% Off Main - 200 points</span>
            <button>Redeem</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rewards;