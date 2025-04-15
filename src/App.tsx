
import React, { useState, useEffect } from 'react'; // Add useState, useEffect
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChatAnalysisProvider } from './context/ChatAnalysisContext'; // Import the provider
import InstallPwaButton from './components/InstallPwaButton'; // Import the button component
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

// Define the BeforeInstallPromptEvent interface (TypeScript might not have it built-in)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const App = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-info bar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log('\'beforeinstallprompt\' event captured.');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Optional: Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      // Hide the install button or provide feedback
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      // No need to remove appinstalled listener usually, but good practice if component unmounts often
      // window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('Install prompt not available.');
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, clear it
    setDeferredPrompt(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ChatAnalysisProvider> {/* Wrap the app with the provider */}
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
        {/* Conditionally render the install button */}
        {deferredPrompt && <InstallPwaButton onInstallClick={handleInstallClick} />}
      </TooltipProvider>
    </ChatAnalysisProvider> {/* Close the provider */}
  </QueryClientProvider>
  );
};

export default App;
