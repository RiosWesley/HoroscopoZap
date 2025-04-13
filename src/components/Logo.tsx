
import React from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';

const Logo: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center h-20 w-20 mx-auto">
      <div className="absolute spinning">
        <Sparkles className="h-20 w-20 text-cosmic-purple opacity-70" />
      </div>
      <div className="absolute floating">
        <MessageCircle className="h-12 w-12 text-white fill-cosmic-pink" />
      </div>
    </div>
  );
};

export default Logo;