import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import './App.css';
// Home removed: MainApp (default `/`) provides the main UI
import Login from "./pages/login";
import Signup from "./pages/Signup";
import ProfilePage from "./pages/ProfilePage";
import Header from './components/Header';
import Menu from './components/Menu';
import MenuPage from './pages/menupage';
import Cart from './pages/CartPage';
import Deals from './components/Deals';
import PointsSystem from './pages/PointsSystem';
import Profile from './components/Profile';
import LocationMap from './components/LocationMap';
import OrderHistory from './components/OrderHistory';
import NetsQrSamplePage from './pages/netsQrSamplePage';
import TxnNetsSuccessStatusLayout from './pages/txnNetsSuccessStatusLayout';
import TxnNetsFailStatusLayout from './pages/txnNetsFailStatusLayout';

// Main App component with section navigation
function MainApp() {
  const [activeSection, setActiveSection] = useState('menu');
  const navigate = useNavigate();
  const [selectedHawkerCenter, setSelectedHawkerCenter] = useState(null);

  const renderSection = () => {
    switch (activeSection) {
      case 'menu':
        return <Menu />;
      case 'deals':
        return <Deals />;
      case 'rewards':
        return <PointsSystem />;
      case 'profile':
        return <OrderHistory />;
      case 'location':
        return <LocationMap onHawkerSelect={setSelectedHawkerCenter} />;
      default:
        return <Menu />;
    }
  };

  const handleCartClick = () => {
    // Navigate to the single cart page instead of opening a sidebar
    navigate('/cart');
  };

  return (
    <div className="App">
      <Header 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        onCartClick={handleCartClick}
        selectedHawkerCenter={selectedHawkerCenter}
      />
      <main className="main-content">
        {renderSection()}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        {/* /home route removed. Main app is available at / and /main */}
        <Route path="/main" element={<MainApp />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/points" element={<PointsSystem />} />
        <Route path="/nets-qr" element={<NetsQrSamplePage />} />
        <Route path="/nets-qr/success" element={<TxnNetsSuccessStatusLayout />} />
        <Route path="/nets-qr/fail" element={<TxnNetsFailStatusLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
