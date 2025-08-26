import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AuthCallback from "./pages/AuthCallback";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Chat from "./pages/Chat";
import AuthGuard from "./components/AuthGuard";
import UserSync from "./components/UserSync";

const queryClient = new QueryClient();

const App = () => (
  <UserSync>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              
              {/* Protected routes */}
              <Route path="/chat" element={
                <AuthGuard>
                  <Chat />
                </AuthGuard>
              } />
              <Route path="/settings" element={
                <AuthGuard>
                  <Settings />
                </AuthGuard>
              } />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  </UserSync>
);

export default App;