import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AvalancheFormPage from './pages/AvalancheFormPage';
import AddReportSelectionPage from './pages/AddReportSelectionPage';
import ConditionsFormPage from './pages/ConditionsFormPage';
import ValidationPanel from './pages/ValidationPanel';
import AvalancheDetailsPage from './pages/AvalancheDetailsPage';
import AvalancheEditPage from './pages/AvalancheEditPage';
import ConditionsEditPage from './pages/ConditionsEditPage';
import ConditionsDetailsPage from './pages/ConditionsDetailsPage';
import SearchPage from './pages/SearchPage';
import UserManagementPanel from './pages/UserManagementPanel';
import AccountRequestsPanel from './pages/AccountRequestsPanel';
import MeteoPage from './pages/MeteoPage';
import MetadataManagement from './pages/MetadataManagement';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { connectWebSocket } from './services/websocketService';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNotifications } from './context/NotificationContext';

// Protected Route Component
const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, isAdmin, isExpert, isReviewer, isDataEngineer, isUserAdmin, loading } = useAuth();

  if (loading) return <div className="container py-20 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (roleRequired === 'ADMIN' && !isAdmin) return <Navigate to="/" />;
  if (roleRequired === 'EXPERT' && !isExpert) return <Navigate to="/" />;
  if (roleRequired === 'ADMIN_OR_EXPERT_OR_REVIEWER' && !isAdmin && !isExpert && !isReviewer) return <Navigate to="/" />;
  if (roleRequired === 'EXPERT_OR_REVIEWER' && !isExpert && !isReviewer) return <Navigate to="/" />;
  if (roleRequired === 'USER_ADMIN_OR_DATA_ENGINEER' && !isUserAdmin && !isDataEngineer) return <Navigate to="/" />;
  if (roleRequired === 'ADMIN_OR_DATA_ENGINEER' && !isAdmin && !isDataEngineer) return <Navigate to="/" />;
  if (roleRequired === 'USER_ADMIN' && !isUserAdmin) return <Navigate to="/" />;

  return children;
};

let stompClient = null;

function App() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    const isRestrictedAdmin = user && !user.roles?.includes('ROLE_ADMIN') && user.roles?.includes('ROLE_ADMIN_UTILIZATORI');
    if ((isRestrictedAdmin || (user && user.roles?.includes('ROLE_DATA_ENGINEER'))) && window.location.pathname === '/') {
      navigate('/admin/users');
    }
  }, [user, navigate]);

  useEffect(() => {
    const token = user?.token || user?.accessToken;
    // Dacă utilizatorul e logat și nu avem deja un client conectat corect
    if (user && token && !stompClient) {
      stompClient = connectWebSocket(user, addNotification);
    }

    return () => {
      if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
      }
    };
  }, [user?.token, user?.accessToken]);

  return (
    <div className="min-h-screen">
      <ToastContainer position="top-right" autoClose={5000} />
      <Navbar />
      <main className="container pb-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Add more routes here as we build the pages */}
          <Route path="/add" element={<AddReportSelectionPage />} />
          <Route path="/add-avalanche" element={<AvalancheFormPage />} />
          <Route path="/add-conditions" element={<ConditionsFormPage />} />

          <Route path="/validation" element={
            <ProtectedRoute roleRequired="EXPERT_OR_REVIEWER">
              <ValidationPanel />
            </ProtectedRoute>
          } />

          <Route path="/avalanche/:id" element={<AvalancheDetailsPage />} />
          <Route path="/avalanche/edit/:id" element={
            <ProtectedRoute roleRequired="ADMIN_OR_EXPERT_OR_REVIEWER">
              <AvalancheEditPage />
            </ProtectedRoute>
          } />
          <Route path="/conditions/:id" element={<ConditionsDetailsPage />} />
          <Route path="/conditions/edit/:id" element={
            <ProtectedRoute roleRequired="ADMIN_OR_EXPERT_OR_REVIEWER">
              <ConditionsEditPage />
            </ProtectedRoute>
          } />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/meteo" element={<MeteoPage />} />

          {/* Protected Routes */}
          <Route path="/admin/users" element={
            <ProtectedRoute roleRequired="USER_ADMIN_OR_DATA_ENGINEER">
              <UserManagementPanel />
            </ProtectedRoute>
          } />
          <Route path="/admin/requests" element={
            <ProtectedRoute roleRequired="USER_ADMIN_OR_DATA_ENGINEER">
              <AccountRequestsPanel />
            </ProtectedRoute>
          } />
          <Route path="/admin/metadata" element={
            <ProtectedRoute roleRequired="ADMIN_OR_DATA_ENGINEER">
              <MetadataManagement />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <div id="portal-root" />

    </div>
  );
}

export default App;
