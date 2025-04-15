import React from 'react'; // Ensure React is imported only once
import { Button } from '@/components/ui/button';
// Removed Download icon import as we'll use the app icon

interface InstallPwaButtonProps {
  onInstallClick: () => void;
}

// Further refined style based on the provided image example
const InstallPwaButton: React.FC<InstallPwaButtonProps> = ({ onInstallClick }) => {
  // Get the base URL for the subtitle
  const appUrl = window.location.hostname; 

  return (
    // Using bg-secondary and text-secondary-foreground for a potentially darker theme like the example
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 p-3 bg-secondary text-secondary-foreground border border-border rounded-lg shadow-lg flex items-center space-x-3 max-w-sm">
      {/* Use the actual app icon */}
      <img src="/website-image.png" alt="Ícone HoroscopoZap" className="w-10 h-10 rounded-md flex-shrink-0" /> 
      <div className="flex-grow min-w-0"> 
        <p className="font-semibold text-sm truncate">Instalar HoroscopoZap</p> 
        {/* Display the app's domain */}
        <p className="text-xs text-muted-foreground truncate">{appUrl}</p> 
      </div>
      {/* Using a more prominent button style */}
      <Button onClick={onInstallClick} size="sm" variant="default" className="flex-shrink-0 px-4"> 
        Instalar
      </Button>
    </div>
  );
};

export default InstallPwaButton;
