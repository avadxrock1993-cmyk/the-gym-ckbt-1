
import React, { useState, useEffect } from 'react';

const QUOTES = [
  "No Pain, No Gain. 💪",
  "Your body can stand almost anything. It’s your mind that you have to convince.",
  "Sore today, strong tomorrow.",
  "Discipline is doing what needs to be done, even if you don't want to do it.",
  "Don't stop when you're tired. Stop when you're done.",
  "Train Insane or Remain the Same.",
  "Consistency is the key to success.",
  "Eat big, lift big, get big.",
  "Sweat is just fat crying.",
  "Light weight baby! 🏋️‍♂️"
];

interface LoadingSpinnerProps {
  message: string;
  userName?: string;
  goal?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, userName, goal }) => {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 3000); // Change quote every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fadeIn">
      
      {/* Brand Name with Pulse Animation */}
      <div className="relative mb-8">
         <h2 className="text-4xl md:text-5xl font-black text-red-600 tracking-tighter uppercase italic relative z-10">
            THE GYM <span className="text-gray-900">CKBT</span>
         </h2>
      </div>

      {/* Spinner */}
      <div className="relative w-16 h-16 mb-8">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-red-600 rounded-full animate-spin border-t-transparent"></div>
      </div>

      {/* Dynamic Status Message */}
      <p className="text-xl font-bold text-gray-800 mb-2">{message}</p>

      {/* User Info Overlay */}
      {(userName || goal) && (
        <div className="mb-6 flex flex-col items-center">
           {userName && <p className="text-lg text-gray-700">For: <span className="font-black text-red-600 text-xl">{userName}</span></p>}
           {goal && <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">Target: {goal}</p>}
        </div>
      )}

      {/* Rotating Quotes */}
      <div className="bg-red-50 p-6 rounded-xl border border-red-100 max-w-md w-full shadow-sm mt-2">
        <p className="text-red-600 font-bold italic text-lg transition-opacity duration-500 ease-in-out">
          "{QUOTES[quoteIndex]}"
        </p>
      </div>

    </div>
  );
};

export default LoadingSpinner;
