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
              <Route path="crm/projects" element={<ProjectsPage />} />
              <Route path="crm/enquiries" element={<EnquiriesPage />} />
              <Route path="crm/lead-assignments" element={<LeadAssignmentPage />} />
              <Route path="crm/lead-assignment" element={<Navigate to="/crm/lead-assignments" replace />} />
              <Route path="crm/leads" element={<LeadsPage />} />

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
