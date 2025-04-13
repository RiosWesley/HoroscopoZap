
import React, { useState, useEffect } from 'react';

interface AnimatedTextProps {
  phrases: string[];
  interval?: number;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ phrases, interval = 3000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const changeInterval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % phrases.length);
        setIsVisible(true);
      }, 500); // Half a second to fade out before changing text
      
    }, interval);
    
    return () => clearInterval(changeInterval);
  }, [phrases.length, interval]);

  return (
    <div className="h-8 flex items-center justify-center">
      <p 
        className={`text-center font-medium transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        {phrases[currentIndex]}
      </p>
    </div>
  );
};

export default AnimatedText;
