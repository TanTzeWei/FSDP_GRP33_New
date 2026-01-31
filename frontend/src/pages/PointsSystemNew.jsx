import React, { useState, useContext, useEffect } from 'react';
import { Trophy, Gift, Camera, ThumbsUp, ChevronRight, CheckCircle, Sparkles, Ticket, Clock, UserPlus, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PointsContext } from '../context/PointsContext';
import Header from '../components/Header';
import * as pointsService from '../services/pointsService';
import './pointsSystemNew.css';

const HawkerPointsSystem = () => {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [redeemed, setRedeemed] = useState(false);
  const [voucherDetails, setVoucherDetails] = useState(null);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [myVouchers, setMyVouchers] = useState([]);
  const [loadingMyVouchers, setLoadingMyVouchers] = useState(false);
  const [referralInfo, setReferralInfo] = useState(null);
  const [referralCopied, setReferralCopied] = useState(false);
  const { userPoints, pointsHistory, redeemVoucher, fetchPointsData } = useContext(PointsContext);

  // Fetch data on mount and screen changes
  useEffect(() => {
    fetchVouchers();
    fetchMyVouchers();
    fetchReferralInfo();
    if (fetchPointsData) {
      fetchPointsData();
    }
  }, [currentScreen]);

  const fetchReferralInfo = async () => {
    try {
      const result = await pointsService.getReferralInfo();
      if (result.success) setReferralInfo(result);
    } catch (error) {
      console.error('Error fetching referral info:', error);
    }
  };

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

  const fetchMyVouchers = async () => {
    try {
      setLoadingMyVouchers(true);
      const result = await pointsService.getRedeemedVouchers();
      if (result.success) {
        setMyVouchers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching my vouchers:', error);
    } finally {
      setLoadingMyVouchers(false);
    }
  };

  // Main Dashboard Screen
  const Dashboard = () => (
    <div className="rewards-dashboard">
      {/* Hero Section with Points */}
      <div className="rewards-hero">
        <div className="rewards-hero-content">
          <div className="hero-badge">
            <Sparkles className="hero-badge-icon" />
            <span>Rewards Program</span>
          </div>
          <h1 className="hero-title">Your Points Balance</h1>
          <div className="points-display-large">
            <div className="points-number">{userPoints}</div>
            <div className="points-label">Points</div>
          </div>
          
          {/* Quick Actions */}
          <div className="quick-actions">
            <button 
              onClick={() => setCurrentScreen('catalog')}
              className="action-btn action-btn-primary"
            >
              <Gift className="btn-icon" />
              Browse Vouchers
            </button>
            <button 
              onClick={() => setCurrentScreen('my-vouchers')}
              className="action-btn action-btn-secondary"
            >
              <Ticket className="btn-icon" />
              My Vouchers
            </button>
          </div>
        </div>
      </div>

      {/* How to Earn Section */}
      <div className="dashboard-content">
        <div className="content-section">
          <h2 className="section-heading">
            <Sparkles className="heading-icon" />
            Ways to Earn Points
          </h2>
          
          <div className="earn-cards-grid">
            <div className="earn-card">
              <div className="earn-card-icon earn-card-icon-upload">
                <Camera />
              </div>
              <div className="earn-card-content">
                <h3 className="earn-card-title">Upload Photos</h3>
                <p className="earn-card-description">Share your favorite dishes</p>
                <div className="earn-card-points">+10 points</div>
              </div>
            </div>

            <div className="earn-card">
              <div className="earn-card-icon earn-card-icon-upvote">
                <ThumbsUp />
              </div>
              <div className="earn-card-content">
                <h3 className="earn-card-title">Get Upvotes</h3>
                <p className="earn-card-description">Receive likes on your photos</p>
                <div className="earn-card-points">+5 points</div>
              </div>
            </div>

            <div className="earn-card">
              <div className="earn-card-icon earn-card-icon-referral">
                <UserPlus />
              </div>
              <div className="earn-card-content">
                <h3 className="earn-card-title">Invite Friends</h3>
                <p className="earn-card-description">Share your code — you both get points</p>
                <div className="earn-card-points">+25 pts each</div>
              </div>
            </div>
          </div>

          {/* Referral code & link */}
          {referralInfo?.referralCode && (
            <div className="referral-section">
              <h2 className="section-heading">
                <UserPlus className="heading-icon" />
                Your Referral Code
              </h2>
              <div className="referral-code-box">
                <div className="referral-code-value">{referralInfo.referralCode}</div>
                <button
                  type="button"
                  className="referral-copy-btn"
                  onClick={() => {
                    const text = referralInfo.referralLink || referralInfo.referralCode;
                    navigator.clipboard?.writeText(text).then(() => {
                      setReferralCopied(true);
                      setTimeout(() => setReferralCopied(false), 2000);
                    });
                  }}
                >
                  {referralCopied ? <Check size={18} /> : <Copy size={18} />}
                  {referralCopied ? ' Copied!' : ' Copy link'}
                </button>
              </div>
              {referralInfo.totalReferrals > 0 && (
                <p className="referral-stats">You&apos;ve referred {referralInfo.totalReferrals} friend{referralInfo.totalReferrals !== 1 ? 's' : ''}</p>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {pointsHistory && pointsHistory.length > 0 && (
          <div className="content-section">
            <h2 className="section-heading">
              <Clock className="heading-icon" />
              Recent Activity
            </h2>
            
            <div className="activity-list">
              {pointsHistory.slice(0, 5).map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon-wrapper">
                    {activity.type === 'upload' ? (
                      <Camera className="activity-icon" />
                    ) : activity.type === 'upvote' ? (
                      <ThumbsUp className="activity-icon" />
                    ) : activity.type === 'referral' ? (
                      <UserPlus className="activity-icon" />
                    ) : (
                      <Gift className="activity-icon" />
                    )}
                  </div>
                  <div className="activity-details">
                    <div className="activity-title">{activity.description}</div>
                    <div className="activity-subtitle">{activity.item}</div>
                  </div>
                  <div className={`activity-points ${activity.points < 0 ? 'activity-points-negative' : ''}`}>
                    {activity.points > 0 ? '+' : ''}{activity.points}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Voucher Catalog Screen
  const VoucherCatalog = () => (
    <div className="voucher-catalog">
      {/* Header */}
      <div className="catalog-header">
        <button onClick={() => setCurrentScreen('dashboard')} className="back-link">
          ← Back to Dashboard
        </button>
        <div className="catalog-title-section">
          <h1 className="catalog-title">Rewards Catalog</h1>
          <div className="catalog-points-badge">
            <Trophy className="badge-icon" />
            {userPoints} points available
          </div>
        </div>
      </div>

      {/* Vouchers Grid */}
      <div className="catalog-content">
        {loadingVouchers ? (
          <div className="loading-state">Loading vouchers...</div>
        ) : availableVouchers.length === 0 ? (
          <div className="empty-state">
            <Gift className="empty-icon" />
            <h3>No vouchers available</h3>
            <p>Check back soon for exciting rewards!</p>
          </div>
        ) : (
          <div className="vouchers-grid">
            {availableVouchers.map((voucher) => {
              const canAfford = userPoints >= voucher.points_required;
              
              return (
                <div key={voucher.id} className={`voucher-item ${!canAfford ? 'voucher-item-locked' : ''}`}>
                  <div className="voucher-ribbon">
                    <Ticket className="ribbon-icon" />
                  </div>
                  
                  <div className="voucher-body">
                    <div className="voucher-value">
                      {voucher.name}
                    </div>
                    <div className="voucher-description">
                      {voucher.description}
                    </div>
                    
                    <div className="voucher-meta">
                      <div className="voucher-meta-item">
                        <span className="meta-label">Points</span>
                        <span className="meta-value">{voucher.points_required}</span>
                      </div>
                      <div className="voucher-meta-item">
                        <span className="meta-label">Valid</span>
                        <span className="meta-value">{voucher.validity_days} days</span>
                      </div>
                    </div>

                    {voucher.minimum_purchase > 0 && (
                      <div className="voucher-requirement">
                        Min. purchase: ${voucher.minimum_purchase.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (canAfford) {
                        setSelectedVoucher({
                          id: voucher.id,
                          name: voucher.name,
                          points: voucher.points_required,
                          value: voucher.discount_value,
                          minPurchase: voucher.minimum_purchase,
                          validityDays: voucher.validity_days,
                          description: voucher.description
                        });
                        setCurrentScreen('redeem');
                      }
                    }}
                    disabled={!canAfford}
                    className={`voucher-redeem-btn ${canAfford ? 'voucher-redeem-btn-enabled' : 'voucher-redeem-btn-disabled'}`}
                  >
                    {canAfford ? 'Redeem Now' : `Need ${voucher.points_required - userPoints} more points`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // My Vouchers Screen
  const MyVouchersScreen = () => {
    const activeVouchers = myVouchers.filter(v => !v.is_used && new Date(v.expiry_date) > new Date());
    const usedOrExpiredVouchers = myVouchers.filter(v => v.is_used || new Date(v.expiry_date) <= new Date());

    return (
      <div className="my-vouchers">
        {/* Header */}
        <div className="my-vouchers-header">
          <button onClick={() => setCurrentScreen('dashboard')} className="back-link">
            ← Back to Dashboard
          </button>
          <h1 className="my-vouchers-title">My Vouchers</h1>
        </div>

        {/* Content */}
        <div className="my-vouchers-content">
          {loadingMyVouchers ? (
            <div className="loading-state">Loading your vouchers...</div>
          ) : myVouchers.length === 0 ? (
            <div className="empty-state">
              <Ticket className="empty-icon" />
              <h3>No vouchers yet</h3>
              <p>Redeem vouchers from the catalog to see them here</p>
              <button onClick={() => setCurrentScreen('catalog')} className="empty-action-btn">
                Browse Vouchers
              </button>
            </div>
          ) : (
            <>
              {/* Active Vouchers */}
              {activeVouchers.length > 0 && (
                <div className="vouchers-section">
                  <h2 className="vouchers-section-title">Active Vouchers ({activeVouchers.length})</h2>
                  <div className="my-vouchers-grid">
                    {activeVouchers.map((voucher) => (
                      <div key={voucher.id} className="my-voucher-card my-voucher-card-active">
                        <div className="my-voucher-header">
                          <div className="my-voucher-badge">Active</div>
                        </div>
                        <div className="my-voucher-body">
                          <div className="my-voucher-name">{voucher.vouchers?.name || 'Voucher'}</div>
                          <div className="my-voucher-desc">{voucher.vouchers?.description}</div>
                          <div className="voucher-code-section">
                            <div className="voucher-code-label">Voucher Code</div>
                            <div className="voucher-code">{voucher.voucher_code}</div>
                          </div>
                          <div className="my-voucher-expiry">
                            Expires: {new Date(voucher.expiry_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        <div className="my-voucher-footer">
                          <span className="voucher-use-hint">Use during checkout</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Used/Expired Vouchers */}
              {usedOrExpiredVouchers.length > 0 && (
                <div className="vouchers-section">
                  <h2 className="vouchers-section-title">Past Vouchers ({usedOrExpiredVouchers.length})</h2>
                  <div className="my-vouchers-grid">
                    {usedOrExpiredVouchers.map((voucher) => (
                      <div key={voucher.id} className="my-voucher-card my-voucher-card-inactive">
                        <div className="my-voucher-header">
                          <div className="my-voucher-badge my-voucher-badge-used">
                            {voucher.is_used ? 'Used' : 'Expired'}
                          </div>
                        </div>
                        <div className="my-voucher-body">
                          <div className="my-voucher-name">{voucher.vouchers?.name || 'Voucher'}</div>
                          <div className="my-voucher-desc">{voucher.vouchers?.description}</div>
                          <div className="voucher-code-section">
                            <div className="voucher-code-label">Voucher Code</div>
                            <div className="voucher-code voucher-code-inactive">{voucher.voucher_code}</div>
                          </div>
                          {voucher.is_used && voucher.used_date && (
                            <div className="my-voucher-used-date">
                              Used on: {new Date(voucher.used_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Redemption Confirmation Screen
  const RedemptionScreen = () => {
    const [redeeming, setRedeeming] = useState(false);
    const [redemptionError, setRedemptionError] = useState(null);

    const handleRedeem = async () => {
      try {
        setRedeeming(true);
        setRedemptionError(null);
        
        const result = await redeemVoucher(selectedVoucher);
        
        if (result.success) {
          setVoucherDetails(result.voucher);
          setRedeemed(true);
          fetchMyVouchers(); // Refresh vouchers list
        } else {
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
        <div className="redeem-success">
          <div className="redeem-success-content">
            <div className="success-icon-large">
              <CheckCircle />
            </div>
            <h1 className="success-title">Voucher Redeemed!</h1>
            <p className="success-message">Your voucher is ready to use at checkout</p>
            
            <div className="voucher-success-card">
              <div className="voucher-success-name">{selectedVoucher.name}</div>
              <div className="voucher-code-display">
                <div className="code-label">Your Code</div>
                <div className="code-value">{voucherDetails?.code}</div>
              </div>
              <div className="voucher-success-expiry">
                Valid until {voucherDetails?.expiryDate && new Date(voucherDetails.expiryDate).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>
            </div>

            <div className="success-actions">
              <button onClick={() => {
                setCurrentScreen('my-vouchers');
                setRedeemed(false);
              }} className="btn-success-primary">
                View My Vouchers
              </button>
              <button onClick={() => {
                setCurrentScreen('dashboard');
                setRedeemed(false);
              }} className="btn-success-secondary">
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="redeem-confirmation">
        <div className="redeem-confirm-content">
          <button onClick={() => setCurrentScreen('catalog')} className="back-link">
            ← Back to Catalog
          </button>
          
          <h1 className="confirm-title">Confirm Redemption</h1>

          <div className="confirm-layout">
            {/* Voucher Preview */}
            <div className="confirm-voucher-preview">
              <div className="preview-badge">
                <Ticket className="preview-badge-icon" />
                Redeeming
              </div>
              <div className="preview-name">{selectedVoucher.name}</div>
              <div className="preview-description">{selectedVoucher.description}</div>
              {selectedVoucher.minPurchase > 0 && (
                <div className="preview-requirement">
                  Minimum purchase: ${selectedVoucher.minPurchase.toFixed(2)}
                </div>
              )}
            </div>

            {/* Points Summary */}
            <div className="confirm-summary">
              <div className="summary-box">
                <div className="summary-item">
                  <span className="summary-label">Current Balance</span>
                  <span className="summary-value">{userPoints} pts</span>
                </div>
                <div className="summary-item summary-item-cost">
                  <span className="summary-label">Redemption Cost</span>
                  <span className="summary-value summary-value-red">-{selectedVoucher.points} pts</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-item summary-item-total">
                  <span className="summary-label-bold">New Balance</span>
                  <span className="summary-value-green">{userPoints - selectedVoucher.points} pts</span>
                </div>
              </div>

              {redemptionError && (
                <div className="error-alert">{redemptionError}</div>
              )}

              <button 
                onClick={handleRedeem}
                disabled={redeeming}
                className="confirm-redeem-button"
              >
                {redeeming ? 'Redeeming...' : `Redeem for ${selectedVoucher.points} Points`}
              </button>
            </div>
          </div>

          {/* Terms */}
          <div className="confirm-terms">
            <h3 className="terms-heading">Terms & Conditions</h3>
            <ul className="terms-list">
              <li>Voucher valid for {selectedVoucher.validityDays} days after redemption</li>
              <li>Cannot be combined with other offers</li>
              <li>Non-refundable and non-transferable</li>
              <li>Valid at all participating hawker stalls</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Screen Router
  return (
    <div className="hawker-rewards-system">
      <Header
        activeSection="rewards"
        setActiveSection={() => {}}
        onCartClick={() => navigate('/cart')}
      />
      
      {currentScreen === 'dashboard' && <Dashboard />}
      {currentScreen === 'catalog' && <VoucherCatalog />}
      {currentScreen === 'my-vouchers' && <MyVouchersScreen />}
      {currentScreen === 'redeem' && <RedemptionScreen />}
    </div>
  );
};

export default HawkerPointsSystem;
