
import React from 'react';
import { TrackerSession } from '../types';

interface TrackerHistoryDetailsProps {
  session: TrackerSession;
  onBack: () => void;
  onRepeat: () => void;
}

const TrackerHistoryDetails: React.FC<TrackerHistoryDetailsProps> = ({ session, onBack, onRepeat }) => {
  const totalSets = session.exercises.reduce((acc, ex) => acc + ex.logs.length, 0);
  const dateStr = new Date(session.startTime).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden animate-fadeIn mb-8">
      {/* Header */}
      <div className="bg-gray-900 text-white p-6 relative">
        <button 
          onClick={onBack}
          className="absolute top-6 left-4 text-gray-400 hover:text-white font-bold text-sm uppercase tracking-wide"
        >
          ← Back
        </button>
        <div className="text-center mt-4">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-red-500">{session.targetMuscle}</h2>
          <p className="text-gray-400 text-sm font-medium">{dateStr}</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 border-b border-gray-100">
        <div className="p-4 text-center border-r border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-bold">Exercises</p>
          <p className="text-2xl font-black text-gray-800">{session.exercises.length}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-gray-500 uppercase font-bold">Total Sets</p>
          <p className="text-2xl font-black text-gray-800">{totalSets}</p>
        </div>
      </div>

      {/* Exercises List */}
      <div className="p-6 space-y-8">
        {session.exercises.map((ex, idx) => (
          <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 p-3 border-b border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-800 text-lg">{idx + 1}. {ex.name}</span>
              <span className="text-xs font-semibold bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">
                Target: {ex.targetSets} sets x {ex.targetReps}
              </span>
            </div>
            
            <div className="p-0">
              {ex.logs.length === 0 ? (
                <div className="p-4 text-center text-gray-400 italic text-sm">Skipped or no sets recorded.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="py-2 px-4 text-left font-semibold">Set</th>
                      <th className="py-2 px-4 text-center font-semibold">Weight</th>
                      <th className="py-2 px-4 text-center font-semibold">Reps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ex.logs.map((log, logIdx) => (
                      <tr key={logIdx} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-gray-600 font-bold">#{log.setNumber}</td>
                        <td className="py-3 px-4 text-center font-medium">{log.weight} kg</td>
                        <td className="py-3 px-4 text-center font-medium">{log.reps} reps</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Action */}
      <div className="p-6 bg-gray-50 border-t border-gray-100">
        <button 
          onClick={onRepeat}
          className="w-full py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-transform active:scale-95 uppercase tracking-wider"
        >
          Repeat This Workout 🔁
        </button>
      </div>
    </div>
  );
};

export default TrackerHistoryDetails;
