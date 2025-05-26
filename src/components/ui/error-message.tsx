import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useStore } from '@/store';

interface ErrorMessageProps {
  text: string;
  actionText?: string;
  action?: () => void;
  showResetButton?: boolean;
}

export const ErrorMessage = ({ 
  text, 
  actionText = "Try Again", 
  action, 
  showResetButton = true 
}: ErrorMessageProps) => {
  const resetProgress = useStore(state => state.resetProgress);
  
  return (
    <div className="p-6 text-center border rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500 mr-2" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
      <p className="text-gray-600 mb-4">{text}</p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {action && (
          <Button 
            onClick={() => {
              action();
            }}
            className="bg-brand-teal hover:bg-teal-600"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {actionText}
          </Button>
        )}
        
        {showResetButton && (
          <Button 
            variant="outline" 
            onClick={() => resetProgress()}
            className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
          >
            Reset Progress
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage; 