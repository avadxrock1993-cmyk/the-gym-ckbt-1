
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DietForm from './components/DietForm';
import WorkoutForm from './components/WorkoutForm';
import PlanDisplay from './components/PlanDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import { DietFormData, WorkoutFormData } from './types';
import { generateDietPlan, generateWorkoutPlan } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'diet' | 'workout'>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  const [lastDietData, setLastDietData] = useState<DietFormData | null>(null);
  const [lastWorkoutData, setLastWorkoutData] = useState<WorkoutFormData | null>(null);

  // Handle Mobile Back Button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
        if (event.state.view === 'home') {
          setGeneratedPlan(null);
        }
      } else {
        // Fallback for initial load or unknown state
        setCurrentView('home');
        setGeneratedPlan(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Initial Replace
    window.history.replaceState({ view: 'home' }, '');

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation Helper
  const navigate = (view: 'home' | 'diet' | 'workout') => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView(view);
    if (view === 'home') {
      setGeneratedPlan(null);
    }
    window.history.pushState({ view }, '');
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
    setGeneratedPlan(null);
    setIsLoading(true);
    const plan = await generateDietPlan(lastDietData, skippedMeals);
    setGeneratedPlan(plan);
    setIsLoading(false);
  };

  const handleWorkoutSubmit = async (data: WorkoutFormData) => {
    setLastWorkoutData(data);
    setIsLoading(true);
    const plan = await generateWorkoutPlan(data);
    setGeneratedPlan(plan);
    setIsLoading(false);
  };

  const handleCrossNavigate = (target: 'diet' | 'workout') => {
    setGeneratedPlan(null);
    navigate(target);
  };

  const renderContent = () => {
    if (isLoading) {
      let userName = '';
      let userGoal = '';

      if (currentView === 'diet' && lastDietData) {
        userName = lastDietData.name;
        userGoal = lastDietData.goal;
      } else if (currentView === 'workout' && lastWorkoutData) {
        userName = lastWorkoutData.name;
        userGoal = `${lastWorkoutData.focus} Focus`;
      }

      return (
        <LoadingSpinner 
          message={currentView === 'diet' ? 'Cooking up your diet plan...' : 'Forging your workout routine...'} 
          userName={userName}
          goal={userGoal}
        />
      );
    }

    if (generatedPlan) {
      return (
        <PlanDisplay 
          content={generatedPlan} 
          onReset={() => navigate('home')}
          title={currentView === 'diet' ? 'Your Personalized Diet Plan' : 'Your Personalized Workout Plan'}
          onRegenerate={currentView === 'diet' ? handleDietRegenerate : undefined}
          currentPlanType={currentView === 'diet' ? 'diet' : 'workout'}
          onCrossNavigate={handleCrossNavigate}
        />
      );
    }

    if (currentView === 'diet') {
      return <DietForm onSubmit={handleDietSubmit} onCancel={() => navigate('home')} />;
    }

    if (currentView === 'workout') {
      return <WorkoutForm onSubmit={handleWorkoutSubmit} onCancel={() => navigate('home')} />;
    }

    // Home View
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-4">
        <div className="text-center max-w-2xl px-6 flex flex-col items-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">
            TRANSFORM YOUR BODY
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-lg">
            Get AI-powered personalized plans tailored to your specific goals and lifestyle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-6">
          {/* Diet Card */}
          <button 
            onClick={() => navigate('diet')}
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
            onClick={() => navigate('workout')}
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
      <Header onHomeClick={() => navigate('home')} />
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
