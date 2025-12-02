
import React, { useState } from 'react';
import { TrackerSession, TrackerSetLog } from '../types';

interface ActiveSessionProps {
  session: TrackerSession;
  onFinish: (session: TrackerSession) => void;
  onCancel: () => void;
}

const ActiveSession: React.FC<ActiveSessionProps> = ({ session: initialSession, onFinish, onCancel }) => {
  const [session, setSession] = useState<TrackerSession>(initialSession);
  const [currentStep, setCurrentStep] = useState<'warmup' | 'workout' | 'summary'>('warmup');
  const [currentExIndex, setCurrentExIndex] = useState(0);
  
  // Input State
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  const currentExercise = session.exercises[currentExIndex];

  const handleLogSet = () => {
    if (!weight || !reps) return;
    
    const r = parseInt(reps);
    const w = parseFloat(weight);
    
    // Simple Logic for Recommendation
    // Parse target reps "8-12" -> max 12
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
    
    // Clear inputs
    setReps('');
  };

  const handleNextExercise = () => {
    if (currentExIndex < session.exercises.length - 1) {
      setCurrentExIndex(prev => prev + 1);
      setWeight('');
      setReps('');
    } else {
      setCurrentStep('summary');
    }
  };

  if (currentStep === 'warmup') {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-yellow-500">
        <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase">Warmup Routine</h2>
        <div className="space-y-3 mb-6">
          {session.warmup.map((act, idx) => (
             <div key={idx} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                <input type="checkbox" className="w-5 h-5 accent-yellow-600 mr-3" />
                <span className="font-semibold text-gray-800">{act}</span>
             </div>
          ))}
        </div>
        <button 
          onClick={() => setCurrentStep('workout')}
          className="w-full py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 uppercase tracking-wider"
        >
          Start Workout 🏋️‍♂️
        </button>
      </div>
    );
  }

  if (currentStep === 'summary') {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg text-center">
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
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase">Exercise {currentExIndex + 1} of {session.exercises.length}</h3>
          <h2 className="text-xl font-bold truncate pr-2">{currentExercise.name}</h2>
        </div>
        <button onClick={onCancel} className="text-xs bg-gray-800 px-3 py-1 rounded">Exit</button>
      </div>

      <div className="p-4 flex-grow flex flex-col">
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
        <div className="flex-grow space-y-2 mb-4 overflow-y-auto max-h-48">
           {currentExercise.logs.map((log, i) => (
             <div key={i} className="flex justify-between items-center bg-green-50 p-3 rounded border border-green-100">
                <span className="font-bold text-green-800">Set {log.setNumber}</span>
                <span className="text-sm">{log.weight}kg x {log.reps} reps</span>
             </div>
           ))}
           {currentExercise.logs.length > 0 && (
             <div className="bg-blue-50 text-blue-800 text-xs p-2 rounded mt-2 border border-blue-100">
               💡 AI Tip: {currentExercise.logs[currentExercise.logs.length - 1].suggestion}
             </div>
           )}
        </div>

        {/* Input Area */}
        {currentExercise.logs.length < currentExercise.targetSets ? (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
             <p className="text-sm font-bold text-gray-700 mb-2">Log Set {currentExercise.logs.length + 1}</p>
             <div className="flex gap-3 mb-3">
               <input 
                 type="number" placeholder="kg" value={weight} onChange={e => setWeight(e.target.value)}
                 className="w-1/2 p-3 border rounded-lg text-lg font-bold text-center"
               />
               <input 
                 type="number" placeholder="reps" value={reps} onChange={e => setReps(e.target.value)}
                 className="w-1/2 p-3 border rounded-lg text-lg font-bold text-center"
               />
             </div>
             <button 
               onClick={handleLogSet}
               disabled={!weight || !reps}
               className="w-full py-3 bg-red-600 text-white font-bold rounded-lg disabled:opacity-50"
             >
               ✅ Log Set
             </button>
          </div>
        ) : (
          <div className="text-center py-4">
             <p className="text-green-600 font-bold mb-3">All sets completed!</p>
             <button 
               onClick={handleNextExercise}
               className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg"
             >
               Next Exercise →
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveSession;
