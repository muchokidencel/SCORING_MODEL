import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";
import { LoginPage } from "@/pages/LoginPage";
import { ClientListPage } from "@/pages/ClientListPage";
import { ClientFormPage } from "@/pages/ClientFormPage";
import { ClientDetailPage } from "@/pages/ClientDetailPage";
import { AdminHealthPage } from "@/pages/AdminHealthPage";
import { AdminUserManagementPage } from "@/pages/AdminUserManagementPage";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { flushOfflineQueue } from "@/lib/offlineSync";
import { AlertTriangle } from "lucide-react";

const App = () => {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (isOnline) {
      flushOfflineQueue();
    }
  }, [isOnline]);

  return (
    <>
      {!isOnline && (
        <div className="bg-amber-500 text-amber-950 font-semibold text-xs py-2 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-sm">
          <AlertTriangle className="size-4 shrink-0" />
          <span>Offline Mode active. All submissions will be queued locally and synchronized once your connection returns.</span>
        </div>
      )}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/clients" replace />} />
            <Route path="/clients" element={<ClientListPage />} />
            <Route path="/clients/new" element={<ClientFormPage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
            <Route path="/clients/:id/edit" element={<ClientFormPage />} />
            <Route path="/admin/health" element={<AdminHealthPage />} />
            <Route path="/admin/users" element={<AdminUserManagementPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
};

export default App;
