
import React, { useState } from 'react';

interface TrackerSetupProps {
  onStartSession: (muscle: string) => void;
  onCancel: () => void;
}

const TrackerSetup: React.FC<TrackerSetupProps> = ({ onStartSession, onCancel }) => {
  const [target, setTarget] = useState('');
  const [customTarget, setCustomTarget] = useState('');

  const COMMON_TARGETS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Abs', 'Push Day', 'Pull Day'];

  const handleStart = () => {
    const finalTarget = customTarget || target;
    if (finalTarget) {
      onStartSession(finalTarget);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-t-4 border-red-600 animate-fadeIn">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">Start Live Workout</h2>
      <p className="text-gray-500 text-center mb-6">What are we training today?</p>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        {COMMON_TARGETS.map(t => (
          <button
            key={t}
            onClick={() => { setTarget(t); setCustomTarget(''); }}
            className={`p-3 rounded-lg font-bold border-2 transition-all ${target === t ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-red-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-1">Or type custom focus:</label>
        <input 
          type="text" 
          value={customTarget}
          onChange={(e) => { setCustomTarget(e.target.value); setTarget(''); }}
          placeholder="e.g. Glutes & Hamstrings"
          className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-4">
         <button onClick={onCancel} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-lg">Cancel</button>
         <button 
           onClick={handleStart} 
           disabled={!target && !customTarget}
           className="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg disabled:opacity-50 hover:bg-red-700 shadow-lg"
         >
           Start Session
         </button>
      </div>
    </div>
  );
};

export default TrackerSetup;
