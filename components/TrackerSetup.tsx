
import React, { useState, useEffect } from 'react';
import { SavedPlan } from '../types';

interface TrackerSetupProps {
  onStartSession: (muscle: string, exerciseCount: number) => void;
  onStartManual: (muscle: string, exerciseCount: number) => void; // New Prop
  onCancel: () => void;
  onViewHistory: () => void;
}

const TrackerSetup: React.FC<TrackerSetupProps> = ({ onStartSession, onStartManual, onCancel, onViewHistory }) => {
  const [target, setTarget] = useState('');
  const [customTarget, setCustomTarget] = useState('');
  const [exerciseCount, setExerciseCount] = useState(6);
  
  // Push Day Specific State
  const [pushFocus, setPushFocus] = useState<'Chest' | 'Shoulder' | null>(null);
  const [recommendedPushFocus, setRecommendedPushFocus] = useState<'Chest' | 'Shoulder' | null>(null);

  const COMMON_TARGETS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Abs', 'Push Day', 'Pull Day'];

  useEffect(() => {
    try {
      const rawHistory = localStorage.getItem('gym_history');
      if (rawHistory) {
        const history: SavedPlan[] = JSON.parse(rawHistory);
        const pushSessions = history
          .filter(h => h.type === 'tracker' && h.title.includes('Push Day'))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (pushSessions.length > 0) {
          const lastSessionTitle = pushSessions[0].title;
          if (lastSessionTitle.includes('Chest Focused')) {
            setRecommendedPushFocus('Shoulder');
          } else if (lastSessionTitle.includes('Shoulder Focused')) {
            setRecommendedPushFocus('Chest');
          }
        }
      }
    } catch (e) {
      console.error("Error reading history for recommendation", e);
    }
  }, []);

  const handleTargetClick = (t: string) => {
    setTarget(t);
    setCustomTarget('');
    setPushFocus(null);
  };

  const getFinalTarget = () => {
    let finalTarget = customTarget || target;
    if (finalTarget === 'Push Day' && pushFocus) {
      finalTarget = `Push Day (${pushFocus} Focused)`;
    }
    return finalTarget;
  };

  const handleStartAI = () => {
    const finalTarget = getFinalTarget();
    if (finalTarget) {
      onStartSession(finalTarget, exerciseCount);
    }
  };

  const handleStartManual = () => {
    const finalTarget = getFinalTarget();
    if (finalTarget) {
      onStartManual(finalTarget, exerciseCount);
    }
  };

  const isStartDisabled = (!target && !customTarget) || (target === 'Push Day' && !pushFocus);

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-t-4 border-red-600 animate-fadeIn">
      
      {/* Branding Header */}
      <div className="text-center mb-6 border-b border-gray-100 pb-4 relative">
         <h1 className="text-3xl font-black text-red-600 tracking-tighter uppercase italic">
            THE GYM <span className="text-gray-900">CKBT</span>
         </h1>
         <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">AI Personal Trainer</p>
      </div>

      <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Start Live Workout</h2>
      <p className="text-gray-500 text-center mb-6">What are we training today?</p>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        {COMMON_TARGETS.map(t => (
          <button
            key={t}
            onClick={() => handleTargetClick(t)}
            className={`p-3 rounded-lg font-bold border-2 transition-all ${target === t ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-red-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Push Day Specific Sub-Selection */}
      {target === 'Push Day' && (
        <div className="mb-6 bg-red-50 p-4 rounded-xl border border-red-200 animate-fadeIn">
          <p className="text-sm font-bold text-red-800 mb-3 text-center">Select Push Focus:</p>
          <div className="flex gap-3">
            <button
              onClick={() => setPushFocus('Chest')}
              className={`flex-1 p-3 rounded-lg border-2 font-bold relative ${pushFocus === 'Chest' ? 'bg-white border-red-600 text-red-600' : 'bg-white border-transparent text-gray-600 hover:bg-gray-50'}`}
            >
              Chest Focused
              {recommendedPushFocus === 'Chest' && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                  Recommended
                </span>
              )}
            </button>
            <button
              onClick={() => setPushFocus('Shoulder')}
              className={`flex-1 p-3 rounded-lg border-2 font-bold relative ${pushFocus === 'Shoulder' ? 'bg-white border-red-600 text-red-600' : 'bg-white border-transparent text-gray-600 hover:bg-gray-50'}`}
            >
              Shoulder Focused
              {recommendedPushFocus === 'Shoulder' && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                  Recommended
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-1">Or type custom focus:</label>
        <input 
          type="text" 
          value={customTarget}
          onChange={(e) => { setCustomTarget(e.target.value); setTarget(''); setPushFocus(null); }}
          placeholder="e.g. Glutes & Hamstrings"
          className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
        />
      </div>

      <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-2">
           <label className="block text-sm font-bold text-gray-800">Number of Exercises</label>
           <span className="text-xl font-black text-red-600 bg-white px-3 py-1 rounded border border-gray-200 shadow-sm">{exerciseCount}</span>
        </div>
        <input 
          type="range" 
          min="1" max="10" step="1"
          value={exerciseCount}
          onChange={(e) => setExerciseCount(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-600"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
         <button 
           onClick={handleStartAI} 
           disabled={isStartDisabled}
           className="py-4 bg-red-600 text-white font-bold rounded-lg disabled:opacity-50 hover:bg-red-700 shadow-lg flex flex-col items-center justify-center gap-1"
         >
           <span className="text-lg">🤖 Generate with AI</span>
           <span className="text-xs font-normal opacity-90">Auto-suggests exercises</span>
         </button>
         
         <button 
           onClick={handleStartManual} 
           disabled={isStartDisabled}
           className="py-4 bg-gray-800 text-white font-bold rounded-lg disabled:opacity-50 hover:bg-gray-900 shadow-lg flex flex-col items-center justify-center gap-1"
         >
           <span className="text-lg">✍️ Create Manually</span>
           <span className="text-xs font-normal opacity-90">You choose exercises</span>
         </button>
      </div>

      <button onClick={onCancel} className="w-full py-3 text-gray-600 font-bold bg-gray-100 rounded-lg hover:bg-gray-200 mb-2">
        Cancel
      </button>
         
      {/* Enhanced Log Button */}
      <button onClick={onViewHistory} className="w-full py-3 mt-2 text-red-600 font-bold bg-white border-2 border-red-100 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
        <span>📜</span> View Workout Logs
      </button>
    </div>
  );
};

export default TrackerSetup;
