import React, { useState } from "react";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./CartPage.css";

const CartPage = () => {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Roasted Chicken Rice",
      stallName: "Ah Seng Chicken Rice",
      price: 4.5,
      quantity: 2,
      image:
        "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&auto=format&fit=crop",
    },
  ]);

  const updateQuantity = (id, qty) => {
    if (qty <= 0) {
      setCartItems(cartItems.filter((i) => i.id !== id));
      return;
    }
    setCartItems(
      cartItems.map((i) =>
        i.id === id ? { ...i, quantity: qty } : i
      )
    );
  };

  const getSubtotal = () =>
    cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const deliveryFee = 2.5;
  const serviceFee = 0.5;

  return (
    <main className="cart-page">

      {/* HEADER */}
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
            {cartItems.length} items
          </span>
        </nav>
      </header>

      {/* EMPTY STATE */}
      {cartItems.length === 0 && (
        <section className="empty-cart">
          <ShoppingBag className="empty-cart-icon" />
          <h2 className="empty-cart-title">Your cart is empty</h2>
          <p className="empty-cart-text">Start adding delicious meals!</p>

          <button 
            className="browse-button"
            onClick={() => navigate('/menu')}
          >
            Browse Menu
          </button>
        </section>
      )}

      {/* MAIN CONTENT */}
      {cartItems.length > 0 && (
        <section className="cart-content">

          {/* ITEMS */}
          <div className="cart-items-section">
            <h2 className="section-title">Items</h2>

            <ul className="cart-items-list">
              {cartItems.map((item) => (
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
                          <p className="item-price">${item.price.toFixed(2)}</p>
                        </div>

                        <button
                          className="remove-button"
                          onClick={() => updateQuantity(item.id, 0)}
                        >
                          <Trash2 className="remove-icon" />
                        </button>
                      </div>

                      <div className="quantity-controls">
                        <button
                          className="quantity-button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="quantity-icon" />
                        </button>

                        <span className="quantity-display">
                          {item.quantity}
                        </span>

                        <button
                          className="quantity-button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="quantity-icon" />
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
                <span className="price-value">${getSubtotal().toFixed(2)}</span>
              </div>

              <div className="price-row">
                <span className="price-label">Delivery Fee</span>
                <span className="price-value">
                  ${deliveryFee.toFixed(2)}
                </span>
              </div>

              <div className="price-row">
                <span className="price-label">Service Fee</span>
                <span className="price-value">
                  ${serviceFee.toFixed(2)}
                </span>
              </div>

              <hr className="price-divider" />

              <div className="price-row total-row">
                <span className="total-label">Total</span>
                <span className="total-value">
                  ${(getSubtotal() + deliveryFee + serviceFee).toFixed(2)}
                </span>
              </div>

              <button className="checkout-button">
                Proceed to Checkout
              </button>
            </div>
          </aside>
        </section>
      )}

    </main>
  );
};

export default CartPage;