import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from "react-router-dom";
import './App.css';
// Home removed: MainApp (default `/`) provides the main UI
import Login from "./pages/login";
import Signup from "./pages/Signup";
import ProfilePage from "./pages/ProfilePage";
// StallLogin component removed in favor of single login page
import StallDashboard from "./pages/stallDashboard";
import DashboardStallOwner from "./pages/DashboardStallOwner";
import DashboardAdmin from "./pages/DashboardAdmin";
import AdminApprovals from "./pages/AdminApprovals";
import AdminStalls from "./pages/AdminStalls";
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
import ReviewsPage from './pages/ReviewsPage';
import CentreDetailPage from './pages/CentreDetailPage';
import StallDetailPage from './pages/StallDetailPage';
import DishDetailPage from './pages/DishDetailPage';

// Wrapper for stall reviews route (reads stallId from URL, shows Header + back nav)
function StallReviewsPage() {
  const { stallId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const entityName = location.state?.entityName || '';
  const backUrl = stallId ? `/menu?stall=${stallId}` : '/';
  const backLabel = entityName ? `Back to ${entityName} menu` : 'Back to menu';
  return (
    <>
      <Header
        activeSection="menu"
        setActiveSection={() => {}}
        onCartClick={() => navigate('/cart')}
      />
      <main className="reviews-route-main">
        <ReviewsPage
          entityType="stall"
          entityId={stallId ? parseInt(stallId, 10) : null}
          entityName={entityName}
          backUrl={backUrl}
          backLabel={backLabel}
        />
      </main>
    </>
  );
}

// Main App component with section navigation
function MainApp() {
  const [activeSection, setActiveSection] = useState('menu');
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedHawkerCenter, setSelectedHawkerCenter] = useState(null);

  // Handle navigation state to set active section
  React.useEffect(() => {
    if (location.state?.activeSection) {
      setActiveSection(location.state.activeSection);
    }
  }, [location.state]);

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
        <Route path="/stall/:stallId/reviews" element={<StallReviewsPage />} />
        <Route path="/centres/:id" element={<CentreDetailPage />} />
        <Route path="/stalls/:id" element={<StallDetailPage />} />
        <Route path="/dishes/:id" element={<DishDetailPage />} />

        <Route path="/stall/dashboard" element={<StallDashboard />} />
        <Route path="/dashboard/stall-owner" element={<DashboardStallOwner />} />
        <Route path="/dashboard/admin" element={<DashboardAdmin />} />
        <Route path="/admin/approvals" element={<AdminApprovals />} />
        <Route path="/admin/stalls" element={<AdminStalls />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/points" element={<PointsSystem />} />
        <Route path="/nets-qr" element={<NetsQrSamplePage />} />
        <Route path="/nets-qr/success" element={<TxnNetsSuccessStatusLayout />} />
        <Route path="/nets-qr/fail" element={<TxnNetsFailStatusLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
