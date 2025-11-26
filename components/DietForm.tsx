
import React, { useState } from 'react';
import { DietFormData, DietPreference, DietGoal, Gender } from '../types';

interface DietFormProps {
  onSubmit: (data: DietFormData) => void;
  onCancel: () => void;
}

const DietForm: React.FC<DietFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<DietFormData>({
    name: '',
    gender: Gender.MALE,
    age: '',
    weight: '',
    height: '',
    preference: DietPreference.VEG,
    goal: DietGoal.WEIGHT_LOSS,
    wakeupTime: '',
    breakfast: '',
    lunch: '',
    eveningSnack: '',
    postWorkout: '',
    dinner: ''
  });

  // Height Unit State: true = cm, false = ft/in
  const [isMetric, setIsMetric] = useState(true);
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process height before submitting
    let finalHeight = formData.height;
    if (!isMetric) {
      finalHeight = `${heightFt}ft ${heightIn}in`;
    } else {
      finalHeight = `${formData.height} cm`;
    }

    onSubmit({ ...formData, height: finalHeight });
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-t-4 border-red-600">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Create Diet Plan</h2>
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

        {/* Essential Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Age (Years)</label>
            <input 
              required type="number" name="age" value={formData.age} onChange={handleChange}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="e.g. 25"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Weight (kg)</label>
            <input 
              required type="number" name="weight" value={formData.weight} onChange={handleChange}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="e.g. 70"
            />
          </div>
          
          {/* Height Section with Toggle */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="block text-sm font-bold text-gray-700">Height</label>
              <button 
                type="button" 
                onClick={() => setIsMetric(!isMetric)}
                className="text-xs font-bold text-red-600 hover:underline uppercase"
              >
                Switch to {isMetric ? 'Feet/Inch' : 'CM'}
              </button>
            </div>
            
            {isMetric ? (
              <input 
                required={isMetric} type="number" name="height" value={formData.height} onChange={handleChange}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors" placeholder="e.g. 175 (cm)"
              />
            ) : (
              <div className="flex gap-2">
                <input 
                  required={!isMetric} type="number" placeholder="Ft" value={heightFt} onChange={(e) => setHeightFt(e.target.value)}
                  className="w-1/2 p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
                />
                <input 
                  required={!isMetric} type="number" placeholder="In" value={heightIn} onChange={(e) => setHeightIn(e.target.value)}
                  className="w-1/2 p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Goal Selection */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-lg font-bold text-gray-800 mb-3 text-center">Your Goal</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
             {Object.values(DietGoal).map((goal) => (
                <label key={goal} className={`
                  flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all text-center text-sm font-bold
                  ${formData.goal === goal ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 hover:border-red-200 text-gray-600'}
                `}>
                  <input 
                    type="radio" name="goal" value={goal} 
                    checked={formData.goal === goal} onChange={handleChange}
                    className="hidden"
                  />
                  {goal}
                </label>
             ))}
          </div>
        </div>

        {/* Dietary Preference - Main Ask */}
        <div className="bg-red-50 p-6 rounded-lg border-2 border-red-100">
          <label className="block text-xl font-extrabold text-red-700 mb-4 text-center">Diet Preference</label>
          <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-8">
            <label className="flex items-center cursor-pointer group p-2">
              <input 
                type="radio" name="preference" value={DietPreference.VEG} 
                checked={formData.preference === DietPreference.VEG} onChange={handleChange}
                className="w-6 h-6 text-red-600 focus:ring-red-500 accent-red-600"
              />
              <span className="ml-3 text-lg font-bold text-gray-800 group-hover:text-red-600 transition-colors">Vegetarian</span>
            </label>
            <label className="flex items-center cursor-pointer group p-2">
              <input 
                type="radio" name="preference" value={DietPreference.NON_VEG} 
                checked={formData.preference === DietPreference.NON_VEG} onChange={handleChange}
                className="w-6 h-6 text-red-600 focus:ring-red-500 accent-red-600"
              />
              <span className="ml-3 text-lg font-bold text-gray-800 group-hover:text-red-600 transition-colors">Non-Veg</span>
            </label>
            <label className="flex items-center cursor-pointer group p-2">
              <input 
                type="radio" name="preference" value={DietPreference.BOTH} 
                checked={formData.preference === DietPreference.BOTH} onChange={handleChange}
                className="w-6 h-6 text-red-600 focus:ring-red-500 accent-red-600"
              />
              <span className="ml-3 text-lg font-bold text-gray-800 group-hover:text-red-600 transition-colors">Both</span>
            </label>
          </div>
        </div>

        {/* Optional Daily Routine */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Daily Routine <span className="text-sm font-normal text-gray-500 ml-2">(Optional)</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Wakeup Time</label>
              <input type="text" name="wakeupTime" value={formData.wakeupTime} onChange={handleChange} className="mt-1 w-full p-2 bg-gray-50 border rounded focus:border-red-500 focus:outline-none" placeholder="e.g. 7:00 AM" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Breakfast</label>
              <input type="text" name="breakfast" value={formData.breakfast} onChange={handleChange} className="mt-1 w-full p-2 bg-gray-50 border rounded focus:border-red-500 focus:outline-none" placeholder="Current breakfast" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Lunch</label>
              <input type="text" name="lunch" value={formData.lunch} onChange={handleChange} className="mt-1 w-full p-2 bg-gray-50 border rounded focus:border-red-500 focus:outline-none" placeholder="Current lunch" />
            </div>
             <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Evening Snacks</label>
              <input type="text" name="eveningSnack" value={formData.eveningSnack} onChange={handleChange} className="mt-1 w-full p-2 bg-gray-50 border rounded focus:border-red-500 focus:outline-none" placeholder="Tea/Coffee etc." />
            </div>
             <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Post Workout Meal</label>
              <input type="text" name="postWorkout" value={formData.postWorkout} onChange={handleChange} className="mt-1 w-full p-2 bg-gray-50 border rounded focus:border-red-500 focus:outline-none" placeholder="Shake/Eggs etc." />
            </div>
             <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Dinner</label>
              <input type="text" name="dinner" value={formData.dinner} onChange={handleChange} className="mt-1 w-full p-2 bg-gray-50 border rounded focus:border-red-500 focus:outline-none" placeholder="Current dinner" />
            </div>
          </div>
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

export default DietForm;
