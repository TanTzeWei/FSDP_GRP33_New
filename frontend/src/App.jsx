import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './App.css';
import Home from "./pages/Home";
import Login from "./pages/login";
import Signup from "./pages/Signup";
import Header from './components/Header';
import Menu from './components/Menu';
import Deals from './components/Deals';
import Rewards from './components/Rewards';
import Profile from './components/Profile';
import LocationMap from './components/LocationMap';
import OrderHistory from './components/OrderHistory';
import CartSidebar from './components/CartSidebar';

// Main App component with section navigation
function MainApp() {
  const [activeSection, setActiveSection] = useState('menu');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case 'menu':
        return <Menu />;
      case 'deals':
        return <Deals />;
      case 'rewards':
        return <Rewards />;
      case 'profile':
        return <OrderHistory />;
      case 'location':
        return <LocationMap />;
      default:
        return <Menu />;
    }
  };

  const handleCartClick = () => {
    console.log('Cart button clicked! Opening cart sidebar...');
    setIsCartOpen(true);
  };

  const handleCartClose = () => {
    setIsCartOpen(false);
  };

  return (
    <div className="App">
      <Header 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        onCartClick={handleCartClick}
      />
      <main className="main-content">
        {renderSection()}
      </main>
      {isCartOpen && (
        <div>
          <CartSidebar onClose={handleCartClose} />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/home" element={<Home />} />
        <Route path="/main" element={<MainApp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
