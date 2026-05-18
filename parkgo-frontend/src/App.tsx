import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { ROLE_LANDING } from '@/utils/constants';

import LoginPage from '@/pages/auth/LoginPage';

import SubscriberLayout from '@/pages/subscriber/SubscriberLayout';
import SubscriberDashboard from '@/pages/subscriber/SubscriberDashboard';
import ReserveParkingPage from '@/pages/subscriber/ReserveParkingPage';
import DropOffCarPage from '@/pages/subscriber/DropOffCarPage';
import PickUpCarPage from '@/pages/subscriber/PickUpCarPage';
import ParkingHistoryPage from '@/pages/subscriber/ParkingHistoryPage';
import ReservationHistoryPage from '@/pages/subscriber/ReservationHistoryPage';
import CancelReservationPage from '@/pages/subscriber/CancelReservationPage';
import UpdateDetailsPage from '@/pages/subscriber/UpdateDetailsPage';
import ProfilePage from '@/pages/subscriber/ProfilePage';

import AttendantLayout from '@/pages/attendant/AttendantLayout';
import AttendantDashboard from '@/pages/attendant/AttendantDashboard';
import RegisterSubscriberPage from '@/pages/attendant/RegisterSubscriberPage';
import ActiveSubscribersPage from '@/pages/attendant/ActiveSubscribersPage';
import ActiveParkingsPage from '@/pages/attendant/ActiveParkingsPage';
import FacilityMaintenancePage from '@/pages/attendant/FacilityMaintenancePage';
import FacilityStatusPage from '@/pages/attendant/FacilityStatusPage';
import LoadLevelPage from '@/pages/attendant/LoadLevelPage';

import ManagerLayout from '@/pages/manager/ManagerLayout';
import ManagerDashboard from '@/pages/manager/ManagerDashboard';
import AddFacilityPage from '@/pages/manager/AddFacilityPage';
import RemoveFacilityPage from '@/pages/manager/RemoveFacilityPage';
import ReportsPage from '@/pages/manager/ReportsPage';
import ManagerAllSubscribersPage from '@/pages/manager/ManagerAllSubscribersPage';
import ManagerActiveParkingsPage from '@/pages/manager/ManagerActiveParkingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function RoleRedirect() {
  const user = useAuthStore((s) => s.user);
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  if (!isAuth || !user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_LANDING[user.user_type] || '/login'} replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: '12px',
              background: '#0f172a',
              color: '#fff',
              fontSize: '14px',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/subscriber"
            element={
              <ProtectedRoute allowedRoles={['subscriber']}>
                <SubscriberLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SubscriberDashboard />} />
            <Route path="reserve" element={<ReserveParkingPage />} />
            <Route path="drop-off" element={<DropOffCarPage />} />
            <Route path="pick-up" element={<PickUpCarPage />} />
            <Route path="parking-history" element={<ParkingHistoryPage />} />
            <Route path="reservation-history" element={<ReservationHistoryPage />} />
            <Route path="cancel-reservation" element={<CancelReservationPage />} />
            <Route path="update-details" element={<UpdateDetailsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/subscriber" replace />} />
          </Route>

          <Route
            path="/attendant"
            element={
              <ProtectedRoute allowedRoles={['attendant']}>
                <AttendantLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AttendantDashboard />} />
            <Route path="register" element={<RegisterSubscriberPage />} />
            <Route path="subscribers" element={<ActiveSubscribersPage />} />
            <Route path="active-parkings" element={<ActiveParkingsPage />} />
            <Route path="facility-status" element={<FacilityStatusPage />} />
            <Route path="load-level" element={<LoadLevelPage />} />
            <Route path="maintenance" element={<FacilityMaintenancePage />} />
            <Route path="*" element={<Navigate to="/attendant" replace />} />
          </Route>

          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ManagerDashboard />} />
            <Route path="add-facility" element={<AddFacilityPage />} />
            <Route path="remove-facility" element={<RemoveFacilityPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="subscribers" element={<ManagerAllSubscribersPage />} />
            <Route path="active-parkings" element={<ManagerActiveParkingsPage />} />
            <Route path="*" element={<Navigate to="/manager" replace />} />
          </Route>

          <Route path="/" element={<RoleRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
