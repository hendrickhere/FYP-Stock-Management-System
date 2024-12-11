import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = React.forwardRef((props, ref) => {
  return (
    <Loader2 
      className="h-4 w-4 animate-spin" 
      ref={ref} 
      {...props} 
    />
  );
});

Spinner.displayName = "Spinner";