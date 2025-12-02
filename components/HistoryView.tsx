
import React, { useState, useEffect } from 'react';
import { SavedPlan, TrackerSession } from '../types';

interface HistoryViewProps {
  onBack: () => void;
  onViewPlan: (plan: SavedPlan) => void;
  onRepeatSession: (session: TrackerSession) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ onBack, onViewPlan, onRepeatSession }) => {
  const [history, setHistory] = useState<SavedPlan[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('gym_history');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setHistory(parsed);
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this record?")) {
      const updated = history.filter(h => h.id !== id);
      setHistory(updated);
      localStorage.setItem('gym_history', JSON.stringify(updated));
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 animate-fadeIn">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <h2 className="text-2xl font-black text-gray-900 uppercase">My History</h2>
        <button onClick={onBack} className="text-sm font-bold text-gray-600 hover:text-red-600">
          ← Back Home
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">No history found yet.</p>
          <p className="text-sm text-gray-400">Generate a plan or finish a workout to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div 
              key={item.id}
              onClick={() => onViewPlan(item)}
              className="bg-white p-4 rounded-xl shadow-md border border-gray-100 hover:border-red-300 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${item.type === 'diet' ? 'bg-green-100 text-green-600' : item.type === 'tracker' ? 'bg-gray-900 text-white' : 'bg-red-100 text-red-600'}`}>
                    {item.type === 'diet' ? '🥗' : item.type === 'tracker' ? '⏱️' : '💪'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg group-hover:text-red-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">{formatDate(item.date)}</p>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => handleDelete(item.id, e)}
                  className="text-gray-400 hover:text-red-500 p-2"
                >
                  🗑️
                </button>
              </div>

              {item.type === 'tracker' && typeof item.content !== 'string' && (
                <div className="mt-4 pl-14">
                  <div className="flex gap-2 text-xs text-gray-500 mb-3">
                     <span className="bg-gray-100 px-2 py-1 rounded">{(item.content as TrackerSession).exercises.length} Exercises</span>
                     <span className="bg-gray-100 px-2 py-1 rounded">{(item.content as TrackerSession).exercises.reduce((acc, ex) => acc + ex.logs.length, 0)} Sets</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRepeatSession(item.content as TrackerSession);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-colors"
                  >
                    🔁 Repeat This Workout
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
