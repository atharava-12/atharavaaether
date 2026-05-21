import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { useGuestMode } from "@/hooks/useGuestMode";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";
import ImageGen from "./pages/ImageGen";

import Memory from "./pages/Memory";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowGuest = false, autoGuest = false }: { children: React.ReactNode; allowGuest?: boolean; autoGuest?: boolean }) {
  const { user, loading } = useAuth();
  const { isGuest, enterGuestMode, exitGuestMode } = useGuestMode();
  const needsOnboarding = useOnboardingCheck(user?.id);

  if (loading) return <div className="min-h-screen bg-background" />;
  if (isGuest && allowGuest) return <>{children}</>;
  if (!user) {
    if (autoGuest && allowGuest) {
      enterGuestMode();
      return <>{children}</>;
    }
    // Locked feature — drop guest session so /auth doesn't bounce back
    if (isGuest) exitGuestMode();
    return <Navigate to="/auth" replace />;
  }
  if (needsOnboarding === null) return <div className="min-h-screen bg-background" />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />  
    <Route path="/signin" element={<Navigate to="/auth" replace />} />
    <Route path="/index.html" element={<Navigate to="/" replace />} />
    <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
    <Route path="/" element={<ProtectedRoute allowGuest autoGuest><Index /></ProtectedRoute>} />
    <Route path="/image" element={<ProtectedRoute><ImageGen /></ProtectedRoute>} />
    
    <Route path="/memory" element={<ProtectedRoute><Memory /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute allowGuest><Settings /></ProtectedRoute>} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
