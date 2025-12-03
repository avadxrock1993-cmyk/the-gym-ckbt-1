
import React, { useState, useEffect } from 'react';
import { TrackerSession, TrackerSetLog, SavedPlan, TrackerExercise } from '../types';
import { generateAlternativeExercise } from '../services/geminiService';

interface ActiveSessionProps {
  session: TrackerSession;
  onFinish: (session: TrackerSession) => void;
  onCancel: () => void;
  userWeight?: number; // Added to calculate calories
}

const ActiveSession: React.FC<ActiveSessionProps> = ({ session: initialSession, onFinish, onCancel, userWeight = 70 }) => {
  const [session, setSession] = useState<TrackerSession>(initialSession);
  const [currentStep, setCurrentStep] = useState<'warmup' | 'workout' | 'summary'>('warmup');
  const [currentExIndex, setCurrentExIndex] = useState(0);
  
  // History / Previous Stats
  const [previousBest, setPreviousBest] = useState<string | null>(null);
  
  // Input State
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  // Skip / Replace State
  const [isReplacing, setIsReplacing] = useState(false);
  const [showSkipMenu, setShowSkipMenu] = useState(false);
  const [manualExName, setManualExName] = useState('');

  // Calorie Calculation State
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [lastBurnMsg, setLastBurnMsg] = useState('');

  // --- SAFE GUARD: Ensure exercises exist ---
  const hasExercises = session.exercises && session.exercises.length > 0;
  
  // Fallback exercise object to prevent crash in hooks if array is empty or index invalid
  const safeExercise = (hasExercises && session.exercises[currentExIndex]) ? session.exercises[currentExIndex] : null;
  const currentExercise = safeExercise || {
      name: 'Unknown Exercise',
      targetSets: 0,
      targetReps: '-',
      restTime: '-',
      logs: [] as TrackerSetLog[]
  };

  // --- AUTO SAVE LOGIC ---
  useEffect(() => {
    localStorage.setItem('current_workout_session', JSON.stringify(session));
  }, [session]);

  // Effect to find previous history for the current exercise
  useEffect(() => {
    if (currentStep !== 'workout' || !hasExercises || !currentExercise.name) return;

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
          if (!pastSession.exercises) return;

          const match = pastSession.exercises.find(ex => 
            ex && ex.name && ex.name.toLowerCase().trim() === currentExercise.name.toLowerCase().trim()
          );

          if (match && match.logs && match.logs.length > 0) {
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
  }, [currentExercise.name, currentStep, hasExercises]);

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
    if (updatedExercises[currentExIndex]) {
        updatedExercises[currentExIndex].logs.push(newLog);
        setSession({ ...session, exercises: updatedExercises });
    }
    setReps('');
  };

  const calculateCaloriesForExercise = (logs: TrackerSetLog[]) => {
    // Basic Estimate Formula for Weight Training:
    // Calories = (Total Volume * 0.0005) + (BodyWeight * 0.05 * NumberOfSets)
    // This is a rough gamified approximation.
    const totalVolume = logs.reduce((acc, log) => acc + (log.weight * log.reps), 0);
    const sets = logs.length;
    
    const estimatedBurn = (totalVolume * 0.0005) + (userWeight * 0.05 * sets);
    return Math.round(estimatedBurn);
  };

  const handleNextExercise = () => {
    // Calculate Calories for the finished exercise
    const burned = calculateCaloriesForExercise(currentExercise.logs);
    setCaloriesBurned(prev => prev + burned);
    
    if (burned > 0) {
        setLastBurnMsg(`🔥 Amazing! You burned approx ${burned} calories on ${currentExercise.name}!`);
        setTimeout(() => setLastBurnMsg(''), 4000);
    }

    if (currentExIndex < session.exercises.length - 1) {
      setCurrentExIndex(prev => prev + 1);
      setWeight('');
      setReps('');
      setPreviousBest(null); 
      setShowSkipMenu(false);
    } else {
      setCurrentStep('summary');
    }
  };

  const handleAiReplace = async () => {
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
      setShowSkipMenu(false);

    } catch (e) {
      alert("Failed to find alternative. Moving to next.");
      // Don't auto move, just stop loading
    }
    setIsReplacing(false);
  };

  const handleManualReplace = () => {
    if (!manualExName.trim()) return;

    const newExercise: TrackerExercise = {
      name: manualExName,
      targetSets: currentExercise.targetSets, // Preserve targets
      targetReps: currentExercise.targetReps,
      restTime: currentExercise.restTime,
      logs: []
    };

    const updatedExercises = [...session.exercises];
    updatedExercises[currentExIndex] = newExercise;
    
    setSession({ ...session, exercises: updatedExercises });
    setWeight('');
    setReps('');
    setPreviousBest(null);
    setManualExName('');
    setShowSkipMenu(false);
  };

  const handleManualExit = () => {
      if (confirm("Are you sure you want to exit? Your progress so far is saved temporarily, but ending now will lose unsaved progress if you don't return.")) {
          onCancel();
      }
  };

  // --- RENDER ERROR IF DATA INVALID ---
  if (!hasExercises) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg text-center flex flex-col items-center justify-center min-h-[300px]">
        <h2 className="text-2xl font-black text-red-600 mb-2">Error Loading Workout</h2>
        <p className="text-gray-600 mb-6">No exercises were found for this session. The generated plan might be empty.</p>
        <button 
          onClick={onCancel}
          className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300"
        >
          Go Back
        </button>
      </div>
    );
  }

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
          {session.warmup && session.warmup.length > 0 ? (
             session.warmup.map((act, idx) => (
               <div key={idx} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                  <input type="checkbox" className="w-5 h-5 accent-yellow-600 mr-3" />
                  <span className="font-semibold text-gray-800">{act}</span>
               </div>
             ))
          ) : (
             <div className="p-4 bg-gray-50 text-gray-500 italic rounded">5-10 mins of Light Cardio & Dynamic Stretching</div>
          )}
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
        <p className="text-gray-500 mb-2">Great session. Here is what you did:</p>
        
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
             <p className="text-red-800 font-bold text-sm uppercase">Total Est. Calories Burned</p>
             <p className="text-4xl font-black text-red-600">{caloriesBurned} 🔥</p>
        </div>
        
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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col min-h-[500px] relative">
      
      {/* Toast Notification for Calories */}
      {lastBurnMsg && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm font-bold px-4 py-2 rounded-full shadow-xl animate-fadeIn z-50 whitespace-nowrap">
           {lastBurnMsg}
        </div>
      )}

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

        {/* SKIP / REPLACE MENU */}
        {showSkipMenu && (
            <div className="mb-4 bg-orange-50 p-4 rounded-xl border-2 border-orange-200 animate-fadeIn">
                <h4 className="font-bold text-orange-800 mb-3 text-sm uppercase">Replace Exercise</h4>
                
                <div className="flex gap-2 mb-4">
                    <button 
                        onClick={handleAiReplace}
                        disabled={isReplacing}
                        className="flex-1 py-2 bg-orange-200 text-orange-800 font-bold rounded-lg hover:bg-orange-300 text-sm"
                    >
                        {isReplacing ? 'Asking AI...' : '🤖 Ask AI Suggestion'}
                    </button>
                </div>
                
                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-orange-200"></div>
                    <span className="flex-shrink-0 mx-4 text-orange-400 text-xs font-bold uppercase">OR Type Manual</span>
                    <div className="flex-grow border-t border-orange-200"></div>
                </div>

                <div className="mt-2">
                    <input 
                        type="text"
                        placeholder="Type Exercise Name..."
                        value={manualExName}
                        onChange={(e) => setManualExName(e.target.value)}
                        className="w-full p-2 border border-orange-300 rounded mb-2 text-sm focus:outline-none focus:border-orange-500"
                    />
                    <div className="flex gap-2">
                        <button 
                             onClick={() => setShowSkipMenu(false)}
                             className="flex-1 py-2 bg-white text-gray-500 font-bold rounded-lg border border-gray-300 text-sm"
                        >
                            Cancel
                        </button>
                        <button 
                             onClick={handleManualReplace}
                             disabled={!manualExName.trim()}
                             className="flex-1 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm"
                        >
                            Use Custom
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Input Area */}
        {currentExercise.logs.length < currentExercise.targetSets ? (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-auto">
             {!showSkipMenu && (
                <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-bold text-gray-700">Log Set {currentExercise.logs.length + 1}</p>
                    <button 
                    onClick={() => setShowSkipMenu(true)}
                    className="text-xs text-red-500 font-bold hover:underline"
                    >
                    Skip / Replace ↻
                    </button>
                </div>
             )}
             
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
