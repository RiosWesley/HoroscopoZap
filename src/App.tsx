
import React, { useEffect } from 'react'; // Add useEffect back
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChatAnalysisProvider, useChatAnalysis } from './context/ChatAnalysisContext'; // Import the provider AND the hook
// InstallPwaButton import remains removed
import Index from './pages/Index';
import WelcomePage from "./pages/WelcomePage";
import InstructionsPage from "./pages/InstructionsPage";
import AnalyzingPage from "./pages/AnalyzingPage";
import ResultsPage from "./pages/ResultsPage";
import PremiumPage from "./pages/PremiumPage"; // Import the new Premium page
import PaymentPage from "./pages/PaymentPage"; // Import the new Payment page
import NotFound from "./pages/NotFound";
import ReceiveSharePage from "./pages/ReceiveSharePage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import About from "./pages/About";
import TermsOfUse from "./pages/TermsOfUse"; // Import the new Terms of Use page

const queryClient = new QueryClient();

// Re-define BeforeInstallPromptEvent interface (needed for the effect)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Inner component to access context easily
const AppContent = () => {
  const { setDeferredPrompt } = useChatAnalysis(); // Get setter from context

  // Effect to capture the install prompt globally
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      // Store the event in the global context
      setDeferredPrompt(e as BeforeInstallPromptEvent); 
      // console.log('\'beforeinstallprompt\' event captured globally and stored in context.');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also listen for appinstalled event to clear the prompt from context
    window.addEventListener('appinstalled', () => {
      // console.log('PWA was installed, clearing prompt from context.');
      setDeferredPrompt(null); // Clear from context
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      // Optional: remove appinstalled listener if needed
      // window.removeEventListener('appinstalled', () => {}); 
    };
  }, [setDeferredPrompt]); // Depend on the context setter function

  return (
    <TooltipProvider>
          <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/instructions" element={<InstructionsPage />} />
            <Route path="/analyzing" element={<AnalyzingPage />} />
            {/* Updated route to accept optional analysisId */}
            <Route path="/results/:analysisId?" element={<ResultsPage />} />
            <Route path="/premium/:analysisId" element={<PremiumPage />} /> {/* Add premium route com analysisId */}
            <Route path="/payment/:analysisId" element={<PaymentPage />} /> {/* Add payment route */}
            <Route path="/receive-share" element={<ReceiveSharePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<TermsOfUse />} /> {/* Add terms of use route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        {/* No button rendering here */}
      </TooltipProvider>
  );
}

// Main App component wraps the Provider around the Content
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatAnalysisProvider> {/* Provider now wraps AppContent */}
        <AppContent />
      </ChatAnalysisProvider>
    </QueryClientProvider>
  );
};

export default App;
