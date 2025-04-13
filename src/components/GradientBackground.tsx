
import React from 'react';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'default' | 'purple' | 'warm' | 'cool';
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ 
  children, 
  variant = 'default' 
}) => {
  const gradientClass = {
    default: 'bg-gradient-vibrant',
    purple: 'bg-gradient-purple-pink',
    warm: 'bg-gradient-warm',
    cool: 'bg-gradient-cool',
  }[variant];

  return (
    <div className={`min-h-screen ${gradientClass}`}>
      <div className="cosmic-container">
        {children}
      </div>
    </div>
  );
};

export default GradientBackground;
