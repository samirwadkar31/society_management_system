import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Forgot from './pages/Forgot';
import Reset from './pages/Reset';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Residents from './pages/Residents';
import ResidentForm from './pages/ResidentForm';
import MyFlat from './pages/MyFlat';
import Complaints from './pages/Complaints';
import ComplaintDetail from './pages/ComplaintDetail';
import Bills from './pages/Bills';
import Receipt from './pages/Receipt';
import Bookings from './pages/Bookings';
import Notices from './pages/Notices';
import Visitors from './pages/Visitors';
import VisitorPass from './pages/VisitorPass';
import Gate from './pages/Gate';
import Emergencies from './pages/Emergencies';
import Profile from './pages/Profile';
import AddMember from './pages/AddMember';

function Guard({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="main">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/reset-password/:token" element={<Reset />} />
      <Route
        path="/app"
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="residents" element={<Guard roles={['admin']}><Residents /></Guard>} />
        <Route path="residents/:id" element={<Guard roles={['admin']}><ResidentForm /></Guard>} />
        <Route path="flat" element={<Guard roles={['resident']}><MyFlat /></Guard>} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="complaints/:id" element={<ComplaintDetail />} />
        <Route path="bills" element={<Bills />} />
        <Route path="bills/:id" element={<Receipt />} />
        <Route path="bills/:id/receipt" element={<Receipt />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="notices" element={<Notices />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="visitors/:id/pass" element={<VisitorPass />} />
        <Route path="gate" element={<Guard roles={['security', 'admin']}><Gate /></Guard>} />
        <Route path="emergencies" element={<Emergencies />} />
        <Route path="profile" element={<Profile />} />
        <Route path="members" element={<Guard roles={['admin']}><AddMember /></Guard>} />
      </Route>
    </Routes>
  );
}
