
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex justify-center items-center space-x-2 py-4">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div 
          key={i}
          className={cn(
            "w-2.5 h-2.5 rounded-full transition-all duration-300",
            i < currentStep 
              ? "bg-cosmic-darkPurple scale-100" 
              : i === currentStep 
                ? "bg-cosmic-purple scale-125 pulsing" 
                : "bg-cosmic-purple/30"
          )}
        >
          {i < currentStep && (
            <span className="sr-only">
              <Check className="h-3 w-3" />
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
