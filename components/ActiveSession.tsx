
import React, { useState, useEffect } from 'react';
import { TrackerSession, TrackerSetLog, SavedPlan } from '../types';
import { generateAlternativeExercise } from '../services/geminiService';

interface ActiveSessionProps {
  session: TrackerSession;
  onFinish: (session: TrackerSession) => void;
  onCancel: () => void;
}

const ActiveSession: React.FC<ActiveSessionProps> = ({ session: initialSession, onFinish, onCancel }) => {
  const [session, setSession] = useState<TrackerSession>(initialSession);
  const [currentStep, setCurrentStep] = useState<'warmup' | 'workout' | 'summary'>('warmup');
  const [currentExIndex, setCurrentExIndex] = useState(0);
  
  // History / Previous Stats
  const [previousBest, setPreviousBest] = useState<string | null>(null);
  
  // Input State
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  // Loading state for skipping
  const [isReplacing, setIsReplacing] = useState(false);

  // --- AUTO SAVE LOGIC ---
  useEffect(() => {
    // Save to localStorage whenever session state changes
    // This ensures data persists on refresh/internet loss
    localStorage.setItem('current_workout_session', JSON.stringify(session));
  }, [session]);

  const currentExercise = session.exercises[currentExIndex];

  // Effect to find previous history for the current exercise
  useEffect(() => {
    if (currentStep !== 'workout') return;

    const findPreviousStats = () => {
      try {
        const rawHistory = localStorage.getItem('gym_history');
        if (!rawHistory) {
          setPreviousBest(null);
          return;
        }

        const history: SavedPlan[] = JSON.parse(rawHistory);
        const trackerSessions = history.filter(h => h.type === 'tracker' && typeof h.content !== 'string');

        let bestWeight = 0;
        let bestReps = 0;
        let found = false;

        trackerSessions.forEach(h => {
          const pastSession = h.content as TrackerSession;
          const match = pastSession.exercises.find(ex => 
            ex.name.toLowerCase().trim() === currentExercise.name.toLowerCase().trim()
          );

          if (match && match.logs.length > 0) {
            match.logs.forEach(log => {
              if (log.weight > bestWeight) {
                bestWeight = log.weight;
                bestReps = log.reps;
                found = true;
              }
            });
          }
        });

        if (found) {
          setPreviousBest(`${bestWeight}kg x ${bestReps}`);
        } else {
          setPreviousBest(null);
        }
      } catch (err) {
        console.error("Error reading history", err);
        setPreviousBest(null);
      }
    };

    findPreviousStats();
  }, [currentExercise.name, currentStep]);

  const handleLogSet = () => {
    if (!weight || !reps) return;
    
    const r = parseInt(reps);
    const w = parseFloat(weight);
    
    const maxTarget = parseInt(currentExercise.targetReps.split('-')[1] || currentExercise.targetReps);
    let suggestion = "Maintain weight.";
    if (r > maxTarget) suggestion = "Great job! Increase weight by 2.5kg next set.";
    if (r < maxTarget - 2) suggestion = "Decrease weight slightly to hit target reps.";

    const newLog: TrackerSetLog = {
      setNumber: currentExercise.logs.length + 1,
      weight: w,
      reps: r,
      suggestion
    };

    const updatedExercises = [...session.exercises];
    updatedExercises[currentExIndex].logs.push(newLog);
    
    setSession({ ...session, exercises: updatedExercises });
    
    setReps('');
  };

  const handleNextExercise = () => {
    if (currentExIndex < session.exercises.length - 1) {
      setCurrentExIndex(prev => prev + 1);
      setWeight('');
      setReps('');
      setPreviousBest(null); 
    } else {
      setCurrentStep('summary');
    }
  };

  const handleSkipExercise = async () => {
    if (!confirm("Do you want to skip this exercise and find a new one?")) return;
    
    setIsReplacing(true);
    try {
      const newExercise = await generateAlternativeExercise(currentExercise.name, session.targetMuscle);
      
      const updatedExercises = [...session.exercises];
      updatedExercises[currentExIndex] = newExercise; 
      
      setSession({ ...session, exercises: updatedExercises });
      setWeight('');
      setReps('');
      setPreviousBest(null);
      alert(`Replaced with: ${newExercise.name}`);

    } catch (e) {
      alert("Failed to find alternative. Moving to next.");
      handleNextExercise();
    }
    setIsReplacing(false);
  };

  const handleManualExit = () => {
      if (confirm("Are you sure you want to exit? Your progress so far is saved temporarily, but ending now will lose unsaved progress if you don't return.")) {
          // Clean up handled by parent if needed, but App.tsx handles the actual storage clear on route change
          onCancel();
      }
  };

  if (currentStep === 'warmup') {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-yellow-500 min-h-[500px] flex flex-col">
        
        {/* Branding */}
        <div className="text-center mb-6">
           <h2 className="text-2xl font-black text-red-600 tracking-tighter uppercase italic">
              THE GYM <span className="text-gray-900">CKBT</span>
           </h2>
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase">Warmup Routine</h2>
        <div className="space-y-3 mb-6 flex-grow">
          {session.warmup.map((act, idx) => (
             <div key={idx} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                <input type="checkbox" className="w-5 h-5 accent-yellow-600 mr-3" />
                <span className="font-semibold text-gray-800">{act}</span>
             </div>
          ))}
        </div>
        <div className="mt-auto space-y-3">
            <button 
            onClick={() => setCurrentStep('workout')}
            className="w-full py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 uppercase tracking-wider"
            >
            Start Workout 🏋️‍♂️
            </button>
            <button 
                onClick={handleManualExit}
                className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200"
            >
                Exit Session
            </button>
        </div>
      </div>
    );
  }

  if (currentStep === 'summary') {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg text-center">
        
        {/* Branding */}
        <div className="mb-6">
           <h2 className="text-3xl font-black text-red-600 tracking-tighter uppercase italic">
              THE GYM <span className="text-gray-900">CKBT</span>
           </h2>
        </div>

        <h2 className="text-3xl font-black text-green-600 mb-2">WORKOUT COMPLETE!</h2>
        <p className="text-gray-500 mb-6">Great session. Here is what you did:</p>
        
        <div className="text-left space-y-4 mb-8">
          {session.exercises.map((ex, idx) => (
            <div key={idx} className="border-b pb-2">
              <h4 className="font-bold">{ex.name}</h4>
              <p className="text-sm text-gray-600">{ex.logs.length} Sets Completed</p>
            </div>
          ))}
        </div>

        <button 
          onClick={() => onFinish(session)}
          className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl"
        >
          Save & Return Home
        </button>
      </div>
    );
  }

  // Workout View
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col min-h-[500px]">
      {/* Header with Branding */}
      <div className="bg-gray-900 text-white p-3 shadow-md z-10">
        <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-2">
           <h2 className="text-lg font-black tracking-tighter uppercase italic text-white">
              THE GYM <span className="text-red-500">CKBT</span>
           </h2>
           <button onClick={handleManualExit} className="text-xs bg-red-900 hover:bg-red-700 text-red-100 px-3 py-1 rounded font-bold uppercase transition-colors">
              Exit
           </button>
        </div>
        
        <div className="flex justify-between items-end">
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold text-gray-400 uppercase">Exercise {currentExIndex + 1} of {session.exercises.length}</h3>
            <h2 className="text-xl font-bold truncate pr-2 leading-tight">{currentExercise.name}</h2>
          </div>
        </div>
      </div>

      <div className="p-4 flex-grow flex flex-col overflow-y-auto">
        
        {/* Previous Best Badge */}
        {previousBest && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg flex items-center justify-between shadow-sm animate-fadeIn">
            <span className="text-xs font-bold uppercase tracking-wider">🏆 Your Personal Best</span>
            <span className="font-black text-lg">{previousBest}</span>
          </div>
        )}

        {/* Info Card */}
        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
           <div className="bg-gray-100 p-2 rounded">
             <p className="text-xs text-gray-500 uppercase">Sets</p>
             <p className="font-bold text-lg">{currentExercise.targetSets}</p>
           </div>
           <div className="bg-gray-100 p-2 rounded">
             <p className="text-xs text-gray-500 uppercase">Reps</p>
             <p className="font-bold text-lg">{currentExercise.targetReps}</p>
           </div>
           <div className="bg-gray-100 p-2 rounded">
             <p className="text-xs text-gray-500 uppercase">Rest</p>
             <p className="font-bold text-lg">{currentExercise.restTime}</p>
           </div>
        </div>

        {/* Logs */}
        <div className="flex-grow space-y-2 mb-4">
           {currentExercise.logs.map((log, i) => (
             <div key={i} className="flex justify-between items-center bg-green-50 p-3 rounded border border-green-100 animate-slideIn">
                <span className="font-bold text-green-800">Set {log.setNumber}</span>
                <span className="text-sm font-semibold">{log.weight}kg x {log.reps} reps</span>
             </div>
           ))}
           {currentExercise.logs.length > 0 && (
             <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded mt-2 border border-blue-100 font-medium">
               💡 AI Tip: {currentExercise.logs[currentExercise.logs.length - 1].suggestion}
             </div>
           )}
        </div>

        {/* Input Area */}
        {currentExercise.logs.length < currentExercise.targetSets ? (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-auto">
             <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-gray-700">Log Set {currentExercise.logs.length + 1}</p>
                <button 
                  onClick={handleSkipExercise}
                  disabled={isReplacing}
                  className="text-xs text-red-500 font-bold hover:underline disabled:text-gray-400"
                >
                  {isReplacing ? 'Finding new exercise...' : 'Skip & Find New →'}
                </button>
             </div>
             
             <div className="flex gap-3 mb-3">
               <input 
                 type="number" placeholder="kg" value={weight} onChange={e => setWeight(e.target.value)}
                 className="w-1/2 p-3 border-2 border-gray-200 focus:border-red-500 focus:outline-none rounded-lg text-lg font-bold text-center"
               />
               <input 
                 type="number" placeholder="reps" value={reps} onChange={e => setReps(e.target.value)}
                 className="w-1/2 p-3 border-2 border-gray-200 focus:border-red-500 focus:outline-none rounded-lg text-lg font-bold text-center"
               />
             </div>
             <button 
               onClick={handleLogSet}
               disabled={!weight || !reps}
               className="w-full py-3 bg-red-600 text-white font-bold rounded-lg disabled:opacity-50 hover:bg-red-700 transition-colors shadow-md active:scale-95 transform"
             >
               ✅ Log Set
             </button>
          </div>
        ) : (
          <div className="text-center py-4 mt-auto">
             <p className="text-green-600 font-bold mb-3 text-lg">✨ All sets completed!</p>
             <button 
               onClick={handleNextExercise}
               className="w-full py-4 bg-gray-900 text-white font-bold rounded-lg shadow-lg hover:bg-black transition-transform active:scale-95"
             >
               Next Exercise →
             </button>
          </div>
        )}
      </div>
      
      {/* Explicit Back/Exit Button */}
      <div className="bg-gray-50 p-3 border-t border-gray-200">
         <button 
            onClick={handleManualExit}
            className="w-full py-2 bg-white text-gray-500 font-bold rounded-lg border border-gray-300 hover:bg-gray-100"
         >
            ← Exit / Pause Session
         </button>
      </div>
    </div>
  );
};

export default ActiveSession;
