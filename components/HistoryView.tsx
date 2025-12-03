
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
        const parsed: SavedPlan[] = JSON.parse(raw);
        // FILTER OUT 'tracker' types. Only show 'diet' and 'workout' plans here.
        const plansOnly = parsed.filter(h => h.type !== 'tracker');
        setHistory(plansOnly);
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this plan?")) {
      const raw = localStorage.getItem('gym_history');
      let allHistory: SavedPlan[] = raw ? JSON.parse(raw) : [];
      
      const updatedAll = allHistory.filter(h => h.id !== id);
      localStorage.setItem('gym_history', JSON.stringify(updatedAll));
      
      // Update local state
      setHistory(updatedAll.filter(h => h.type !== 'tracker'));
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
        <h2 className="text-2xl font-black text-gray-900 uppercase">My Plans</h2>
        <button onClick={onBack} className="text-sm font-bold text-gray-600 hover:text-red-600">
          ← Back Home
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">No saved plans found.</p>
          <p className="text-sm text-gray-400">Generate a Diet or Workout PDF to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div 
              key={item.id}
              onClick={() => onViewPlan(item)}
              className="bg-white p-5 rounded-xl shadow-md border border-gray-100 hover:border-red-300 transition-all cursor-pointer group hover:shadow-lg relative overflow-hidden"
            >
              <div className="absolute right-0 top-0 h-full w-1 bg-gray-200 group-hover:bg-red-500 transition-colors"></div>
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-full ${item.type === 'diet' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {item.type === 'diet' ? '🥗' : '💪'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg group-hover:text-red-600 transition-colors flex items-center gap-2">
                      {item.title}
                      <span className="text-xs font-normal text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">Click to View</span>
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">{formatDate(item.date)}</p>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => handleDelete(item.id, e)}
                  className="text-gray-300 hover:text-red-500 p-2 z-10 transition-colors"
                  title="Delete Record"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
