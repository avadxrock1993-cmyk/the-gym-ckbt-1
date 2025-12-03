
import React, { useEffect, useState } from 'react';
import { StructuredPlan, StructuredDay, SavedPlan, TrackerSession } from '../types';

interface PlanDaySelectorProps {
  plan: StructuredPlan;
  onSelectDay: (day: StructuredDay) => void;
  onCancel: () => void;
}

const PlanDaySelector: React.FC<PlanDaySelectorProps> = ({ plan, onSelectDay, onCancel }) => {
  const [completedDays, setCompletedDays] = useState<string[]>([]);

  useEffect(() => {
    // Check history to see what has been done in the last 7 days
    try {
      const raw = localStorage.getItem('gym_history');
      if (raw) {
        const history: SavedPlan[] = JSON.parse(raw);
        
        // Get start of the current week (or just look back 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentSessions = history
          .filter(h => h.type === 'tracker')
          .filter(h => new Date(h.date) > sevenDaysAgo)
          .map(h => h.title.toLowerCase());

        const completed: string[] = [];
        
        // Match plan days to history titles
        if (plan.days) {
            plan.days.forEach(day => {
            // Create fuzzy match keys
            const dayKey = day.dayName.toLowerCase(); // "day 1 - chest"
            const focusKey = (day.focus || '').toLowerCase(); // "chest"
            
            // Check if any recent session title contains the Day Name or matches Focus closely
            const isDone = recentSessions.some(title => {
                if (title.includes(dayKey)) return true;
                // Only match focus if it's specific enough (avoid matching generic terms wrongly)
                if (focusKey && title.includes(focusKey) && title.includes('workout')) return true;
                return false;
            });

            if (isDone) completed.push(day.dayName);
            });
        }

        setCompletedDays(completed);
      }
    } catch (e) {
      console.error("Error checking history", e);
    }
  }, [plan]);

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-t-4 border-red-600 animate-fadeIn">
      <div className="text-center mb-6">
         <h1 className="text-3xl font-black text-red-600 tracking-tighter uppercase italic">
            THE GYM <span className="text-gray-900">CKBT</span>
         </h1>
         <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Start from Plan</p>
      </div>

      <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Select a Workout</h2>
      <p className="text-gray-500 text-center mb-8">Which day from your plan do you want to train?</p>
      
      <div className="grid grid-cols-1 gap-4 mb-8">
        {plan.days && plan.days.length > 0 ? (
          plan.days.map((day, idx) => {
           const isCompleted = completedDays.includes(day.dayName);
           const exerciseCount = day.exercises ? day.exercises.length : 0;
           
           return (
             <button
               key={idx}
               onClick={() => onSelectDay(day)}
               className={`
                 flex flex-col items-start p-5 rounded-xl border-2 transition-all group relative overflow-hidden
                 ${isCompleted 
                    ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                    : 'border-gray-100 hover:border-red-500 hover:bg-red-50'}
               `}
             >
               {isCompleted && (
                 <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                   ✅ DONE RECENTLY
                 </div>
               )}

               <div className="flex justify-between w-full items-center mb-2">
                  <span className={`font-black text-lg uppercase ${isCompleted ? 'text-green-700' : 'text-red-600'}`}>
                    {day.dayName}
                  </span>
                  <span className="bg-white border border-gray-200 text-xs font-bold px-2 py-1 rounded-full group-hover:border-red-200">
                     {exerciseCount} Exercises
                  </span>
               </div>
               <div className="text-sm text-gray-500 font-medium">
                  Focus: {day.focus || 'General'}
               </div>
               <div className="mt-2 text-xs text-gray-400">
                  {day.exercises ? day.exercises.slice(0, 3).map(e => e?.name || 'Exercise').join(', ') : 'Click to view exercises'}...
               </div>
             </button>
           );
        })) : (
           <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
              No days found in this plan. Try regenerating the plan.
           </div>
        )}
      </div>

      <button 
        onClick={onCancel}
        className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200"
      >
        Cancel
      </button>
    </div>
  );
};

export default PlanDaySelector;
