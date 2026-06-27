import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import MeteoRoPage from './pages/MeteoRoPage';
import AvalancheRiskChartPage from './pages/AvalancheRiskChartPage';
import HumanImpactStatsPage from './pages/HumanImpactStatsPage';
import TerrainStatsPage from './pages/TerrainStatsPage';
import TypologyStatsPage from './pages/TypologyStatsPage';
import MetadataManagement from './pages/MetadataManagement';
import Map3DPage from './pages/Map3DPage';
import RapoarteRiscuriPage from './pages/RapoarteRiscuriPage';
import { useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { connectWebSocket } from './services/websocketService';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNotifications } from './context/NotificationContext';

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, isAdmin, isExpert, isReviewer, isDataEngineer, isUserAdmin, loading } = useAuth();

  if (loading) return <div className="container py-20 text-center">Loading...</div>;

  if (roleRequired === 'NOT_RESTRICTED_ADMIN') {
    if (user) {
      const isRestrictedAdmin = !isAdmin && isUserAdmin;
      const isOnlyDataEngineer = !isAdmin && user.roles?.some(role => role === 'ROLE_DATA_ENGINEER' || role === 'DATA_ENGINEER');
      if (isRestrictedAdmin) return <Navigate to="/admin/users" />;
      if (isOnlyDataEngineer) return <Navigate to="/admin/metadata" />;
    }
    return children;
  }

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
  const location = useLocation();

  const isMap3D = location.pathname === '/map3d';

  useEffect(() => {
    if (user) {
      const isAdmin = user.roles?.some(r => r === 'ROLE_ADMIN' || r === 'ADMIN');
      const isRestrictedAdmin = !isAdmin && user.roles?.some(r => r === 'ROLE_ADMIN_UTILIZATORI' || r === 'ADMIN_UTILIZATORI');
      const isOnlyDataEngineer = !isAdmin && user.roles?.some(r => r === 'ROLE_DATA_ENGINEER' || r === 'DATA_ENGINEER');

      if (isRestrictedAdmin && window.location.pathname === '/') {
        navigate('/admin/users');
      } else if (isOnlyDataEngineer && window.location.pathname === '/') {
        navigate('/admin/metadata');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    const token = user?.token || user?.accessToken;
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

      {isMap3D ? (
        <ProtectedRoute roleRequired="NOT_RESTRICTED_ADMIN">
          <Map3DPage />
        </ProtectedRoute>
      ) : (
        <main className="container pb-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/add" element={
              <ProtectedRoute roleRequired="NOT_RESTRICTED_ADMIN">
                <AddReportSelectionPage />
              </ProtectedRoute>
            } />
            <Route path="/add-avalanche" element={
              <ProtectedRoute roleRequired="NOT_RESTRICTED_ADMIN">
                <AvalancheFormPage />
              </ProtectedRoute>
            } />
            <Route path="/add-conditions" element={
              <ProtectedRoute roleRequired="NOT_RESTRICTED_ADMIN">
                <ConditionsFormPage />
              </ProtectedRoute>
            } />
            <Route path="/validation" element={
              <ProtectedRoute roleRequired="EXPERT">
                <ValidationPanel />
              </ProtectedRoute>
            } />
            <Route path="/avalanche/:id" element={
              <ProtectedRoute roleRequired="NOT_RESTRICTED_ADMIN">
                <AvalancheDetailsPage />
              </ProtectedRoute>
            } />
            <Route path="/avalanche/edit/:id" element={
              <ProtectedRoute roleRequired="ADMIN_OR_EXPERT_OR_REVIEWER">
                <AvalancheEditPage />
              </ProtectedRoute>
            } />
            <Route path="/conditions/:id" element={
              <ProtectedRoute roleRequired="NOT_RESTRICTED_ADMIN">
                <ConditionsDetailsPage />
              </ProtectedRoute>
            } />
            <Route path="/conditions/edit/:id" element={
              <ProtectedRoute roleRequired="ADMIN_OR_EXPERT_OR_REVIEWER">
                <ConditionsEditPage />
              </ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute roleRequired="NOT_RESTRICTED_ADMIN">
                <SearchPage />
              </ProtectedRoute>
            } />
            <Route path="/meteo" element={
              <ProtectedRoute roleRequired="NOT_RESTRICTED_ADMIN">
                <MeteoPage />
              </ProtectedRoute>
            } />
            <Route path="/meteo-ro" element={
              <ProtectedRoute roleRequired="NOT_RESTRICTED_ADMIN">
                <MeteoRoPage />
              </ProtectedRoute>
            } />
            <Route path="/rapoarte-risc" element={
              <ProtectedRoute roleRequired="NOT_RESTRICTED_ADMIN">
                <RapoarteRiscuriPage />
              </ProtectedRoute>
            } />
            <Route path="/statistici" element={
              <ProtectedRoute roleRequired="NOT_RESTRICTED_ADMIN">
                <AvalancheRiskChartPage />
              </ProtectedRoute>
            } />
            <Route path="/statistici/bilant-uman" element={
              <ProtectedRoute roleRequired="NOT_RESTRICTED_ADMIN">
                <HumanImpactStatsPage />
              </ProtectedRoute>
            } />
            <Route path="/statistici/analiza-teren" element={
              <ProtectedRoute roleRequired="NOT_RESTRICTED_ADMIN">
                <TerrainStatsPage />
              </ProtectedRoute>
            } />
            <Route path="/statistici/cauze-tipologii" element={
              <ProtectedRoute roleRequired="NOT_RESTRICTED_ADMIN">
                <TypologyStatsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute roleRequired="USER_ADMIN">
                <UserManagementPanel />
              </ProtectedRoute>
            } />
            <Route path="/admin/requests" element={
              <ProtectedRoute roleRequired="USER_ADMIN">
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
      )}

      <div id="portal-root" />
    </div>
  );
}

export default App;