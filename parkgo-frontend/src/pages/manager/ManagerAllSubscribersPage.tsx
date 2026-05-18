import ActiveSubscribersPage from '@/pages/attendant/ActiveSubscribersPage';

/**
 * Managers can view the same subscriber roster + detail modal as attendants.
 * The Reactivate button inside the modal will only succeed for attendants
 * (the backend enforces this), but for a manager it will surface a 403 toast
 * which is the desired behavior.
 */
export default function ManagerAllSubscribersPage() {
  return <ActiveSubscribersPage />;
}
