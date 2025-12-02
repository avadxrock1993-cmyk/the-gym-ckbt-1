
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DietForm from './components/DietForm';
import WorkoutForm from './components/WorkoutForm';
import PlanDisplay from './components/PlanDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import TrackerSetup from './components/TrackerSetup';
import ActiveSession from './components/ActiveSession';
import HistoryView from './components/HistoryView';
import TrackerHistoryDetails from './components/TrackerHistoryDetails';
import { DietFormData, WorkoutFormData, TrackerSession, SavedPlan } from './types';
import { generateDietPlan, generateWorkoutPlan, generateWorkoutSession } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'diet' | 'workout' | 'tracker-setup' | 'tracker-active' | 'history' | 'tracker-details'>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  const [lastDietData, setLastDietData] = useState<DietFormData | null>(null);
  const [lastWorkoutData, setLastWorkoutData] = useState<WorkoutFormData | null>(null);
  
  // Tracker State
  const [activeSession, setActiveSession] = useState<TrackerSession | null>(null);
  const [selectedHistorySession, setSelectedHistorySession] = useState<TrackerSession | null>(null);

  // Handle Mobile Back Button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
        if (event.state.view === 'home') {
          setGeneratedPlan(null);
          setActiveSession(null);
          setSelectedHistorySession(null);
        }
      } else {
        setCurrentView('home');
        setGeneratedPlan(null);
        setActiveSession(null);
        setSelectedHistorySession(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.history.replaceState({ view: 'home' }, '');
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (view: typeof currentView) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView(view);
    if (view === 'home') {
      setGeneratedPlan(null);
      setActiveSession(null);
      setSelectedHistorySession(null);
    }
    window.history.pushState({ view }, '');
  };

  const savePlanToHistory = (type: 'diet' | 'workout', title: string, content: string) => {
    const historyItem: SavedPlan = {
      id: Date.now().toString(),
      type,
      date: new Date().toISOString(),
      title,
      content
    };
    const existing = localStorage.getItem('gym_history');
    const history = existing ? JSON.parse(existing) : [];
    localStorage.setItem('gym_history', JSON.stringify([historyItem, ...history]));
  };

  const handleDietSubmit = async (data: DietFormData) => {
    setLastDietData(data);
    setIsLoading(true);
    const plan = await generateDietPlan(data);
    setGeneratedPlan(plan);
    savePlanToHistory('diet', `Diet Plan for ${data.goal}`, plan);
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
    savePlanToHistory('workout', `Workout: ${data.focus}`, plan);
    setIsLoading(false);
  };

  // Tracker Handlers
  const handleStartTracker = async (muscle: string, exerciseCount: number) => {
    setIsLoading(true);
    try {
      const session = await generateWorkoutSession(muscle, exerciseCount);
      setActiveSession(session);
      navigate('tracker-active');
    } catch (e) {
      alert("Failed to create session. Please check connection.");
    }
    setIsLoading(false);
  };

  const handleFinishSession = (session: TrackerSession) => {
    const historyItem: SavedPlan = {
      id: Date.now().toString(),
      type: 'tracker',
      date: new Date().toISOString(),
      title: `${session.targetMuscle} Workout`,
      content: session
    };
    const existing = localStorage.getItem('gym_history');
    const history = existing ? JSON.parse(existing) : [];
    localStorage.setItem('gym_history', JSON.stringify([historyItem, ...history]));
    
    alert("Workout Saved to History! 💪");
    navigate('home');
  };

  const handleViewSavedPlan = (plan: SavedPlan) => {
    if (plan.type === 'tracker') {
      // Show details view for tracker history
      setSelectedHistorySession(plan.content as TrackerSession);
      navigate('tracker-details');
      return; 
    }
    setGeneratedPlan(plan.content as string);
    // Determine view based on type to render correct PlanDisplay props
    if (plan.type === 'diet') {
      setCurrentView('diet'); // Reuses logic but bypasses form
    } else {
      setCurrentView('workout');
    }
  };

  const handleRepeatSession = (oldSession: TrackerSession) => {
    // Reset logs for a fresh start
    const newSession = {
      ...oldSession,
      startTime: new Date().toISOString(),
      exercises: oldSession.exercises.map(ex => ({ ...ex, logs: [] }))
    };
    setActiveSession(newSession);
    navigate('tracker-active');
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
      } else if (currentView === 'tracker-setup') {
        userGoal = "Preparing AI Session...";
      }

      return (
        <LoadingSpinner 
          message={currentView === 'tracker-setup' ? 'AI is creating your live session...' : (currentView === 'diet' ? 'Cooking up your diet plan...' : 'Forging your workout routine...')} 
          userName={userName}
          goal={userGoal}
        />
      );
    }

    if (currentView === 'history') {
      return (
        <HistoryView 
          onBack={() => navigate('home')} 
          onViewPlan={handleViewSavedPlan}
          onRepeatSession={handleRepeatSession}
        />
      );
    }

    if (currentView === 'tracker-details' && selectedHistorySession) {
      return (
        <TrackerHistoryDetails 
          session={selectedHistorySession}
          onBack={() => navigate('history')}
          onRepeat={() => handleRepeatSession(selectedHistorySession)}
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

    if (currentView === 'diet') return <DietForm onSubmit={handleDietSubmit} onCancel={() => navigate('home')} />;
    if (currentView === 'workout') return <WorkoutForm onSubmit={handleWorkoutSubmit} onCancel={() => navigate('home')} />;
    
    if (currentView === 'tracker-setup') return <TrackerSetup onStartSession={handleStartTracker} onCancel={() => navigate('home')} />;
    if (currentView === 'tracker-active' && activeSession) return <ActiveSession session={activeSession} onFinish={handleFinishSession} onCancel={() => navigate('home')} />;

    // Home View
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-4">
        <div className="text-center max-w-2xl px-6 flex flex-col items-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">
            TRANSFORM YOUR BODY
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-lg">
            Get AI-powered personalized plans and track your daily workouts live.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl px-6">
          {/* Diet Card */}
          <button 
            onClick={() => navigate('diet')}
            className="group relative bg-white border-2 border-red-100 hover:border-red-600 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 text-left flex flex-col h-56 justify-center items-center gap-4"
          >
            <div>
              <h3 className="text-2xl font-extrabold text-gray-900 group-hover:text-red-600 transition-colors text-center">DIET PLAN</h3>
              <p className="mt-2 text-gray-500 font-medium text-center text-sm">Nutrition tailored to your taste.</p>
            </div>
            <div className="flex items-center text-red-600 font-bold bg-red-50 px-4 py-2 rounded-full">
              <span>Create Plan</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </div>
          </button>

          {/* Workout Card */}
          <button 
            onClick={() => navigate('workout')}
            className="group relative bg-white border-2 border-red-100 hover:border-red-600 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 text-left flex flex-col h-56 justify-center items-center gap-4"
          >
            <div>
              <h3 className="text-2xl font-extrabold text-gray-900 group-hover:text-red-600 transition-colors text-center">WORKOUT PLAN</h3>
              <p className="mt-2 text-gray-500 font-medium text-center text-sm">Routine designed for your goals.</p>
            </div>
            <div className="flex items-center text-red-600 font-bold bg-red-50 px-4 py-2 rounded-full">
              <span>Create Plan</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </div>
          </button>

          {/* AI Tracker Card */}
          <button 
            onClick={() => navigate('tracker-setup')}
            className="group relative bg-gray-900 border-2 border-gray-800 hover:border-red-500 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 text-left flex flex-col h-56 justify-center items-center gap-4"
          >
            <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">NEW</div>
            <div>
              <h3 className="text-2xl font-extrabold text-white group-hover:text-red-500 transition-colors text-center">AI TRACKER</h3>
              <p className="mt-2 text-gray-400 font-medium text-center text-sm">Interactive Live Session.</p>
            </div>
            <div className="flex items-center text-gray-900 font-bold bg-white px-4 py-2 rounded-full group-hover:bg-red-600 group-hover:text-white transition-colors">
              <span>Start Workout</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </div>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        onHomeClick={() => navigate('home')} 
        onTrackerClick={() => navigate('tracker-setup')}
        onHistoryClick={() => navigate('history')}
      />
      <main className="flex-grow flex flex-col items-center p-4">
        <div className="w-full max-w-5xl mt-6">
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
