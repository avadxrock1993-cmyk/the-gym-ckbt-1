
import React, { useState, useEffect } from 'react';
import { SavedPlan, TrackerSession } from '../types';

interface TrackerHistoryListProps {
  onBack: () => void;
  onViewSession: (session: TrackerSession) => void;
}

const TrackerHistoryList: React.FC<TrackerHistoryListProps> = ({ onBack, onViewSession }) => {
  const [history, setHistory] = useState<SavedPlan[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('gym_history');
    if (raw) {
      try {
        const parsed: SavedPlan[] = JSON.parse(raw);
        // FILTER ONLY 'tracker' types.
        const sessionsOnly = parsed.filter(h => h.type === 'tracker');
        setHistory(sessionsOnly);
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this workout log?")) {
      const raw = localStorage.getItem('gym_history');
      let allHistory: SavedPlan[] = raw ? JSON.parse(raw) : [];
      
      const updatedAll = allHistory.filter(h => h.id !== id);
      localStorage.setItem('gym_history', JSON.stringify(updatedAll));
      
      setHistory(updatedAll.filter(h => h.type === 'tracker'));
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 animate-fadeIn">
      <div className="bg-gray-900 text-white p-6 rounded-xl mb-6 flex justify-between items-center shadow-lg">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
            THE GYM <span className="text-red-500">LOGS</span>
          </h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Your Training Journal</p>
        </div>
        <button onClick={onBack} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors">
          ← Back
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <p className="text-gray-500 font-medium text-lg">No workouts recorded yet.</p>
          <p className="text-sm text-gray-400 mt-2">Complete a session in the Tracker to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
             const session = item.content as TrackerSession;
             const totalExercises = session.exercises ? session.exercises.length : 0;
             const totalSets = session.exercises ? session.exercises.reduce((acc, ex) => acc + (ex.logs ? ex.logs.length : 0), 0) : 0;

             return (
              <div 
                key={item.id}
                onClick={() => onViewSession(session)}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-gray-900 transition-all cursor-pointer group relative"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-lg text-2xl">
                      🏋️‍♂️
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight group-hover:text-red-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-bold uppercase mt-1">{formatDate(item.date)}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => handleDelete(item.id, e)}
                    className="text-gray-300 hover:text-red-600 p-2 transition-colors"
                  >
                    🗑️
                  </button>
                </div>

                <div className="mt-4 flex gap-3">
                   <div className="bg-gray-50 px-3 py-1 rounded border border-gray-100 text-xs font-bold text-gray-600">
                     {totalExercises} Exercises
                   </div>
                   <div className="bg-gray-50 px-3 py-1 rounded border border-gray-100 text-xs font-bold text-gray-600">
                     {totalSets} Sets
                   </div>
                </div>
              </div>
             );
          })}
        </div>
      )}
    </div>
  );
};

export default TrackerHistoryList;
