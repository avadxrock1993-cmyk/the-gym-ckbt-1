
import React, { useState, useEffect } from 'react';
import { SavedPlan, TrackerSession, TrackerSetLog } from '../types';

interface TrackerHistoryListProps {
  onBack: () => void;
  onViewSession: (session: TrackerSession) => void;
}

const TrackerHistoryList: React.FC<TrackerHistoryListProps> = ({ onBack, onViewSession }) => {
  const [groupedHistory, setGroupedHistory] = useState<Record<string, SavedPlan[]>>({});
  const [isEmpty, setIsEmpty] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

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
            
            // Auto-expand the first date (usually Today/most recent)
            const firstKey = Object.keys(grouped)[0];
            if (firstKey) setExpandedDate(firstKey);
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

  const toggleDate = (dateKey: string) => {
    if (expandedDate === dateKey) {
        setExpandedDate(null);
    } else {
        setExpandedDate(dateKey);
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
  
  // Calculate or retrieve calorie count
  const getSessionCalories = (session: TrackerSession) => {
    if (session.totalCaloriesBurned !== undefined) {
        return session.totalCaloriesBurned;
    }
    
    // Fallback calculation for old sessions
    let totalVolume = 0;
    const defaultWeight = 70; // Assume 70kg user weight for fallback
    let sets = 0;

    if (session.exercises) {
        session.exercises.forEach(ex => {
            if (ex.logs) {
                sets += ex.logs.length;
                ex.logs.forEach(log => {
                    if (log.weight > 0) totalVolume += (log.weight * log.reps);
                    else totalVolume += (defaultWeight * 0.6 * log.reps);
                });
            }
        });
    }
    
    return Math.round((totalVolume * 0.0005) + (defaultWeight * 0.05 * sets));
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
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Daily Records</p>
        </div>
        <button onClick={onBack} className="relative z-10 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors backdrop-blur-sm border border-white/10">
          ← Back
        </button>
      </div>

      {isEmpty ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="text-6xl mb-4 opacity-20">📅</div>
          <p className="text-gray-500 font-bold text-lg">No history found.</p>
          <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">Your completed workouts will appear here date-wise.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(groupedHistory).map((dateKey) => {
             const sessions = groupedHistory[dateKey];
             const isExpanded = expandedDate === dateKey;
             const totalWorkouts = sessions.length;
             
             // Calculate Daily Total Calories
             const dailyCalories = sessions.reduce((acc, item) => {
                 const session = item.content as TrackerSession;
                 return acc + getSessionCalories(session);
             }, 0);
             
             return (
                <div key={dateKey} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Date Tile Header - Clickable */}
                    <div 
                        onClick={() => toggleDate(dateKey)}
                        className={`p-5 flex justify-between items-center cursor-pointer transition-colors border-l-4 ${isExpanded ? 'bg-red-50 border-red-600' : 'bg-white hover:bg-gray-50 border-gray-300'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${isExpanded ? 'bg-red-200 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                                </svg>
                            </div>
                            <div>
                                <h3 className={`font-black text-lg uppercase tracking-tight ${isExpanded ? 'text-red-700' : 'text-gray-800'}`}>
                                    {dateKey}
                                </h3>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs font-bold uppercase tracking-wide">
                                    <span className="text-gray-400">{totalWorkouts} {totalWorkouts === 1 ? 'Session' : 'Sessions'}</span>
                                    <span className="text-red-500 font-extrabold">🔥 {dailyCalories} Cal</span>
                                </div>
                            </div>
                        </div>
                        <div className={`transform transition-transform ${isExpanded ? 'rotate-180 text-red-600' : 'text-gray-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                            </svg>
                        </div>
                    </div>

                    {/* Expandable Content (Workout List) */}
                    {isExpanded && (
                        <div className="bg-gray-50 p-4 space-y-3 border-t border-gray-100 animate-fadeIn">
                             {sessions.map((item) => {
                                const session = item.content as TrackerSession;
                                const setsCompleted = session.exercises ? session.exercises.reduce((acc, ex) => acc + (ex.logs ? ex.logs.length : 0), 0) : 0;
                                const startTime = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const calories = getSessionCalories(session);

                                return (
                                    <div 
                                      key={item.id}
                                      onClick={() => onViewSession(session)}
                                      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-red-300 cursor-pointer flex justify-between items-center group transition-all"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getMuscleColor(item.title)}`}>
                                                    {item.title}
                                                </span>
                                                <span className="text-xs text-gray-400 font-bold">• {startTime}</span>
                                            </div>
                                            <div className="flex gap-4 mt-2">
                                                <div>
                                                    <span className="text-gray-400 text-[10px] font-bold uppercase block">Exercises</span>
                                                    <span className="font-bold text-gray-800">{session.exercises?.length || 0}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 text-[10px] font-bold uppercase block">Total Sets</span>
                                                    <span className="font-bold text-gray-800">{setsCompleted}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 text-[10px] font-bold uppercase block">Burned</span>
                                                    <span className="font-bold text-red-600">🔥 {calories}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                             <button 
                                                onClick={(e) => handleDelete(item.id, e)}
                                                className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-gray-100"
                                                title="Delete"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                                </svg>
                                            </button>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="text-gray-300 group-hover:text-red-600 transition-colors" fill="currentColor" viewBox="0 0 16 16">
                                                <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                                            </svg>
                                        </div>
                                    </div>
                                );
                             })}
                        </div>
                    )}
                </div>
             );
          })}
        </div>
      )}
    </div>
  );
};

export default TrackerHistoryList;
