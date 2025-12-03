
import { GoogleGenAI } from "@google/genai";
import { DietFormData, WorkoutFormData, ExperienceLevel, TrackerSession, TrackerExercise, StructuredPlan } from "../types";

const MODEL_NAME = 'gemini-2.5-flash';

// Instructions for HTML styling and Language detection
const SYSTEM_INSTRUCTION = `
  CRITICAL INSTRUCTIONS:
  1. SPEED & BREVITY: GENERATE IMMEDIATELY. Do not output any conversational text like "Here is your plan". Output ONLY the raw HTML.
  
  2. LANGUAGE MATCHING: Detect user input language (Hindi/English/Hinglish).
     - Input: "Mera weight 70kg hai" -> Output: Hinglish.
     - Input: "English" -> Output: English.
     - MATCH THE TONE EXACTLY.
  
  3. FORMATTING: Generate raw HTML with Tailwind CSS.
  
  4. STYLING (Red/White Theme):
     - H2: <h2 class="text-2xl font-extrabold text-red-700 mt-6 mb-3 border-l-4 border-red-600 pl-3">
     - Table Headers: <thead class="bg-red-600 text-white">
     - Rows: <tr class="hover:bg-red-50">
  
  5. TABLES: Use HTML Tables for ALL schedules.
     <div class="overflow-x-auto my-4 border border-gray-200 rounded-lg">
       <table class="min-w-full divide-y divide-gray-200">...</table>
     </div>

  6. CONTENT: NO EMOJIS. NO ICONS. Professional text only.
`;

// Helper to check key and get client
const getClient = () => {
  const key = process.env.API_KEY;
  if (!key || key.length < 5) {
    throw new Error("API Key is missing. Please add API_KEY to your Vercel/Netlify Environment Variables.");
  }
  return new GoogleGenAI({ apiKey: key });
};

// Common error handler
const handleApiError = (error: any, type: 'diet' | 'workout' | 'tracker') => {
  console.error(`Error generating ${type} plan:`, error);
  
  const errorMessage = error.toString().toLowerCase();
  
  if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('resource_exhausted')) {
    if (type === 'tracker') throw new Error("Daily AI Limit Reached. Try again later.");
    return `<div class="p-6 bg-red-50 border-l-4 border-red-600 text-red-700">
      <h3 class="font-bold text-lg mb-2">⚠️ Daily Limit Reached</h3>
      <p>The free Google AI quota for this key has been exhausted for today.</p>
      <p class="mt-2 text-sm text-gray-600"><strong>Fix:</strong> Please try again in a few hours, or use a different Google API Key.</p>
    </div>`;
  }

  if (errorMessage.includes('key') || errorMessage.includes('403')) {
    if (type === 'tracker') throw new Error("Invalid API Key.");
    return `<div class="p-6 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800">
      <h3 class="font-bold text-lg mb-2">🔑 Invalid API Key</h3>
      <p>The API Key configured in the app is incorrect or has expired.</p>
    </div>`;
  }

  const msg = error.message || "Unknown error";
  if (type === 'tracker') throw new Error(msg);

  return `<div class="p-6 bg-gray-50 border-l-4 border-gray-500 text-gray-700">
    <h3 class="font-bold text-lg mb-2">😓 Connection Error</h3>
    <p>We couldn't talk to the AI. Please check your internet connection.</p>
    <p class="text-xs mt-2 text-gray-500">Details: ${msg}</p>
  </div>`;
};

export const generateDietPlan = async (data: DietFormData, skippedMeals: string[] = []): Promise<string> => {
  try {
    const ai = getClient();
    
    // Condensed routine string to save tokens
    const routineDetails = [
      data.wakeupTime ? `Wake: ${data.wakeupTime}` : '',
      data.breakfast ? `Bkfast: ${data.breakfast}` : '',
      data.lunch ? `Lnch: ${data.lunch}` : '',
      data.eveningSnack ? `Snk: ${data.eveningSnack}` : '',
      data.postWorkout ? `P.WO: ${data.postWorkout}` : '',
      data.dinner ? `Dnr: ${data.dinner}` : '',
      data.sleepTime ? `Sleep: ${data.sleepTime}` : '',
    ].filter(Boolean).join(' | ');

    const skipInstruction = skippedMeals.length > 0 
      ? `SKIP: ${skippedMeals.join(', ')}. Redistribute calories.` 
      : '';

    const healthInstruction = data.healthConditions 
      ? `HEALTH CONDITIONS: ${data.healthConditions}. CRITICAL: ANALYZE these issues. Adjust foods accordingly (e.g., Low GI for Diabetes, Iodine for Thyroid, Low Sodium for BP). State the adjustments made.` 
      : 'No specific health issues.';

    const excludedFoodsInstruction = data.excludedFoods
      ? `EXCLUDED FOODS: ${data.excludedFoods}. CRITICAL: Do NOT include these foods in the plan.`
      : '';

    const weightTargetInstruction = data.weightChangeTarget
      ? `ONE MONTH TARGET: User wants to change weight by ${data.weightChangeTarget} kg in 1 month. Adjust Calorie Surplus/Deficit aggressively to try and meet this.`
      : '';

    const prompt = `
      ${SYSTEM_INSTRUCTION}
      TYPE: Diet Plan.
      USER: ${data.name}, ${data.gender}, Age ${data.age}, ${data.weight}kg, ${data.height}.
      GOAL: ${data.goal}. PREF: ${data.preference}.
      ${weightTargetInstruction}
      ${healthInstruction}
      ${excludedFoodsInstruction}
      ROUTINE: ${routineDetails}
      ${skipInstruction}

      OUTPUT:
      1. BMR & TDEE (1 line).
      2. Health Analysis (If conditions exist, briefly explain changes).
      3. Meal Table (Time, Meal, Items, Macros). Precise quantities.
      4. Short Note on Hydration.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    
    return response.text || "Failed to generate diet plan. Received empty response.";

  } catch (error: any) {
    return handleApiError(error, 'diet');
  }
};

export const generateWorkoutPlan = async (data: WorkoutFormData): Promise<string> => {
  try {
    const ai = getClient();

    const isAdvanced = data.experience === ExperienceLevel.ADVANCED || data.experience === ExperienceLevel.INTERMEDIATE;
    
    let specialInstruction = '';
    
    // Handle Powerlifting specific instructions
    if (data.focus === 'Powerlifting') {
       const lifts = `Squat: ${data.currentSquat || 'N/A'}kg, Bench: ${data.currentBench || 'N/A'}kg, Deadlift: ${data.currentDeadlift || 'N/A'}kg`;
       specialInstruction = `
         FOCUS: POWERLIFTING (Strength).
         CURRENT LIFTS: ${lifts}.
         GOAL: Increase 1RM on SBD (Squat, Bench, Deadlift).
         STRATEGY: Use a strength progression (e.g. 5x5, 5/3/1, or percentage based).
         Focus heavily on compound movements with lower reps and higher rest.
       `;
    } else {
       // Regular Bodybuilding/Fitness instructions
       specialInstruction = (isAdvanced || data.split) && data.split
        ? `Split: ${data.split}.` 
        : `Suggest safe split.`;
    }

    const healthInstruction = data.healthConditions 
      ? `HEALTH ISSUES: ${data.healthConditions}. CRITICAL: Adjust intensity and exercises to be SAFE (e.g., Avoid heavy overheads for shoulder pain, moderate cardio for BP).` 
      : 'No specific health issues.';

    const prompt = `
      ${SYSTEM_INSTRUCTION}
      TYPE: Workout Plan.
      USER: ${data.name}, ${data.gender}, ${data.experience}.
      AVAILABILITY: ${data.daysPerWeek} days, ${data.durationPerDay} mins.
      FOCUS: ${data.focus}.
      ${specialInstruction}
      ${healthInstruction}

      OUTPUT:
      1. Weekly Schedule Table (Day, Muscle Group / Lift).
      2. Safety Note (If health issues exist).
      3. Daily Routine Tables (Exercise, Sets, Reps). 
         ${data.focus === 'Powerlifting' ? '*For Powerlifting, include % of 1RM or RPE if possible.*' : ''}
      4. Very brief Warmup/Cooldown.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Failed to generate workout plan. Received empty response.";

  } catch (error: any) {
    return handleApiError(error, 'workout');
  }
};

// --- NEW FUNCTION FOR TRACKER ---
export const generateWorkoutSession = async (targetMuscle: string, exerciseCount: number): Promise<TrackerSession> => {
  try {
    const ai = getClient();
    
    let distributionLogic = "Ensure a balanced effective workout.";

    // --- SEQUENTIAL LOGIC ENFORCEMENT ---
    if (targetMuscle.includes("Push Day")) {
        if (targetMuscle.includes("Chest Focused")) {
            distributionLogic = `
                STRICT ORDER REQUIRED:
                1. Start with CHEST exercises (Compound first, then Isolation).
                2. THEN perform SHOULDER exercises (Side Delt focus).
                3. FINISH with TRICEP exercises.
                DO NOT MIX THE ORDER. Chest -> Shoulders -> Triceps.
            `;
        } else if (targetMuscle.includes("Shoulder Focused")) {
            distributionLogic = `
                STRICT ORDER REQUIRED:
                1. Start with SHOULDER exercises (Overhead Press first, then Isolation).
                2. THEN perform CHEST exercises (Upper Chest / Incline focus).
                3. FINISH with TRICEP exercises.
                DO NOT MIX THE ORDER. Shoulders -> Chest -> Triceps.
            `;
        } else {
             // Generic Push
             distributionLogic = "STRICT ORDER: Chest -> Shoulders -> Triceps.";
        }
    } else if (targetMuscle.includes("Pull Day")) {
        distributionLogic = `
            STRICT ORDER REQUIRED:
            1. Start with BACK exercises (Vertical Pulls then Horizontal Rows).
            2. THEN perform REAR DELT exercises.
            3. FINISH with BICEP exercises.
            DO NOT MIX THE ORDER. Back -> Rear Delts -> Biceps.
        `;
    } else if (targetMuscle.includes("Legs")) {
        distributionLogic = `
            STRICT ORDER REQUIRED:
            1. Start with Heavy Compounds (Squats/Leg Press).
            2. THEN Hamstrings/Glutes (RDL/Curls).
            3. THEN Quad Isolation (Extensions).
            4. FINISH with Calves.
        `;
    }

    const prompt = `
      Generate a workout session for: ${targetMuscle}.
      ${distributionLogic}
      Provide EXACTLY ${exerciseCount} exercises.
      
      Return purely valid JSON (no markdown).
      Structure:
      {
        "targetMuscle": "${targetMuscle}",
        "warmup": ["Activity 1", "Activity 2"],
        "exercises": [
           { "name": "Exercise Name", "targetSets": 3, "targetReps": "10-12", "restTime": "60s" }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const text = response.text || "{}";
    const cleanJson = text.replace(/```json|```/g, '');
    const data = JSON.parse(cleanJson);
    
    // Add empty logs array to each exercise for the frontend to use
    data.exercises = data.exercises.map((ex: any) => ({ ...ex, logs: [] }));
    data.startTime = new Date().toISOString();
    
    return data as TrackerSession;

  } catch (error: any) {
    handleApiError(error, 'tracker'); 
    throw error; 
  }
};

export const generateAlternativeExercise = async (currentExercise: string, targetMuscle: string): Promise<TrackerExercise> => {
  try {
    const ai = getClient();
    const prompt = `
      The user wants to skip "${currentExercise}" for target "${targetMuscle}".
      Suggest 1 ALTERNATIVE exercise that targets the same muscle but is different.
      Return purely valid JSON:
      { "name": "New Exercise Name", "targetSets": 3, "targetReps": "10-12", "restTime": "60s" }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const text = response.text || "{}";
    const cleanJson = text.replace(/```json|```/g, '');
    const data = JSON.parse(cleanJson);
    
    return { ...data, logs: [] };

  } catch (error: any) {
    console.error("Failed to generate alternative", error);
    // Fallback if AI fails
    return {
      name: `Alternative to ${currentExercise}`,
      targetSets: 3,
      targetReps: "10-12",
      restTime: "60s",
      logs: []
    };
  }
};

// --- NEW FUNCTION: PARSE HTML PLAN TO STRUCTURED DATA ---
export const convertHtmlPlanToStructured = async (htmlPlan: string): Promise<StructuredPlan> => {
  try {
    const ai = getClient();
    const prompt = `
      READ this workout plan (HTML string): 
      "${htmlPlan.substring(0, 5000)}" 
      
      TASK: Extract all the workout days and exercises into a structured JSON format so I can play them in an app.
      
      Return purely valid JSON (no markdown).
      Structure:
      {
        "planTitle": "User's Workout Plan",
        "days": [
          {
            "dayName": "Day 1 - Chest & Triceps", 
            "focus": "Chest",
            "exercises": [
               { "name": "Bench Press", "targetSets": 3, "targetReps": "10-12", "restTime": "60s" }
            ]
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const text = response.text || "{}";
    const cleanJson = text.replace(/```json|```/g, '');
    const data = JSON.parse(cleanJson);
    
    // Ensure logs are initialized
    data.days.forEach((day: any) => {
        day.exercises = day.exercises.map((ex: any) => ({ ...ex, logs: [] }));
    });
    
    return data as StructuredPlan;

  } catch (error: any) {
    console.error("Error parsing plan:", error);
    throw new Error("Could not read plan structure. Please try generating a new plan.");
  }
};
