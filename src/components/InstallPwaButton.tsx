import React from 'react';
import { Button } from '@/components/ui/button'; // Assuming Button component from Shadcn UI
import { Download } from 'lucide-react'; // Using an icon

interface InstallPwaButtonProps {
  onInstallClick: () => void;
}

const InstallPwaButton: React.FC<InstallPwaButtonProps> = ({ onInstallClick }) => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 p-4 bg-background border rounded-lg shadow-lg flex items-center space-x-4 max-w-md w-11/12">
      <img src="/website-image.png" alt="App Icon" className="w-12 h-12 rounded-md" />
      <div className="flex-grow">
        <p className="font-semibold text-lg">Instalar HoroscopoZap</p>
        <p className="text-sm text-muted-foreground">Adicione à sua tela inicial para acesso rápido.</p>
      </div>
      <Button onClick={onInstallClick} size="sm">
        <Download className="mr-2 h-4 w-4" />
        Instalar
      </Button>
    </div>
  );
};

export default InstallPwaButton;
