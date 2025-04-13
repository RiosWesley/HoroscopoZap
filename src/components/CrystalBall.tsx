
import React from 'react';

interface CrystalBallProps {
  size?: 'sm' | 'md' | 'lg';
}

const CrystalBall: React.FC<CrystalBallProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  return (
    <div className={`relative ${sizeClasses[size]} mx-auto`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-300 to-transparent opacity-40 blur-sm spinning"></div>
      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-cosmic-purple/80 to-cosmic-pink/50 backdrop-blur-sm spinning-reverse"></div>
      <div className="absolute inset-2 rounded-full bg-white/30 backdrop-blur-md spinning"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-white">✨</span>
      </div>
    </div>
  );
};

export default CrystalBall;
