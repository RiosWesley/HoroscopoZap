
import React from 'react';

interface FloatingEmojiProps {
  emoji: string;
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
  duration?: number;
  animated?: boolean;
}

const FloatingEmoji: React.FC<FloatingEmojiProps> = ({ 
  emoji, 
  size = 'md',
  delay = 0,
  duration = 6,
  animated = true
}) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  const style = {
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  };

  return (
    <span 
      className={`inline-block ${sizeClasses[size]} ${animated ? 'floating' : ''}`}
      style={animated ? style : undefined}
    >
      {emoji}
    </span>
  );
};

export const FloatingEmojiGroup: React.FC = () => {
  const emojis = ['✨', '🔮', '💫', '⭐', '🌟', '💭', '💬', '💌', '🌠'];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {emojis.map((emoji, i) => (
        <div 
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 90}%`,
            top: `${Math.random() * 90}%`,
            opacity: Math.random() * 0.4 + 0.3,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        >
          <FloatingEmoji 
            emoji={emoji} 
            size={['sm', 'md', 'lg'][Math.floor(Math.random() * 3)] as 'sm' | 'md' | 'lg'}
            delay={Math.random() * 5}
            duration={Math.random() * 4 + 4}
          />
        </div>
      ))}
    </div>
  );
};

export default FloatingEmoji;
