import React, { useContext, useState, useEffect } from "react";
import { ArrowLeft, Trash2, ShoppingBag, Tag, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CartContext } from '../context/CartContext';
import Header from '../components/Header';
import * as pointsService from '../services/pointsService';
import "./CartPage.css";

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart } = useContext(CartContext);
  const [myVouchers, setMyVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  // Fetch user's redeemed vouchers
  useEffect(() => {
    fetchMyVouchers();
  }, []);

  const fetchMyVouchers = async () => {
    try {
      setLoadingVouchers(true);
      const result = await pointsService.getRedeemedVouchers();
      if (result.success) {
        // Filter only active (unused and not expired) vouchers
        const activeVouchers = (result.data || []).filter(
          v => !v.is_used && new Date(v.expiry_date) > new Date()
        );
        setMyVouchers(activeVouchers);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const isDemo = !cartItems || cartItems.length === 0;
  const itemsToRender = cartItems;

  const getSubtotal = () =>
    (itemsToRender || []).reduce((sum, i) => sum + (parseFloat(i.price) || 0) * (i.quantity || 0), 0);

  const getOriginalSubtotal = () =>
    (itemsToRender || []).reduce((sum, i) => sum + (i.originalPrice ? parseFloat(i.originalPrice) : parseFloat(i.price) || 0) * (i.quantity || 0), 0);

  const getTotalSavings = () => getOriginalSubtotal() - getSubtotal();

  // Calculate voucher discount
  const getVoucherDiscount = () => {
    if (!selectedVoucher) return 0;
    
    const subtotal = getSubtotal();
    const voucherData = selectedVoucher.vouchers || selectedVoucher;
    const minPurchase = voucherData.minimum_purchase || 0;
    
    // Check if subtotal meets minimum purchase requirement
    if (subtotal < minPurchase) {
      return 0;
    }
    
    // For discount type vouchers, return the discount value
    if (voucherData.voucher_type === 'discount') {
      return Math.min(parseFloat(voucherData.discount_value || 0), subtotal);
    }
    
    return 0;
  };

  // Calculate final total
  const getFinalTotal = () => {
    return Math.max(0, getSubtotal() - getVoucherDiscount());
  };

  // Check if voucher can be applied
  const canApplyVoucher = (voucher) => {
    const subtotal = getSubtotal();
    const voucherData = voucher.vouchers || voucher;
    const minPurchase = voucherData.minimum_purchase || 0;
    return subtotal >= minPurchase;
  };

  // Handle voucher selection
  const handleSelectVoucher = (voucher) => {
    if (canApplyVoucher(voucher)) {
      setSelectedVoucher(voucher);
      setShowVoucherModal(false);
    }
  };

  // Handle remove voucher
  const handleRemoveVoucher = () => {
    setSelectedVoucher(null);
  };

  return (
    <main className="cart-page">

      {/* HEADER */}
      <Header
        activeSection="menu"
        setActiveSection={() => {}}
        onCartClick={() => navigate('/cart')}
      />

      {/* LEGACY HEADER - can be removed */}
      <header className="cart-header">
        <nav className="cart-nav">
          <button 
            className="back-button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="back-icon" />
          </button>

          <h1 className="cart-title">Your Cart</h1>

          <span className="cart-count">
            {(cartItems || []).length} items
          </span>
        </nav>
      </header>

      {/* EMPTY STATE */}
      {isDemo && (
        <section className="empty-cart-section">
          <div className="empty-cart-message">
            <ShoppingBag className="empty-cart-icon" />
            <h2>Your cart is empty</h2>
            <p>Add items from the menu to get started</p>
            <button 
              className="continue-shopping-button"
              onClick={() => navigate('/')}
            >
              Continue Shopping
            </button>
          </div>
        </section>
      )}

      {/* MAIN CONTENT */}
      {(itemsToRender && itemsToRender.length > 0) && (
        <section className="cart-content">

          {/* ITEMS */}
          <div className="cart-items-section">
            <h2 className="section-title">Items</h2>

            <ul className="cart-items-list">
              {(itemsToRender || []).map((item) => (
                <li key={item.id} className="cart-item">

                  <div className="cart-item-content">

                    <div className="cart-item-image-wrapper">
                      <img src={item.image} className="cart-item-image" />
                    </div>

                    <div className="cart-item-details">
                      <div className="cart-item-header">
                        <div className="item-info">
                          <h3 className="item-name">{item.name}</h3>
                          <p className="item-stall">{item.stallName}</p>
                          <div className="item-pricing">
                            {item.originalPrice ? (
                              <>
                                <p className="item-price original-price">${item.originalPrice.toFixed(2)}</p>
                                <p className="item-price discounted-price">${item.price.toFixed(2)}</p>
                              </>
                            ) : (
                              <p className="item-price">${item.price.toFixed(2)}</p>
                            )}
                          </div>
                        </div>

                        <button
                          className="remove-button"
                          onClick={() => removeFromCart(item.id)}
                          title='Remove item'
                        >
                          <Trash2 className="remove-icon" />
                        </button>
                      </div>

                      <div className="quantity-controls">
                        <button
                          className="quantity-button"
                          onClick={() => updateQuantity(item.id, (item.quantity || 0) - 1)}
                        >
                          −
                        </button>

                        <span className="quantity-display">
                          {item.quantity}
                        </span>

                        <button
                          className="quantity-button"
                          onClick={() => updateQuantity(item.id, (item.quantity || 0) + 1)}
                        >
                          +
                        </button>
                      </div>

                      <p className="item-total">
                        Total:{" "}
                        <strong>
                          ${(item.price * item.quantity).toFixed(2)}
                        </strong>
                      </p>
                    </div>
                  </div>

                </li>
              ))}
            </ul>
          </div>

          {/* SUMMARY */}
          <aside className="order-summary">
            <h2 className="summary-title">Order Summary</h2>

            <div className="price-breakdown">
              <div className="price-row">
                <span className="price-label">Subtotal</span>
                <div className="price-values">
                  {getTotalSavings() > 0 ? (
                    <>
                      <span className="price-value original-price">${getOriginalSubtotal().toFixed(2)}</span>
                      <span className="price-value discounted-price">${getSubtotal().toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="price-value">${getSubtotal().toFixed(2)}</span>
                  )}
                </div>
              </div>

              {getTotalSavings() > 0 && (
                <div className="price-row savings-row">
                  <span className="price-label savings-label">You save</span>
                  <span className="savings-value">-${getTotalSavings().toFixed(2)}</span>
                </div>
              )}

              {/* Voucher Section */}
              <div className="voucher-section">
                {selectedVoucher ? (
                  <div className="applied-voucher">
                    <div className="applied-voucher-header">
                      <div className="applied-voucher-info">
                        <Tag className="voucher-tag-icon" />
                        <div>
                          <div className="applied-voucher-name">
                            {selectedVoucher.vouchers?.name || 'Voucher'}
                          </div>
                          <div className="applied-voucher-code">
                            {selectedVoucher.voucher_code}
                          </div>
                        </div>
                      </div>
                      <button 
                        className="remove-voucher-btn"
                        onClick={handleRemoveVoucher}
                        title="Remove voucher"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="price-row voucher-discount-row">
                      <span className="price-label">Voucher Discount</span>
                      <span className="savings-value">-${getVoucherDiscount().toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <button 
                    className="apply-voucher-btn"
                    onClick={() => setShowVoucherModal(true)}
                    disabled={myVouchers.length === 0}
                  >
                    <Tag size={18} />
                    {myVouchers.length > 0 ? 'Apply Voucher' : 'No vouchers available'}
                  </button>
                )}
              </div>

              <hr className="price-divider" />

              <div className="price-row total-row">
                <span className="total-label">Total</span>
                <span className="total-value">
                  ${getFinalTotal().toFixed(2)}
                </span>
              </div>

              <button className="checkout-button" onClick={() => {
                // Store selected voucher info in localStorage for use after payment
                if (selectedVoucher) {
                  localStorage.setItem('selectedVoucherCode', selectedVoucher.voucher_code);
                }
                navigate('/nets-qr', { state: { amount: getFinalTotal() } });
              }}>
                Proceed to Checkout
              </button>
            </div>
          </aside>
        </section>
      )}

      {/* Voucher Selection Modal */}
      {showVoucherModal && (
        <div className="voucher-modal-overlay" onClick={() => setShowVoucherModal(false)}>
          <div className="voucher-modal" onClick={(e) => e.stopPropagation()}>
            <div className="voucher-modal-header">
              <h2 className="voucher-modal-title">Select a Voucher</h2>
              <button 
                className="voucher-modal-close"
                onClick={() => setShowVoucherModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="voucher-modal-content">
              {loadingVouchers ? (
                <div className="voucher-loading">Loading vouchers...</div>
              ) : myVouchers.length === 0 ? (
                <div className="voucher-empty">
                  <Tag className="voucher-empty-icon" />
                  <p>No vouchers available</p>
                  <button 
                    className="voucher-empty-link"
                    onClick={() => navigate('/points')}
                  >
                    Go to Rewards to redeem vouchers
                  </button>
                </div>
              ) : (
                <div className="voucher-list">
                  {myVouchers.map((voucher) => {
                    const voucherData = voucher.vouchers || voucher;
                    const meetsMinPurchase = canApplyVoucher(voucher);
                    const minPurchase = voucherData.minimum_purchase || 0;
                    const discount = voucherData.discount_value || 0;

                    return (
                      <div 
                        key={voucher.id} 
                        className={`voucher-modal-item ${!meetsMinPurchase ? 'voucher-modal-item-disabled' : ''}`}
                        onClick={() => meetsMinPurchase && handleSelectVoucher(voucher)}
                      >
                        <div className="voucher-modal-item-content">
                          <div className="voucher-modal-item-header">
                            <div className="voucher-modal-item-name">
                              {voucherData.name}
                            </div>
                            <div className="voucher-modal-item-value">
                              ${discount.toFixed(2)} OFF
                            </div>
                          </div>
                          <div className="voucher-modal-item-desc">
                            {voucherData.description}
                          </div>
                          <div className="voucher-modal-item-code">
                            Code: {voucher.voucher_code}
                          </div>
                          {minPurchase > 0 && (
                            <div className={`voucher-modal-item-min ${!meetsMinPurchase ? 'voucher-modal-item-min-warning' : ''}`}>
                              {meetsMinPurchase ? (
                                <>
                                  <CheckCircle2 size={14} />
                                  Min. purchase: ${minPurchase.toFixed(2)}
                                </>
                              ) : (
                                <>
                                  <AlertCircle size={14} />
                                  Need ${(minPurchase - getSubtotal()).toFixed(2)} more to use this voucher
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        {meetsMinPurchase && (
                          <button className="voucher-modal-item-select">
                            Select
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default CartPage;