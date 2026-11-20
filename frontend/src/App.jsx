import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChecklistPlaceholderPage } from './pages/ChecklistPlaceholderPage';
import { DelegationPlaceholderPage } from './pages/DelegationPlaceholderPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { UsersPage } from './pages/UsersPage';
import { ChecklistWorkspacePage } from './modules/checklist/pages/ChecklistWorkspacePage';
import ChecklistDashboardPage from './modules/checklist/pages/ChecklistDashboardPage';
import ChecklistWeeklyReportPage from './modules/checklist/pages/ChecklistWeeklyReportPage';
import DelegationWorkspacePage from './modules/delegation/pages/DelegationWorkspacePage';
import DelegationDashboardPage from './modules/delegation/pages/DelegationDashboardPage';
import DelegationWeeklyReportPage from './modules/delegation/pages/DelegationWeeklyReportPage';
import ProjectsPage from './modules/crm/pages/ProjectsPage';
import EnquiriesPage from './modules/crm/pages/EnquiriesPage';
import LeadsPage from './modules/crm/pages/LeadsPage';
import LeadAssignmentPage from './modules/crm/pages/LeadAssignmentPage';
import VisitsPage from './modules/crm/pages/VisitsPage';
import FollowupsPage from './modules/crm/pages/FollowupsPage';
import SpecialFollowupsPage from './modules/crm/pages/SpecialFollowupsPage';
import CalendarPage from './modules/crm/pages/CalendarPage';
import BrokersPage from './modules/crm/pages/BrokersPage';
import BrokerNetworkPage from './modules/crm/pages/BrokerNetworkPage';
import MetaLeadsPage from './modules/crm/pages/MetaLeadsPage';
import BulkMessagePage from './modules/crm/pages/BulkMessagePage';
import CrmDashboardPage from './modules/crm/pages/CrmDashboardPage';
import PmsProjectListPage from './modules/pms/pages/PmsProjectListPage';
import PmsProjectDetailPage from './modules/pms/pages/PmsProjectDetailPage';
import PmsPlotListPage from './modules/pms/pages/PmsPlotListPage';
import PmsLegalCaseListPage from './modules/pms/pages/PmsLegalCaseListPage';
import PmsLandPurchaseListPage from './modules/pms/pages/PmsLandPurchaseListPage';
import PmsPlanningListPage from './modules/pms/pages/PmsPlanningListPage';
import PmsPreSiteListPage from './modules/pms/pages/PmsPreSiteListPage';
import PmsBaselineListPage from './modules/pms/pages/PmsBaselineListPage';
import PmsProcurementListPage from './modules/pms/pages/PmsProcurementListPage';
import PmsConstructionListPage from './modules/pms/pages/PmsConstructionListPage';
import { Spinner } from './components/Spinner';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              
              {/* Checklist routes */}
              <Route path="checklist/dashboard" element={<ChecklistDashboardPage />} />
              <Route path="checklist/list" element={<ChecklistWorkspacePage />} />
              <Route path="checklist/report" element={<ChecklistWeeklyReportPage />} />

              {/* Delegation routes */}
              <Route path="delegation/dashboard" element={<DelegationDashboardPage />} />
              <Route path="delegation/list" element={<DelegationWorkspacePage />} />
              <Route path="delegation/report" element={<DelegationWeeklyReportPage />} />

              {/* CRM routes */}
              <Route path="crm/dashboard" element={<CrmDashboardPage />} />
              <Route path="crm/projects" element={<ProjectsPage />} />
              <Route path="crm/enquiries" element={<EnquiriesPage />} />
              <Route path="crm/lead-assignments" element={<LeadAssignmentPage />} />
              <Route path="crm/lead-assignment" element={<Navigate to="/crm/lead-assignments" replace />} />
              <Route path="crm/leads" element={<LeadsPage />} />
              <Route path="crm/visits" element={<VisitsPage />} />
              <Route path="crm/visit" element={<Navigate to="/crm/visits" replace />} />
              <Route path="crm/followups" element={<FollowupsPage />} />
              <Route path="crm/follow-ups" element={<Navigate to="/crm/followups" replace />} />
              <Route path="crm/special-followups" element={<SpecialFollowupsPage />} />
              <Route path="crm/special-follow-ups" element={<Navigate to="/crm/special-followups" replace />} />
              <Route path="crm/calendar" element={<CalendarPage />} />
              <Route path="crm/brokers" element={<BrokersPage />} />
              <Route path="crm/network" element={<BrokerNetworkPage />} />
              <Route path="crm/meta-leads" element={<MetaLeadsPage />} />
              <Route path="crm/bulk-message" element={<BulkMessagePage />} />

              {/* PMS (Project Management System) routes */}
              <Route path="pms" element={<Navigate to="/pms/projects" replace />} />
              <Route path="pms/projects" element={<PmsProjectListPage />} />
              <Route path="pms/projects/:id" element={<PmsProjectDetailPage />} />
              <Route path="pms/plots" element={<PmsPlotListPage />} />
              <Route path="pms/legal-cases" element={<PmsLegalCaseListPage />} />
              <Route path="pms/land-purchases" element={<PmsLandPurchaseListPage />} />
              <Route path="pms/planning" element={<PmsPlanningListPage />} />
              <Route path="pms/pre-site-start" element={<PmsPreSiteListPage />} />
              <Route path="pms/baseline" element={<PmsBaselineListPage />} />
              <Route path="pms/procurement" element={<PmsProcurementListPage />} />
              <Route path="pms/construction" element={<PmsConstructionListPage />} />

              {/* Master administration routes */}
              <Route path="master/departments" element={<DepartmentsPage />} />
              <Route path="master/users" element={<UsersPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
