
import React from 'react';
import { cn } from '@/lib/utils';

interface ContactBubbleProps {
  name: string;
  messageCount: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  highlight?: boolean; // Added highlight prop
}

const ContactBubble: React.FC<ContactBubbleProps> = ({ 
  name, 
  messageCount, 
  size = 'md',
  color,
  highlight = false // Default to false 
}) => {
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-lg'
  };
  
  // Generate a deterministic color based on the name if none provided
  const generateColor = (name: string) => {
    const colors = [
      'bg-cosmic-purple text-white',
      'bg-cosmic-pink text-white',
      'bg-cosmic-neonBlue text-white',
      'bg-cosmic-turquoise text-white',
      'bg-cosmic-indigo text-white',
      'bg-amber-400 text-white',
      'bg-emerald-500 text-white'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const colorClass = color || generateColor(name);
  
  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        "rounded-full flex items-center justify-center font-medium",
        sizeClasses[size],
        colorClass,
        highlight && "ring-2 ring-yellow-300 ring-offset-1" // Apply highlight style if enabled
      )}>
        {initials}
      </div>
      <span className="text-xs mt-1 font-medium truncate max-w-14 text-center">{name}</span>
      <span className="text-xs opacity-70">{messageCount} msgs</span>
    </div>
  );
};

export default ContactBubble;
