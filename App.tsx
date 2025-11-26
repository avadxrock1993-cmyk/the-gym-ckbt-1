
import React, { useState } from 'react';
import Header from './components/Header';
import DietForm from './components/DietForm';
import WorkoutForm from './components/WorkoutForm';
import PlanDisplay from './components/PlanDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import { DietFormData, WorkoutFormData, PlanType } from './types';
import { generateDietPlan, generateWorkoutPlan } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'diet' | 'workout'>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  
  // Store form data to allow regeneration
  const [lastDietData, setLastDietData] = useState<DietFormData | null>(null);

  const reset = () => {
    setCurrentView('home');
    setGeneratedPlan(null);
    setIsLoading(false);
    setLastDietData(null);
  };

  const handleDietSubmit = async (data: DietFormData) => {
    setLastDietData(data);
    setIsLoading(true);
    const plan = await generateDietPlan(data);
    setGeneratedPlan(plan);
    setIsLoading(false);
  };

  const handleDietRegenerate = async (skippedMeals: string[]) => {
    if (!lastDietData) return;
    setGeneratedPlan(null); // Clear current view
    setIsLoading(true);
    const plan = await generateDietPlan(lastDietData, skippedMeals);
    setGeneratedPlan(plan);
    setIsLoading(false);
  };

  const handleWorkoutSubmit = async (data: WorkoutFormData) => {
    setIsLoading(true);
    const plan = await generateWorkoutPlan(data);
    setGeneratedPlan(plan);
    setIsLoading(false);
  };

  const handleCrossNavigate = (target: 'diet' | 'workout') => {
    setGeneratedPlan(null);
    setCurrentView(target);
  };

  // Render Logic
  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner message={currentView === 'diet' ? 'Cooking up your diet plan...' : 'Forging your workout routine...'} />;
    }

    if (generatedPlan) {
      return (
        <PlanDisplay 
          content={generatedPlan} 
          onReset={reset} 
          title={currentView === 'diet' ? 'Your Personalized Diet Plan' : 'Your Personalized Workout Plan'}
          onRegenerate={currentView === 'diet' ? handleDietRegenerate : undefined}
          currentPlanType={currentView === 'diet' ? 'diet' : 'workout'}
          onCrossNavigate={handleCrossNavigate}
        />
      );
    }

    if (currentView === 'diet') {
      return <DietForm onSubmit={handleDietSubmit} onCancel={reset} />;
    }

    if (currentView === 'workout') {
      return <WorkoutForm onSubmit={handleWorkoutSubmit} onCancel={reset} />;
    }

    // Home View
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-10">
        <div className="text-center max-w-2xl px-6">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            TRANSFORM YOUR BODY
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Get AI-powered personalized plans tailored to your specific goals and lifestyle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-6">
          {/* Diet Card */}
          <button 
            onClick={() => setCurrentView('diet')}
            className="group relative bg-white border-2 border-red-100 hover:border-red-600 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 text-left flex flex-col h-48 justify-center items-center gap-4"
          >
            <div>
              <h3 className="text-3xl font-extrabold text-gray-900 group-hover:text-red-600 transition-colors text-center">DIET PLAN</h3>
              <p className="mt-2 text-gray-500 font-medium text-center">Nutrition tailored to your taste.</p>
            </div>
            <div className="flex items-center text-red-600 font-bold">
              <span>Create Plan</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-2 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </button>

          {/* Workout Card */}
          <button 
            onClick={() => setCurrentView('workout')}
            className="group relative bg-white border-2 border-red-100 hover:border-red-600 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 text-left flex flex-col h-48 justify-center items-center gap-4"
          >
            <div>
              <h3 className="text-3xl font-extrabold text-gray-900 group-hover:text-red-600 transition-colors text-center">WORKOUT PLAN</h3>
              <p className="mt-2 text-gray-500 font-medium text-center">Exercises designed for your goals.</p>
            </div>
            <div className="flex items-center text-red-600 font-bold">
              <span>Create Plan</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-2 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onHomeClick={reset} />
      <main className="flex-grow flex flex-col items-center p-4">
        <div className="w-full max-w-4xl mt-6">
          {renderContent()}
        </div>
      </main>
      <footer className="bg-white border-t py-6 mt-12">
        <div className="text-center text-gray-500 text-sm font-semibold">
          &copy; {new Date().getFullYear()} THE GYM CKBT. Train Hard.
        </div>
      </footer>
    </div>
  );
};

export default App;
