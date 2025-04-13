
import React from 'react';
import FloatingEmoji from './FloatingEmoji';

interface EmojiData {
  emoji: string;
  count: number;
}

interface EmojiCloudProps {
  emojis: EmojiData[];
  maxEmojis?: number;
}

const EmojiCloud: React.FC<EmojiCloudProps> = ({ 
  emojis,
  maxEmojis = 10
}) => {
  // Sort by count and take top N
  const topEmojis = [...emojis]
    .sort((a, b) => b.count - a.count)
    .slice(0, maxEmojis);
  
  // Get max count for scaling
  const maxCount = Math.max(...topEmojis.map(e => e.count));
  
  return (
    <div className="flex flex-wrap justify-center gap-2 py-4">
      {topEmojis.map((emojiData, index) => {
        // Scale size based on count (between 1x and 2.5x)
        const scale = 1 + ((emojiData.count / maxCount) * 1.5);
        const size = scale > 2 ? 'lg' : scale > 1.5 ? 'md' : 'sm';
        
        return (
          <div key={index} className="relative flex flex-col items-center">
            <FloatingEmoji 
              emoji={emojiData.emoji} 
              size={size}
              animated={false}
            />
            <span className="text-xs mt-1 opacity-70">{emojiData.count}x</span>
          </div>
        );
      })}
      
      {emojis.length === 0 && (
        <p className="text-sm opacity-70 py-2">Nenhum emoji encontrado nas mensagens.</p>
      )}
    </div>
  );
};

export default EmojiCloud;
