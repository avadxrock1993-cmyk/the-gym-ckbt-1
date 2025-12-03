
import React from 'react';
import { StructuredPlan, StructuredDay } from '../types';

interface PlanDaySelectorProps {
  plan: StructuredPlan;
  onSelectDay: (day: StructuredDay) => void;
  onCancel: () => void;
}

const PlanDaySelector: React.FC<PlanDaySelectorProps> = ({ plan, onSelectDay, onCancel }) => {
  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-t-4 border-red-600 animate-fadeIn">
      <div className="text-center mb-6">
         <h1 className="text-3xl font-black text-red-600 tracking-tighter uppercase italic">
            THE GYM <span className="text-gray-900">CKBT</span>
         </h1>
         <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Start from Plan</p>
      </div>

      <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Select a Day</h2>
      <p className="text-gray-500 text-center mb-8">Which workout from your plan do you want to do today?</p>
      
      <div className="grid grid-cols-1 gap-4 mb-8">
        {plan.days.map((day, idx) => (
           <button
             key={idx}
             onClick={() => onSelectDay(day)}
             className="flex flex-col items-start p-5 rounded-xl border-2 border-gray-100 hover:border-red-500 hover:bg-red-50 transition-all group"
           >
             <div className="flex justify-between w-full items-center mb-2">
                <span className="text-red-600 font-black text-lg uppercase">{day.dayName}</span>
                <span className="bg-white border border-gray-200 text-xs font-bold px-2 py-1 rounded-full group-hover:border-red-200">
                   {day.exercises.length} Exercises
                </span>
             </div>
             <div className="text-sm text-gray-500 font-medium">
                Focus: {day.focus || 'General'}
             </div>
             <div className="mt-2 text-xs text-gray-400">
                {day.exercises.slice(0, 3).map(e => e.name).join(', ')}...
             </div>
           </button>
        ))}
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
