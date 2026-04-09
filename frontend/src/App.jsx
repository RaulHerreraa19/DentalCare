import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout, ProtectedRoute } from './components/Layout';

// Pages
import Login from './pages/Login';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import Organizations from './pages/superadmin/Organizations';
import OrganizationDetails from './pages/superadmin/OrganizationDetails';
import OwnerDashboard from './pages/owner/Dashboard';
import OwnerClinics from './pages/owner/Clinics';
import OwnerTeam from './pages/owner/Team';
import WhatsAppSettings from './pages/owner/WhatsAppSettings';
import DoctorServices from './pages/doctor/Services';
import DoctorDashboard from './pages/doctor/Dashboard';
import CashRegister from './pages/reception/CashRegister';
import MedicalRecordEditor from './pages/doctor/MedicalRecordEditor';
import ProfileSettings from './pages/doctor/ProfileSettings';

// Receptionist Pages
import Patients from './pages/reception/Patients';
import Calendar from './pages/reception/Calendar';
import DoctorSchedule from './pages/doctor/Schedule';
import { useAuth } from './context/AuthContext';

function DashboardRedirect() {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  const roleDefaultRoutes = {
    'SUPER_ADMIN': '/superadmin/dashboard',
    'OWNER': '/owner/dashboard',
    'DOCTOR': '/doctor/dashboard',
    'RECEPTIONIST': '/reception/calendar'
  };

  const targetPath = roleDefaultRoutes[user.role] || '/login';
  return <Navigate to={targetPath} replace />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Super Admin Routes */}
        <Route element={<Layout />}>
          <Route 
            path="/superadmin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/superadmin/organizations" 
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <Organizations />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/superadmin/organizations/:id" 
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <OrganizationDetails />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Owner/Reception Routes */}
        <Route element={<Layout />}>
           <Route 
            path="/billing/cash" 
            element={
              <ProtectedRoute allowedRoles={['OWNER', 'RECEPTIONIST']}>
                <CashRegister />
              </ProtectedRoute>
            } 
          />
        </Route>
        <Route element={<Layout />}>
          <Route path="/owner/dashboard" element={<ProtectedRoute allowedRoles={['OWNER']}><OwnerDashboard /></ProtectedRoute>} />
          <Route path="/owner/clinics" element={<ProtectedRoute allowedRoles={['OWNER']}><OwnerClinics /></ProtectedRoute>} />
          <Route path="/owner/team" element={<ProtectedRoute allowedRoles={['OWNER']}><OwnerTeam /></ProtectedRoute>} />
          <Route path="/owner/whatsapp" element={<ProtectedRoute allowedRoles={['OWNER']}><WhatsAppSettings /></ProtectedRoute>} />
          
          <Route path="/doctor/services" element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorServices /></ProtectedRoute>} />
          <Route path="/doctor/schedule" element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorSchedule /></ProtectedRoute>} />
          <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/medical-records/:patientId" element={<ProtectedRoute allowedRoles={['DOCTOR']}><MedicalRecordEditor /></ProtectedRoute>} />
          <Route path="/doctor/profile" element={<ProtectedRoute allowedRoles={['DOCTOR', 'OWNER']}><ProfileSettings /></ProtectedRoute>} />
          
          <Route path="/reception/patients" element={<ProtectedRoute allowedRoles={['RECEPTIONIST', 'OWNER', 'DOCTOR']}><Patients /></ProtectedRoute>} />
          <Route path="/reception/calendar" element={<ProtectedRoute allowedRoles={['RECEPTIONIST', 'OWNER', 'DOCTOR']}><Calendar /></ProtectedRoute>} />
          
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['OWNER', 'DOCTOR', 'RECEPTIONIST']}><DashboardRedirect /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
