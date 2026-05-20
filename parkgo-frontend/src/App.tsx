import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { PageSuspenseFallback } from '@/components/common/PageSuspenseFallback';
import { useAuthStore } from '@/store/authStore';
import { ROLE_LANDING } from '@/utils/constants';

import LoginPage from '@/pages/auth/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';

/* ---------- Lazy route chunks ---------- */

// Subscriber
const SubscriberLayout = lazy(() => import('@/pages/subscriber/SubscriberLayout'));
const SubscriberDashboard = lazy(() => import('@/pages/subscriber/SubscriberDashboard'));
const ReserveParkingPage = lazy(() => import('@/pages/subscriber/ReserveParkingPage'));
const DropOffCarPage = lazy(() => import('@/pages/subscriber/DropOffCarPage'));
const PickUpCarPage = lazy(() => import('@/pages/subscriber/PickUpCarPage'));
const ParkingHistoryPage = lazy(() => import('@/pages/subscriber/ParkingHistoryPage'));
const ReservationHistoryPage = lazy(() => import('@/pages/subscriber/ReservationHistoryPage'));
const CancelReservationPage = lazy(() => import('@/pages/subscriber/CancelReservationPage'));
const UpdateDetailsPage = lazy(() => import('@/pages/subscriber/UpdateDetailsPage'));
const ProfilePage = lazy(() => import('@/pages/subscriber/ProfilePage'));

// Attendant
const AttendantLayout = lazy(() => import('@/pages/attendant/AttendantLayout'));
const AttendantDashboard = lazy(() => import('@/pages/attendant/AttendantDashboard'));
const RegisterSubscriberPage = lazy(() => import('@/pages/attendant/RegisterSubscriberPage'));
const ActiveSubscribersPage = lazy(() => import('@/pages/attendant/ActiveSubscribersPage'));
const ActiveParkingsPage = lazy(() => import('@/pages/attendant/ActiveParkingsPage'));
const FacilityMaintenancePage = lazy(() => import('@/pages/attendant/FacilityMaintenancePage'));
const FacilityStatusPage = lazy(() => import('@/pages/attendant/FacilityStatusPage'));
const LoadLevelPage = lazy(() => import('@/pages/attendant/LoadLevelPage'));

// Manager — heaviest chunks (Recharts), splitting helps a lot here
const ManagerLayout = lazy(() => import('@/pages/manager/ManagerLayout'));
const ManagerDashboard = lazy(() => import('@/pages/manager/ManagerDashboard'));
const AddFacilityPage = lazy(() => import('@/pages/manager/AddFacilityPage'));
const RemoveFacilityPage = lazy(() => import('@/pages/manager/RemoveFacilityPage'));
const ReportsPage = lazy(() => import('@/pages/manager/ReportsPage'));
const ManagerAllSubscribersPage = lazy(() => import('@/pages/manager/ManagerAllSubscribersPage'));
const ManagerActiveParkingsPage = lazy(() => import('@/pages/manager/ManagerActiveParkingsPage'));
const ManagerMaintenancePage = lazy(
  () => import('@/pages/manager/ManagerMaintenancePage')
);
const AddAttendantPage = lazy(
  () => import('@/pages/manager/AddAttendantPage')
);

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
    <ErrorBoundary>
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
          <Suspense fallback={<PageSuspenseFallback />}>
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
                <Route
                  path="reservation-history"
                  element={<ReservationHistoryPage />}
                />
                <Route
                  path="cancel-reservation"
                  element={<CancelReservationPage />}
                />
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
                <Route
                  path="subscribers"
                  element={<ManagerAllSubscribersPage />}
                />
                <Route
                  path="active-parkings"
                  element={<ManagerActiveParkingsPage />}
                />
                <Route path="maintenance" element={<ManagerMaintenancePage />} />
                <Route path="add-attendant" element={<AddAttendantPage />} />
                <Route path="*" element={<Navigate to="/manager" replace />} />
              </Route>

              <Route path="/" element={<RoleRedirect />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
