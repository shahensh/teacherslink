import React from 'react';
import { CheckCircle } from 'lucide-react';

const VerifiedBadge = ({ size = 'sm', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className="relative">
        <CheckCircle 
          className={`${sizeClasses[size]} text-blue-600 fill-current`}
        />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default VerifiedBadge;
