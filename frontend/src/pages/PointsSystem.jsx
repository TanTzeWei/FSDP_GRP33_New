import React, { useState, useContext, useEffect } from 'react';
import { Trophy, Gift, Camera, ThumbsUp, ChevronRight, CheckCircle } from 'lucide-react';
import { PointsContext } from '../context/PointsContext';
import './pointsSystem.css';

const HawkerPointsSystem = () => {
  const [currentScreen, setCurrentScreen] = useState('points');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [redeemed, setRedeemed] = useState(false);
  const [voucherDetails, setVoucherDetails] = useState(null);
  const { userPoints, pointsHistory, redeemVoucher } = useContext(PointsContext);

  // Points Dashboard Screen
  const PointsDashboard = () => (
    <div className="points-container">
      {/* Header */}
      <div className="points-header">
        <div className="points-header-content">
          <h1 className="points-title">My Points</h1>
          <div className="points-card">
            <div className="points-display">
              <div className="points-amount">{userPoints}</div>
              <div className="points-label">Available Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="points-content">
        <div className="points-content-inner">
          <h2 className="points-section-title">Earn Points</h2>
          
          <div className="points-earn-grid">
            {/* Upload Photo Card */}
            <div className="points-earn-card">
              <div className="points-earn-info">
                <div className="points-earn-icon">
                  <Camera className="icon-size" />
                </div>
                <div>
                  <div className="points-earn-title">Upload Photo</div>
                  <div className="points-earn-value">+10 points per photo</div>
                </div>
              </div>
              <ChevronRight className="chevron-icon" />
            </div>

            {/* Receive Upvotes Card */}
            <div className="points-earn-card">
              <div className="points-earn-info">
                <div className="points-earn-icon">
                  <ThumbsUp className="icon-size" />
                </div>
                <div>
                  <div className="points-earn-title">Receive Upvotes</div>
                  <div className="points-earn-value">+5 points per upvote</div>
                </div>
              </div>
              <ChevronRight className="chevron-icon" />
            </div>
          </div>

          {/* Recent Activity */}
          <h2 className="points-section-title">Recent Activity</h2>
          <div className="points-activity-container">
            <div className="points-activity-list">
              {pointsHistory.slice(0, 5).map((activity) => (
                <div key={activity.id} className="points-activity-item">
                  <div className="points-activity-info">
                    {activity.type === 'upload' ? (
                      <Camera className="activity-icon" />
                    ) : (
                      <ThumbsUp className="activity-icon" />
                    )}
                    <div>
                      <div className="activity-title">{activity.description}</div>
                      <div className="activity-subtitle">{activity.item}</div>
                    </div>
                  </div>
                  <div className="activity-points">+{activity.points}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Redeem Button */}
          <div className="points-redeem-container">
            <button 
              onClick={() => setCurrentScreen('rewards')}
              className="points-redeem-btn"
            >
              <Gift className="btn-icon" />
              Browse Rewards
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Rewards Catalog Screen
  const RewardsCatalog = () => (
    <div className="rewards-container">
      {/* Header */}
      <div className="rewards-header">
        <div className="rewards-header-content">
          <button 
            onClick={() => setCurrentScreen('points')}
            className="back-btn"
          >
            ← Back
          </button>
          <h1 className="rewards-title">Rewards</h1>
          <div className="rewards-points-info">
            <Trophy className="trophy-icon" />
            <span>You have {userPoints} points</span>
          </div>
        </div>
      </div>

      {/* Vouchers List */}
      <div className="rewards-content">
        <div className="rewards-content-inner">
          <div className="rewards-grid">
            {/* $3 Voucher */}
            <div className="voucher-card">
              <div className="voucher-content">
                <div className="voucher-header">
                  <div>
                    <div className="voucher-amount">$3 OFF</div>
                    <div className="voucher-condition">Any purchase above $10</div>
                  </div>
                  <div className="voucher-cost">30 pts</div>
                </div>
                <div className="voucher-validity">Valid for 30 days after redemption</div>
                <button 
                  onClick={() => {
                    setSelectedVoucher({ name: '$3 OFF', points: 30, value: 3 });
                    setCurrentScreen('redeem');
                  }}
                  disabled={userPoints < 30}
                  className={`voucher-btn ${userPoints >= 30 ? 'voucher-btn-active' : 'voucher-btn-disabled'}`}
                >
                  {userPoints >= 30 ? 'Redeem Now' : 'Not Enough Points'}
                </button>
              </div>
            </div>

            {/* $5 Voucher */}
            <div className="voucher-card">
              <div className="voucher-content">
                <div className="voucher-header">
                  <div>
                    <div className="voucher-amount">$5 OFF</div>
                    <div className="voucher-condition">Any purchase above $15</div>
                  </div>
                  <div className="voucher-cost">50 pts</div>
                </div>
                <div className="voucher-validity">Valid for 30 days after redemption</div>
                <button 
                  onClick={() => {
                    setSelectedVoucher({ name: '$5 OFF', points: 50, value: 5 });
                    setCurrentScreen('redeem');
                  }}
                  disabled={userPoints < 50}
                  className={`voucher-btn ${userPoints >= 50 ? 'voucher-btn-active' : 'voucher-btn-disabled'}`}
                >
                  {userPoints >= 50 ? 'Redeem Now' : 'Not Enough Points'}
                </button>
              </div>
            </div>

            {/* $10 Voucher */}
            <div className="voucher-card">
              <div className="voucher-content">
                <div className="voucher-header">
                  <div>
                    <div className="voucher-amount">$10 OFF</div>
                    <div className="voucher-condition">Any purchase above $25</div>
                  </div>
                  <div className="voucher-cost">100 pts</div>
                </div>
                <div className="voucher-validity">Valid for 30 days after redemption</div>
                <button 
                  onClick={() => {
                    setSelectedVoucher({ name: '$10 OFF', points: 100, value: 10 });
                    setCurrentScreen('redeem');
                  }}
                  disabled={userPoints < 100}
                  className={`voucher-btn ${userPoints >= 100 ? 'voucher-btn-active' : 'voucher-btn-disabled'}`}
                >
                  {userPoints >= 100 ? 'Redeem Now' : 'Not Enough Points'}
                </button>
              </div>
            </div>

            {/* Free Drink Voucher */}
            <div className="voucher-card">
              <div className="voucher-content">
                <div className="voucher-header">
                  <div>
                    <div className="voucher-amount voucher-amount-drink">FREE DRINK</div>
                    <div className="voucher-condition">Any drink up to $2.50</div>
                  </div>
                  <div className="voucher-cost">20 pts</div>
                </div>
                <div className="voucher-validity">Valid for 30 days after redemption</div>
                <button 
                  onClick={() => {
                    setSelectedVoucher({ name: 'FREE DRINK', points: 20, value: 2.5 });
                    setCurrentScreen('redeem');
                  }}
                  disabled={userPoints < 20}
                  className={`voucher-btn ${userPoints >= 20 ? 'voucher-btn-active' : 'voucher-btn-disabled'}`}
                >
                  {userPoints >= 20 ? 'Redeem Now' : 'Not Enough Points'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Redemption Confirmation Screen
  const RedemptionScreen = () => {
    const handleRedeem = () => {
      console.log('Redeem button clicked');
      console.log('Selected voucher:', selectedVoucher);
      console.log('User points:', userPoints);
      const result = redeemVoucher(selectedVoucher);
      console.log('Redeem result:', result);
      if (result.success) {
        setVoucherDetails(result.voucher);
        setRedeemed(true);
        console.log('Redeemed set to true');
      } else {
        console.log('Redemption failed:', result.message);
      }
    };

    if (redeemed) {
      return (
        <div className="redeem-success-container">
          <div className="redeem-success-content">
            <div className="success-icon-wrapper">
              <CheckCircle className="success-icon" />
            </div>
            <h1 className="success-title">Redeemed Successfully!</h1>
            <p className="success-subtitle">Your voucher is ready to use</p>
            
            <div className="voucher-display">
              <div className="voucher-display-name">{selectedVoucher.name}</div>
              <div className="voucher-display-instruction">Show this code at checkout</div>
              <div className="voucher-code">
                {voucherDetails?.code}
              </div>
              <div className="voucher-expiry">
                Valid until {voucherDetails?.expiryDate.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>

            <button 
              onClick={() => {
                setCurrentScreen('points');
                setRedeemed(false); // Reset for next time
              }}
              className="back-to-points-btn"
            >
              Back to Points
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="redeem-container">
        {/* Header */}
        <div className="redeem-header">
          <div className="redeem-header-content">
            <button 
              onClick={() => setCurrentScreen('rewards')}
              className="back-btn"
            >
              ← Back
            </button>
            <h1 className="redeem-title">Confirm Redemption</h1>
          </div>
        </div>

        {/* Content */}
        <div className="redeem-content">
          <div className="redeem-content-inner">
            <div className="redeem-grid">
              {/* Left Column */}
              <div>
                {/* Voucher Preview */}
                <div className="voucher-preview">
                  <div className="voucher-preview-content">
                    <div className="voucher-preview-name">{selectedVoucher.name}</div>
                    <div className="voucher-preview-condition">
                      Any purchase above ${selectedVoucher.value === 2.5 ? '0' : (selectedVoucher.value * 2.5).toFixed(0)}
                    </div>
                  </div>
                </div>

                {/* Terms - Desktop */}
                <div className="terms-desktop">
                  <div className="terms-content">
                    <div className="terms-title">Terms & Conditions:</div>
                    <ul className="terms-list">
                      <li>Voucher valid for 30 days after redemption</li>
                      <li>Cannot be combined with other offers</li>
                      <li>Non-refundable and non-transferable</li>
                      <li>Valid at all participating hawker stalls</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                {/* Points Summary */}
                <div className="points-summary">
                  <div className="summary-row">
                    <span className="summary-label">Current Points</span>
                    <span className="summary-value">{userPoints} pts</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Cost</span>
                    <span className="summary-value-negative">-{selectedVoucher.points} pts</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-row summary-row-total">
                    <span className="summary-label-bold">Remaining Points</span>
                    <span className="summary-value-remaining">{userPoints - selectedVoucher.points} pts</span>
                  </div>
                </div>

                {/* Terms - Mobile */}
                <div className="terms-mobile">
                  <div className="terms-content">
                    <div className="terms-title">Terms & Conditions:</div>
                    <ul className="terms-list">
                      <li>Voucher valid for 30 days after redemption</li>
                      <li>Cannot be combined with other offers</li>
                      <li>Non-refundable and non-transferable</li>
                      <li>Valid at all participating hawker stalls</li>
                    </ul>
                  </div>
                </div>

                {/* Confirm Button */}
                <button 
                  onClick={handleRedeem}
                  className="confirm-redeem-btn"
                >
                  Confirm Redemption
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Screen Router
  return (
    <div className="hawker-points-system">
      {currentScreen === 'points' && <PointsDashboard />}
      {currentScreen === 'rewards' && <RewardsCatalog />}
      {currentScreen === 'redeem' && <RedemptionScreen />}
    </div>
  );
};

export default HawkerPointsSystem;
