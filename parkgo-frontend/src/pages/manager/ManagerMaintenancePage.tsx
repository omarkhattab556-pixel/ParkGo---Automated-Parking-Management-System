import FacilityMaintenancePage from '@/pages/attendant/FacilityMaintenancePage';

/**
 * The maintenance call endpoint accepts both attendant and manager roles,
 * so the manager re-uses the same page as the attendant.
 */
export default function ManagerMaintenancePage() {
  return <FacilityMaintenancePage />;
}
