
import React from 'react';
import { Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultCardProps {
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  className?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ 
  title, 
  children, 
  variant = 'default',
  className
}) => {
  const variantClasses = {
    default: 'bg-white bg-opacity-20',
    primary: 'bg-gradient-to-r from-cosmic-purple to-cosmic-darkPurple bg-opacity-90',
    secondary: 'bg-gradient-to-r from-cosmic-pink to-cosmic-purple bg-opacity-80',
    accent: 'bg-gradient-to-r from-cosmic-neonBlue to-cosmic-turquoise bg-opacity-80',
  }[variant];

  const textColorClass = variant === 'default' ? 'text-foreground' : 'text-white';

  return (
    <div className={cn('cosmic-card mb-6', variantClasses, className)}>
      <h3 className={`text-xl font-bold mb-3 ${textColorClass}`}>{title}</h3>
      <div className={textColorClass}>
        {children}
      </div>
    </div>
  );
};

export const ShareButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="fixed bottom-8 right-8 z-10 p-4 bg-cosmic-pink text-white rounded-full shadow-lg flex items-center justify-center hover:bg-cosmic-purple transition-colors"
    >
      <Share2 className="h-6 w-6" />
    </button>
  );
};

export default ResultCard;
