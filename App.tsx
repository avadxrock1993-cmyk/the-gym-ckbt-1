
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
import TrackerHistoryList from './components/TrackerHistoryList';
import PlanDaySelector from './components/PlanDaySelector'; // NEW
import { DietFormData, WorkoutFormData, TrackerSession, SavedPlan, StructuredPlan, StructuredDay } from './types';
import { generateDietPlan, generateWorkoutPlan, generateWorkoutSession, convertHtmlPlanToStructured } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'diet' | 'workout' | 'tracker-setup' | 'tracker-active' | 'history' | 'tracker-history-list' | 'tracker-details' | 'plan-day-selector'>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  const [lastDietData, setLastDietData] = useState<DietFormData | null>(null);
  const [lastWorkoutData, setLastWorkoutData] = useState<WorkoutFormData | null>(null);
  
  // Tracker State
  const [activeSession, setActiveSession] = useState<TrackerSession | null>(null);
  const [selectedHistorySession, setSelectedHistorySession] = useState<TrackerSession | null>(null);
  
  // Parsed Plan State (for Follow Plan feature)
  const [parsedPlan, setParsedPlan] = useState<StructuredPlan | null>(null);

  useEffect(() => {
    const savedInterruptedSession = localStorage.getItem('current_workout_session');
    if (savedInterruptedSession) {
      try {
        const parsedSession = JSON.parse(savedInterruptedSession);
        setActiveSession(parsedSession);
        setCurrentView('tracker-active');
        window.history.replaceState({ view: 'tracker-active' }, '');
      } catch (e) {
        localStorage.removeItem('current_workout_session');
      }
    }
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        if (currentView === 'tracker-active' && event.state.view !== 'tracker-active') {
           const confirmExit = window.confirm("Workout in progress! Going back will pause/exit. Are you sure?");
           if (!confirmExit) {
             window.history.pushState({ view: 'tracker-active' }, '');
             return;
           } else {
             localStorage.removeItem('current_workout_session');
           }
        }
        setCurrentView(event.state.view);
      } else {
        setCurrentView('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView]);

  const navigate = (view: typeof currentView) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (currentView === 'tracker-active' && view !== 'tracker-active') {
       localStorage.removeItem('current_workout_session');
    }
    setCurrentView(view);
    if (view === 'home') {
      setGeneratedPlan(null);
      setActiveSession(null);
      setSelectedHistorySession(null);
      setParsedPlan(null);
    }
    window.history.pushState({ view }, '');
  };

  const savePlanToHistory = (type: 'diet' | 'workout', title: string, content: string) => {
    const existing = localStorage.getItem('gym_history');
    let history: SavedPlan[] = [];
    try {
        history = existing ? JSON.parse(existing) : [];
        if (!Array.isArray(history)) history = [];
    } catch (e) { history = []; }

    const historyItem: SavedPlan = {
      id: Date.now().toString(),
      type,
      date: new Date().toISOString(),
      title,
      content
    };
    try {
        localStorage.setItem('gym_history', JSON.stringify([historyItem, ...history]));
    } catch (e) {
        alert("Storage Full! Could not save history.");
    }
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

  const handleStartTracker = async (muscle: string, exerciseCount: number) => {
    setIsLoading(true);
    try {
      const session = await generateWorkoutSession(muscle, exerciseCount);
      setActiveSession(session);
      localStorage.setItem('current_workout_session', JSON.stringify(session));
      navigate('tracker-active');
    } catch (e) {
      alert("Failed to create session.");
    }
    setIsLoading(false);
  };
  
  const handleFollowPlan = async () => {
    if (!generatedPlan) return;
    setIsLoading(true);
    try {
       const structured = await convertHtmlPlanToStructured(generatedPlan);
       setParsedPlan(structured);
       navigate('plan-day-selector');
    } catch (e) {
       alert("Could not read plan structure. Please try generating a new plan.");
    }
    setIsLoading(false);
  };

  const handleStartStructuredDay = (day: StructuredDay) => {
    // We map the day exercises directly to the session.
    // NOTE: We use the Day Name (e.g. "Day 1 - Chest") as the targetMuscle.
    // This ensures it appears in history as "Day 1..." so users can see they followed the plan.
    const session: TrackerSession = {
       targetMuscle: day.dayName, // Use the specific day name for history logging
       warmup: ["5 mins Treadmill/Cycle", "Dynamic Stretching", "Arm Circles", "Torso Twists"], // Default warmup
       exercises: day.exercises.map(ex => ({
          ...ex,
          logs: [] // Ensure logs are empty to start fresh
       })),
       startTime: new Date().toISOString()
    };
    setActiveSession(session);
    localStorage.setItem('current_workout_session', JSON.stringify(session));
    navigate('tracker-active');
  };

  const handleFinishSession = (session: TrackerSession) => {
    const existing = localStorage.getItem('gym_history');
    let history: SavedPlan[] = [];
    try {
        history = existing ? JSON.parse(existing) : [];
        if (!Array.isArray(history)) history = [];
    } catch (e) { history = []; }

    const historyItem: SavedPlan = {
      id: Date.now().toString(),
      type: 'tracker',
      date: new Date().toISOString(),
      title: session.targetMuscle, // This will now show "Day 1 - Chest" if followed from plan
      content: session
    };
    
    try {
        localStorage.setItem('gym_history', JSON.stringify([historyItem, ...history]));
        localStorage.removeItem('current_workout_session');
        alert("Workout Saved to Logs! 💪");
        navigate('home');
    } catch (e) {
        alert("Storage Full!");
    }
  };

  const handleViewSavedPlan = (plan: SavedPlan) => {
    // This function handles plans from the MAIN history (Diet/Workout only)
    setGeneratedPlan(plan.content as string);
    setCurrentView(plan.type === 'diet' ? 'diet' : 'workout');
  };
  
  const handleViewTrackerSession = (session: TrackerSession) => {
    setSelectedHistorySession(session);
    navigate('tracker-details');
  };

  const handleRepeatSession = (oldSession: TrackerSession) => {
    const newSession = {
      ...oldSession,
      startTime: new Date().toISOString(),
      exercises: oldSession.exercises.map(ex => ({ ...ex, logs: [] }))
    };
    setActiveSession(newSession);
    localStorage.setItem('current_workout_session', JSON.stringify(newSession));
    navigate('tracker-active');
  };
  
  // Get user weight for calorie calculation
  const getUserWeight = () => {
    if (lastDietData?.weight) return parseFloat(lastDietData.weight);
    // Rough estimate if not available in current session
    return 70;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <LoadingSpinner 
          message={currentView.includes('tracker') || currentView === 'plan-day-selector' ? 'Reading Plan & Preparing Session...' : 'Generating Plan...'} 
          userName={lastDietData?.name || lastWorkoutData?.name}
          goal={lastDietData?.goal || lastWorkoutData?.focus}
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

    if (currentView === 'tracker-history-list') {
      return (
        <TrackerHistoryList 
          onBack={() => navigate('tracker-setup')}
          onViewSession={handleViewTrackerSession}
        />
      );
    }

    if (currentView === 'tracker-details' && selectedHistorySession) {
      return (
        <TrackerHistoryDetails 
          session={selectedHistorySession}
          onBack={() => navigate('tracker-history-list')}
          onRepeat={() => handleRepeatSession(selectedHistorySession)}
        />
      );
    }

    if (generatedPlan && (currentView === 'diet' || currentView === 'workout')) {
      return (
        <PlanDisplay 
          content={generatedPlan} 
          onReset={() => navigate('home')}
          title={currentView === 'diet' ? 'Your Diet Plan' : 'Your Workout Plan'}
          onRegenerate={currentView === 'diet' ? handleDietRegenerate : undefined}
          currentPlanType={currentView === 'diet' ? 'diet' : 'workout'}
          onCrossNavigate={(target) => { setGeneratedPlan(null); navigate(target); }}
          onFollowPlan={currentView === 'workout' ? handleFollowPlan : undefined} // Only for workout
        />
      );
    }
    
    if (currentView === 'plan-day-selector' && parsedPlan) {
        return (
            <PlanDaySelector 
                plan={parsedPlan} 
                onSelectDay={handleStartStructuredDay}
                onCancel={() => navigate('workout')}
            />
        );
    }

    if (currentView === 'diet') return <DietForm onSubmit={handleDietSubmit} onCancel={() => navigate('home')} />;
    if (currentView === 'workout') return <WorkoutForm onSubmit={handleWorkoutSubmit} onCancel={() => navigate('home')} />;
    
    if (currentView === 'tracker-setup') {
      return (
        <TrackerSetup 
          onStartSession={handleStartTracker} 
          onCancel={() => navigate('home')} 
          onViewHistory={() => navigate('tracker-history-list')}
        />
      );
    }
    
    if (currentView === 'tracker-active' && activeSession) {
        return (
            <ActiveSession 
                session={activeSession} 
                onFinish={handleFinishSession} 
                onCancel={() => navigate('home')}
                userWeight={getUserWeight()}
            />
        );
    }

    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-4">
        <div className="text-center max-w-2xl px-6 flex flex-col items-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">TRANSFORM YOUR BODY</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-lg">Get AI-powered personalized plans and track your daily workouts live.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl px-6">
          <button onClick={() => navigate('diet')} className="group bg-white border-2 border-red-100 hover:border-red-600 rounded-2xl p-8 shadow-lg transition-all h-56 flex flex-col justify-center items-center gap-4">
            <h3 className="text-2xl font-extrabold text-gray-900 group-hover:text-red-600">DIET PLAN</h3>
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full font-bold">Create Plan</div>
          </button>
          <button onClick={() => navigate('workout')} className="group bg-white border-2 border-red-100 hover:border-red-600 rounded-2xl p-8 shadow-lg transition-all h-56 flex flex-col justify-center items-center gap-4">
            <h3 className="text-2xl font-extrabold text-gray-900 group-hover:text-red-600">WORKOUT PLAN</h3>
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full font-bold">Create Plan</div>
          </button>
          <button onClick={() => navigate('tracker-setup')} className="group bg-gray-900 border-2 border-gray-800 hover:border-red-500 rounded-2xl p-8 shadow-lg transition-all h-56 flex flex-col justify-center items-center gap-4 relative">
            <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">NEW</div>
            <h3 className="text-2xl font-extrabold text-white group-hover:text-red-500">AI TRACKER</h3>
            <div className="bg-white text-gray-900 group-hover:bg-red-600 group-hover:text-white px-4 py-2 rounded-full font-bold transition-colors">Start Workout</div>
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
        onLogsClick={() => navigate('tracker-history-list')} // PASSING LOGS NAVIGATOR
        onHistoryClick={() => navigate('history')}
      />
      <main className="flex-grow flex flex-col items-center p-4">
        <div className="w-full max-w-5xl mt-6">{renderContent()}</div>
      </main>
      <footer className="bg-white border-t py-6 mt-12 text-center text-gray-500 text-sm font-semibold">
        &copy; {new Date().getFullYear()} THE GYM CKBT. Train Hard.
      </footer>
    </div>
  );
};

export default App;
