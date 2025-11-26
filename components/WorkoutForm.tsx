
import React, { useState } from 'react';
import { WorkoutFormData, ExperienceLevel, WorkoutSplit, Gender } from '../types';

interface WorkoutFormProps {
  onSubmit: (data: WorkoutFormData) => void;
  onCancel: () => void;
}

const WorkoutForm: React.FC<WorkoutFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<WorkoutFormData>({
    name: '',
    gender: Gender.MALE,
    daysPerWeek: '4',
    durationPerDay: '60',
    focus: 'Mix',
    experience: ExperienceLevel.BEGINNER,
    split: WorkoutSplit.STANDARD
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-t-4 border-red-600">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Create Workout Plan</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Name Field */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Your Name (Namaskar) 🙏</label>
          <input 
            required type="text" name="name" value={formData.name} onChange={handleChange}
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="e.g. Rahul Kumar"
          />
        </div>

        {/* Gender Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Gender</label>
          <div className="flex gap-4">
            <label className={`
              flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all font-bold
              ${formData.gender === Gender.MALE ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600'}
            `}>
              <input type="radio" name="gender" value={Gender.MALE} checked={formData.gender === Gender.MALE} onChange={handleChange} className="hidden" />
              Male
            </label>
            <label className={`
              flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all font-bold
              ${formData.gender === Gender.FEMALE ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600'}
            `}>
              <input type="radio" name="gender" value={Gender.FEMALE} checked={formData.gender === Gender.FEMALE} onChange={handleChange} className="hidden" />
              Female
            </label>
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-lg font-bold text-gray-800 mb-2">Experience Level</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             {Object.values(ExperienceLevel).map((level) => (
                <label key={level} className={`
                  flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all text-center text-sm font-bold
                  ${formData.experience === level ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 hover:border-red-200 text-gray-600'}
                `}>
                  <input 
                    type="radio" name="experience" value={level} 
                    checked={formData.experience === level} onChange={handleChange}
                    className="hidden"
                  />
                  {level}
                </label>
             ))}
          </div>
        </div>

        {/* Split Selection (Only if Advanced or Intermediate with Strength Focus) */}
        {(formData.experience === ExperienceLevel.ADVANCED || (formData.experience === ExperienceLevel.INTERMEDIATE && formData.focus !== 'Cardio')) && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 animate-fadeIn">
            <label className="block text-lg font-bold text-red-800 mb-2">Choose Your Workout Split</label>
            <select 
              name="split" value={formData.split} onChange={handleChange}
              className="w-full p-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none bg-white"
            >
              <option value={WorkoutSplit.DOUBLE_MUSCLE}>Double Muscle (2 Body Parts)</option>
              <option value={WorkoutSplit.PPL}>Push Pull Legs (PPL)</option>
              <option value={WorkoutSplit.BRO_SPLIT}>Bro Split (1 Body Part)</option>
              <option value={WorkoutSplit.FULL_BODY}>Full Body</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Days Per Week */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Days per Week</label>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                <input 
                  type="range" name="daysPerWeek" min="1" max="7" step="1"
                  value={formData.daysPerWeek} onChange={handleChange}
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
                <span className="ml-4 text-xl font-bold text-red-600 w-8 text-center">{formData.daysPerWeek}</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Duration (Mins)</label>
              <input 
                type="number" name="durationPerDay" 
                value={formData.durationPerDay} onChange={handleChange}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
                placeholder="60"
              />
            </div>
        </div>

        {/* Focus */}
        <div>
          <label className="block text-lg font-bold text-gray-800 mb-2">Primary Focus</label>
          <select 
            name="focus" value={formData.focus} onChange={handleChange}
            className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none bg-white text-lg"
          >
            <option value="Mix">Mix (Cardio + Strength)</option>
            <option value="Strength">Strength Training / Muscle Building</option>
            <option value="Cardio">Cardio / Endurance</option>
          </select>
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            type="button" onClick={onCancel}
            className="flex-1 py-3 px-6 rounded-lg border-2 border-gray-300 text-gray-600 font-bold hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="flex-1 py-3 px-6 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg transform active:scale-95 transition-all"
          >
            Generate Plan
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkoutForm;
