import React, { useState, useContext, useEffect } from 'react';
import { Trophy, Gift, Camera, ThumbsUp, ChevronRight, CheckCircle } from 'lucide-react';
import { PointsContext } from '../context/PointsContext';
import * as pointsService from '../services/pointsService';
import './pointsSystem.css';

const HawkerPointsSystem = () => {
  const [currentScreen, setCurrentScreen] = useState('points');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [redeemed, setRedeemed] = useState(false);
  const [voucherDetails, setVoucherDetails] = useState(null);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const { userPoints, pointsHistory, redeemVoucher } = useContext(PointsContext);

  // Fetch available vouchers on component mount
  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoadingVouchers(true);
      const result = await pointsService.getAllVouchers();
      if (result.success) {
        setAvailableVouchers(result.data);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoadingVouchers(false);
    }
  };

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
          {loadingVouchers ? (
            <div className="loading-message">Loading vouchers...</div>
          ) : availableVouchers.length === 0 ? (
            <div className="no-vouchers-message">No vouchers available at the moment</div>
          ) : (
            <div className="rewards-grid">
              {availableVouchers.map((voucher) => (
                <div key={voucher.id} className="voucher-card">
                  <div className="voucher-content">
                    <div className="voucher-header">
                      <div>
                        <div className={`voucher-amount ${voucher.voucher_type === 'free_item' ? 'voucher-amount-drink' : ''}`}>
                          {voucher.name}
                        </div>
                        <div className="voucher-condition">{voucher.description}</div>
                      </div>
                      <div className="voucher-cost">{voucher.points_required} pts</div>
                    </div>
                    <div className="voucher-validity">Valid for {voucher.validity_days} days after redemption</div>
                    <button 
                      onClick={() => {
                        setSelectedVoucher({
                          id: voucher.id,
                          name: voucher.name,
                          points: voucher.points_required,
                          value: voucher.discount_value,
                          minPurchase: voucher.minimum_purchase
                        });
                        setCurrentScreen('redeem');
                      }}
                      disabled={userPoints < voucher.points_required}
                      className={`voucher-btn ${userPoints >= voucher.points_required ? 'voucher-btn-active' : 'voucher-btn-disabled'}`}
                    >
                      {userPoints >= voucher.points_required ? 'Redeem Now' : 'Not Enough Points'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Redemption Confirmation Screen
  const RedemptionScreen = () => {
    const [redeeming, setRedeeming] = useState(false);
    const [redemptionError, setRedemptionError] = useState(null);

    const handleRedeem = async () => {
      try {
        setRedeeming(true);
        setRedemptionError(null);
        console.log('Redeem button clicked');
        console.log('Selected voucher:', selectedVoucher);
        console.log('User points:', userPoints);
        
        const result = await redeemVoucher(selectedVoucher);
        console.log('Redeem result:', result);
        
        if (result.success) {
          setVoucherDetails(result.voucher);
          setRedeemed(true);
          console.log('Redeemed set to true');
        } else {
          console.log('Redemption failed:', result.message);
          setRedemptionError(result.message || 'Failed to redeem voucher');
        }
      } catch (error) {
        console.error('Redemption error:', error);
        setRedemptionError('An error occurred while redeeming the voucher');
      } finally {
        setRedeeming(false);
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
                      {selectedVoucher.minPurchase > 0 
                        ? `Any purchase above $${selectedVoucher.minPurchase.toFixed(2)}`
                        : 'No minimum purchase required'}
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
                {redemptionError && (
                  <div className="error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
                    {redemptionError}
                  </div>
                )}
                <button 
                  onClick={handleRedeem}
                  disabled={redeeming}
                  className="confirm-redeem-btn"
                >
                  {redeeming ? 'Redeeming...' : 'Confirm Redemption'}
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
