import React from 'react';

const LoadingSpinner: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
      <p className="text-red-600 font-semibold animate-pulse text-center">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
