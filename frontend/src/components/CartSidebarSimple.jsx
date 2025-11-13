import React, { useState } from 'react';
import './CartSidebar.css';

const CartSidebarSimple = ({ onClose }) => {
  console.log('Simple CartSidebar mounted!');
  
  return (
    <>
      <div className="cart-overlay" onClick={onClose}></div>
      <div className="cart-sidebar">
        <div className="cart-header">
          <h2>Test Cart</h2>
          <button className="cart-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="cart-content">
          <p>Cart is working!</p>
        </div>
      </div>
    </>
  );
};

export default CartSidebarSimple;