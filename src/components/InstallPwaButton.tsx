import React, { useState } from 'react'; // Import useState
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress'; // Import Progress
// Removed Download icon import as we'll use the app icon

interface InstallPwaButtonProps {
  onInstallClick: () => void;
  isInstalling: boolean; // Add isInstalling prop to props interface
}

// Further refined style based on the provided image example
const InstallPwaButton: React.FC<InstallPwaButtonProps> = ({ onInstallClick, isInstalling }) => { // Receive isInstalling prop
  // Get the base URL for the subtitle
  const appUrl = window.location.hostname;

  const handleInstall = () => {
    onInstallClick();
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 p-3 bg-secondary text-secondary-foreground border border-border rounded-lg shadow-lg flex flex-col items-center max-w-sm"> {/* Changed to flex-col and alignItems */}
      <div className="flex items-center space-x-3 w-full"> {/* Container for icon, text and button */}
        {/* Use the actual app icon */}
        <img src="/website-image.png" alt="Ícone HoroscopoZap" className="w-10 h-10 rounded-md flex-shrink-0" />
        <div className="flex-grow min-w-0">
          <p className="font-semibold text-sm truncate">Instalar HoroscopoZap</p>
          {/* Display the app's domain */}
          <p className="text-xs text-muted-foreground truncate">{appUrl}</p>
        </div>
        {/* Using a more prominent button style */}
        <Button onClick={handleInstall} size="sm" variant="default" className="flex-shrink-0 px-4" disabled={isInstalling}>
          {isInstalling ? 'Instalando...' : 'Instalar'} {/* Button text changes based on install state */}
        </Button>
      </div>
      {isInstalling && (
        <div className="mt-2 w-full"> {/* Progress bar container */}
          <Progress value={50} /> {/* Example progress value - you'll need to update this dynamically */}
        </div>
      )}
    </div>
  );
};

export default InstallPwaButton;
