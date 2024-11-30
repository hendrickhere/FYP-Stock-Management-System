import React from 'react';
import { cn } from './utils';
import { Check } from 'lucide-react';

const Steps = ({ steps, currentStep = 0 }) => {
  return (
    <div className="w-full">
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          
          return (
            <div key={step.label} className="flex flex-col items-center relative">
              {/* Step connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute w-full h-1 top-4 left-[50%]",
                    (isCompleted || currentStep > index) 
                      ? "bg-blue-600" 
                      : "bg-gray-200"
                  )}
                />
              )}
              
              {/* Step circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center z-10",
                  isCompleted 
                    ? "bg-blue-600 text-white"
                    : isCurrent
                      ? "bg-blue-100 border-2 border-blue-600 text-blue-600"
                      : "bg-gray-100 border-2 border-gray-300 text-gray-400"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              
              {/* Step label */}
              <span 
                className={cn(
                  "mt-2 text-sm font-medium",
                  isCompleted 
                    ? "text-blue-600"
                    : isCurrent
                      ? "text-blue-600"
                      : "text-gray-500"
                )}
              >
                {step.label}
              </span>
              
              {/* Optional step description */}
              {step.description && (
                <span className="mt-1 text-xs text-gray-500">
                  {step.description}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { Steps };