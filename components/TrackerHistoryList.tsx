
import React, { useState, useEffect } from 'react';
import { SavedPlan, TrackerSession } from '../types';

interface TrackerHistoryListProps {
  onBack: () => void;
  onViewSession: (session: TrackerSession) => void;
}

const TrackerHistoryList: React.FC<TrackerHistoryListProps> = ({ onBack, onViewSession }) => {
  const [groupedHistory, setGroupedHistory] = useState<Record<string, SavedPlan[]>>({});
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('gym_history');
    if (raw) {
      try {
        const parsed: SavedPlan[] = JSON.parse(raw);
        // FILTER ONLY 'tracker' types
        const sessionsOnly = parsed.filter(h => h.type === 'tracker');
        
        if (sessionsOnly.length > 0) {
            setIsEmpty(false);
            const grouped = groupSessionsByDate(sessionsOnly);
            setGroupedHistory(grouped);
        } else {
            setIsEmpty(true);
        }
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  // Helper to group array by readable date headers
  const groupSessionsByDate = (sessions: SavedPlan[]) => {
    const groups: Record<string, SavedPlan[]> = {};
    
    // Sort by date descending first
    sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sessions.forEach(session => {
        const dateObj = new Date(session.date);
        let dateKey = dateObj.toLocaleDateString('en-US', { 
            weekday: 'short', month: 'long', day: 'numeric' 
        });

        // Check for Today / Yesterday
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (dateObj.toDateString() === today.toDateString()) {
            dateKey = 'Today';
        } else if (dateObj.toDateString() === yesterday.toDateString()) {
            dateKey = 'Yesterday';
        }

        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(session);
    });
    return groups;
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this workout log?")) {
      const raw = localStorage.getItem('gym_history');
      let allHistory: SavedPlan[] = raw ? JSON.parse(raw) : [];
      
      const updatedAll = allHistory.filter(h => h.id !== id);
      localStorage.setItem('gym_history', JSON.stringify(updatedAll));
      
      // Re-calculate local state
      const sessionsOnly = updatedAll.filter(h => h.type === 'tracker');
      if (sessionsOnly.length === 0) setIsEmpty(true);
      setGroupedHistory(groupSessionsByDate(sessionsOnly));
    }
  };

  const getMuscleColor = (title: string) => {
     const t = title.toLowerCase();
     if (t.includes('chest') || t.includes('push')) return 'bg-red-100 text-red-700 border-red-200';
     if (t.includes('back') || t.includes('pull')) return 'bg-blue-100 text-blue-700 border-blue-200';
     if (t.includes('leg') || t.includes('squat')) return 'bg-orange-100 text-orange-700 border-orange-200';
     if (t.includes('arm') || t.includes('bicep')) return 'bg-purple-100 text-purple-700 border-purple-200';
     return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 animate-fadeIn pb-20">
      
      {/* Premium Header */}
      <div className="bg-gray-900 text-white p-6 rounded-2xl mb-8 flex justify-between items-center shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 opacity-10 rounded-full transform translate-x-10 -translate-y-10"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
            THE GYM <span className="text-red-500">LOGS</span>
          </h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Your Training Journal</p>
        </div>
        <button onClick={onBack} className="relative z-10 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors backdrop-blur-sm border border-white/10">
          ← Back
        </button>
      </div>

      {isEmpty ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="text-6xl mb-4 opacity-20">🏋️‍♂️</div>
          <p className="text-gray-500 font-bold text-lg">No workouts recorded yet.</p>
          <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">Complete a session in the Tracker to start building your legacy.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedHistory).map((dateKey) => (
            <div key={dateKey} className="animate-slideIn">
              {/* Date Header */}
              <h3 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider mb-4 pl-2 border-l-4 border-red-500">
                {dateKey}
              </h3>
              
              <div className="space-y-4">
                {groupedHistory[dateKey].map((item) => {
                   const session = item.content as TrackerSession;
                   const totalExercises = session.exercises ? session.exercises.length : 0;
                   // Calculate total sets performed (only logs that exist)
                   const setsCompleted = session.exercises ? session.exercises.reduce((acc, ex) => acc + (ex.logs ? ex.logs.length : 0), 0) : 0;
                   const startTime = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                   return (
                    <div 
                      key={item.id}
                      onClick={() => onViewSession(session)}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-red-500 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                    >
                      <div className="p-5 flex justify-between items-start">
                        <div className="flex-1">
                            {/* Title & Time */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-gray-400">{startTime}</span>
                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getMuscleColor(item.title)}`}>
                                    {item.title}
                                </div>
                            </div>
                            
                            <h3 className="font-black text-gray-900 text-xl uppercase tracking-tight mb-4 group-hover:text-red-600 transition-colors">
                              {item.title} Workout
                            </h3>

                            {/* Stats Grid */}
                            <div className="flex gap-4">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Exercises</p>
                                    <p className="text-lg font-black text-gray-800">{totalExercises}</p>
                                </div>
                                <div className="w-px bg-gray-100"></div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Total Sets</p>
                                    <p className="text-lg font-black text-gray-800">{setsCompleted}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                            <button 
                                onClick={(e) => handleDelete(item.id, e)}
                                className="text-gray-300 hover:text-red-500 p-2 transition-colors rounded-full hover:bg-red-50"
                                title="Delete Log"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                </svg>
                            </button>
                            <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8z"/>
                                </svg>
                            </div>
                        </div>
                      </div>
                    </div>
                   );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackerHistoryList;
