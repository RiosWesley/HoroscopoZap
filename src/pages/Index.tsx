import { Link } from 'react-router-dom';
import WelcomePage from './WelcomePage';
import { Button } from '@/components/ui/button';
import { Info, Shield, FileText } from 'lucide-react';

const Index = () => {
  return (
    <div className="relative">
      <WelcomePage />
      
      {/* Footer with links to About, Privacy Policy, and Terms of Use pages */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-3 z-20">
        <Button variant="ghost" size="sm" className="bg-white/30 hover:bg-white/40 backdrop-blur-sm" asChild>
          <Link to="/about" className="flex items-center gap-1">
            <Info className="h-4 w-4" />
            <span>Sobre</span>
          </Link>
        </Button>
        
        <Button variant="ghost" size="sm" className="bg-white/30 hover:bg-white/40 backdrop-blur-sm" asChild>
          <Link to="/privacy-policy" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span>Privacidade</span>
          </Link>
        </Button>

        <Button variant="ghost" size="sm" className="bg-white/30 hover:bg-white/40 backdrop-blur-sm" asChild>
          <Link to="/terms" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Termos</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default Index;