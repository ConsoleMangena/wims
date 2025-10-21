import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Auth/Login";
import AdminDashboard from "./pages/Dashboards/AdminDashboard";
import WildlifeMonitorDashboard from "./pages/Dashboards/WildlifeMonitorDashboard";
import HunterDashboard from "./pages/Dashboards/HunterDashboard";
import AntiPoachingDashboard from "./pages/Dashboards/AntiPoachingDashboard";
import Blank from "./pages/Blank";
import SpeciesPage from "./pages/resources/Species";
import SightingsPage from "./pages/resources/Sightings";
import ReservesPage from "./pages/resources/Reserves";
import HuntersPage from "./pages/resources/Hunters";
import LicensesPage from "./pages/resources/Licenses";
import QuotasPage from "./pages/resources/Quotas";
import PoachingPage from "./pages/resources/Poaching";
import ReportsPage from "./pages/resources/Reports";

function RoleBasedHome() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/auth/login" replace />;

  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "wildlife_monitor":
      return <WildlifeMonitorDashboard />;
    case "hunter":
      return <HunterDashboard />;
    case "anti_poaching_officer":
      return <AntiPoachingDashboard />;
    default:
      return <Blank />;
  }
}

function AppRoutes() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth/login" element={<Login />} />

      {/* Protected Routes with Layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index path="/" element={<RoleBasedHome />} />

        {/* Admin resource routes */}
        <Route
          path="/admin/species"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <SpeciesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sightings"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <SightingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reserves"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <ReservesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/hunters"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <HuntersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/licenses"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <LicensesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/quotas"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <QuotasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/poaching"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <PoachingPage />
            </ProtectedRoute>
          }
        />

        {/* Wildlife monitor routes */}
        <Route
          path="/monitor/sightings"
          element={
            <ProtectedRoute requiredRoles={["wildlife_monitor"]}>
              <SightingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitor/species"
          element={
            <ProtectedRoute requiredRoles={["wildlife_monitor"]}>
              <SpeciesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitor/reserves"
          element={
            <ProtectedRoute requiredRoles={["wildlife_monitor"]}>
              <ReservesPage />
            </ProtectedRoute>
          }
        />

        {/* Hunter routes */}
        <Route
          path="/hunter/licenses"
          element={
            <ProtectedRoute requiredRoles={["hunter"]}>
              <LicensesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hunter/quotas"
          element={
            <ProtectedRoute requiredRoles={["hunter"]}>
              <QuotasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hunter/reserves"
          element={
            <ProtectedRoute requiredRoles={["hunter"]}>
              <ReservesPage />
            </ProtectedRoute>
          }
        />

        {/* Anti-poaching officer routes */}
        <Route
          path="/officer/incidents"
          element={
            <ProtectedRoute requiredRoles={["anti_poaching_officer"]}>
              <PoachingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/reserves"
          element={
            <ProtectedRoute requiredRoles={["anti_poaching_officer"]}>
              <ReservesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer/reports"
          element={
            <ProtectedRoute requiredRoles={["anti_poaching_officer"]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Unauthorized */}
      <Route path="/unauthorized" element={<Blank />} />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
