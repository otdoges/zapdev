import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConvexProvider } from "convex/react";
import { ConvexProviderWithAuth } from "convex/react";
import { convex } from "@/lib/convex";
import { useConvexAuth } from "@/hooks/useConvexAuth";
import { trpc } from "@/lib/trpc";
import { httpBatchLink } from "@trpc/client";
import Index from "./pages/Index";
import AuthCallback from "./pages/AuthCallback";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AuthGuard from "./components/AuthGuard";

const queryClient = new QueryClient();

// Create TRPC client
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_CONVEX_URL}/trpc`,
      headers: () => {
        const token = localStorage.getItem('workos_id_token');
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

const App = () => (
  <ConvexProviderWithAuth client={convex} useAuth={useConvexAuth}>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/pricing" element={<Pricing />} />
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
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
              </Routes>
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </trpc.Provider>
  </ConvexProviderWithAuth>
);

export default App;