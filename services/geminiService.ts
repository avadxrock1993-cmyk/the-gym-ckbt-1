
import { GoogleGenAI } from "@google/genai";
import { DietFormData, WorkoutFormData, ExperienceLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

// Instructions for HTML styling and Language detection
const SYSTEM_INSTRUCTION = `
  CRITICAL INSTRUCTIONS:
  1. LANGUAGE MATCHING: You MUST detect the language and writing style of the user's input (e.g., Hindi, English, or Hinglish/Mixed). 
     - If the user writes in Hinglish (e.g., "Mera weight 70kg hai"), generate the ENTIRE plan in Hinglish.
     - If the user writes in English, generate in English.
     - If the user writes in Hindi, generate in Hindi.
     - MATCH THE TONE. This is the most important rule.
  
  2. FORMATTING: Generate the output strictly as raw HTML. Do not use markdown blocks like \`\`\`html.
  
  3. STYLING: Use Tailwind CSS classes inside the HTML tags to match the 'White and Red' theme.
     - Headings (H2): <h2 class="text-2xl font-extrabold text-red-700 mt-8 mb-4 border-l-4 border-red-600 pl-3">
     - Headings (H3): <h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">
     - Text: <p class="mb-3 text-gray-700 leading-relaxed text-base">
     - Lists: <ul class="list-disc pl-5 mb-4 space-y-2 text-gray-700">
     - Strong/Bold: <strong class="text-gray-900 font-bold">
  
  4. TABLES: For any schedules, meal plans, or workout splits, YOU MUST USE AN HTML TABLE.
     - Table Structure:
       <div class="overflow-hidden my-6 border border-gray-200 rounded-lg shadow-sm">
         <table class="min-w-full divide-y divide-gray-200">
           <thead class="bg-red-600 text-white">
             <tr>
               <th class="px-4 py-3 text-left text-sm font-bold uppercase tracking-wider">...</th>
             </tr>
           </thead>
           <tbody class="bg-white divide-y divide-gray-200">
             <tr class="hover:bg-red-50 transition-colors">
               <td class="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">...</td>
               <td class="px-4 py-3 text-sm text-gray-800">...</td>
             </tr>
           </tbody>
         </table>
       </div>

  5. CLEAN & MINIMAL: Do NOT use emojis, icons, or ASCII art in the text. Keep the output professional and text-only.
`;

export const generateDietPlan = async (data: DietFormData, skippedMeals: string[] = []): Promise<string> => {
  const routineDetails = [
    data.wakeupTime ? `- Wake up time: ${data.wakeupTime}` : '',
    data.breakfast ? `- Typical Breakfast: ${data.breakfast}` : '',
    data.lunch ? `- Typical Lunch: ${data.lunch}` : '',
    data.eveningSnack ? `- Typical Evening Snack: ${data.eveningSnack}` : '',
    data.postWorkout ? `- Typical Post-Workout: ${data.postWorkout}` : '',
    data.dinner ? `- Typical Dinner: ${data.dinner}` : '',
  ].filter(Boolean).join('\n');

  const skipInstruction = skippedMeals.length > 0 
    ? `IMPORTANT MODIFICATION: The user wants to SKIP the following meals: ${skippedMeals.join(', ')}. Do not include these meals in the plan. Redistribute the required calories and macros to the remaining meals.` 
    : '';

  const prompt = `
    ${SYSTEM_INSTRUCTION}

    TASK: Create a personalized Diet Plan.
    
    CLIENT PROFILE:
    - Name: ${data.name} (Address the client by name in the plan)
    - Gender: ${data.gender}
    - Age: ${data.age}
    - Weight: ${data.weight} kg
    - Height: ${data.height}
    - Dietary Preference: ${data.preference} (Strictly adhere to this!)
    - GOAL: ${data.goal} (Adjust calories/macros accordingly)
    
    CURRENT ROUTINE (Use this language style for the output):
    ${routineDetails}

    ${skipInstruction}

    REQUIREMENTS:
    1. Calculate BMR and TDEE (briefly show calculation).
    2. Create a Daily Meal Plan Table (Time, Meal Name, Food Items, Macros).
    3. Provide precise quantities.
    4. If specific meals are skipped, ensure the user still hits their nutrition targets for their goal: ${data.goal}.
    5. Add a "Note" section for Hydration and Cooking tips.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Failed to generate diet plan. Please try again.";
  } catch (error) {
    console.error("Error generating diet plan:", error);
    return "An error occurred while communicating with the AI. Please check your connection.";
  }
};

export const generateWorkoutPlan = async (data: WorkoutFormData): Promise<string> => {
  const isAdvanced = data.experience === ExperienceLevel.ADVANCED || data.experience === ExperienceLevel.INTERMEDIATE;
  
  const splitInstruction = isAdvanced && data.split
    ? `The user is ${data.experience} and explicitly requested a "${data.split}" split.` 
    : `The user is a ${data.experience}. Suggest the best safe split for them (e.g., Full Body or Upper/Lower).`;

  const prompt = `
    ${SYSTEM_INSTRUCTION}

    TASK: Create a personalized Workout Plan.

    CLIENT PROFILE:
    - Name: ${data.name} (Address the client by name in the plan)
    - Gender: ${data.gender}
    - Experience Level: ${data.experience}
    - Days available: ${data.daysPerWeek} days/week
    - Session duration: ${data.durationPerDay} minutes
    - Goal/Focus: ${data.focus}
    
    SPLIT STRATEGY:
    ${splitInstruction}

    REQUIREMENTS:
    1. Create a Weekly Schedule Table (Day, Muscle Group, Focus).
    2. For each workout day, provide a detailed Table (Exercise, Sets, Reps, Rest).
    3. Include Warm-up and Cool-down routines.
    4. Since the user is ${data.experience}, adjust volume and intensity accordingly.
    5. If Advanced/Double Muscle, ensure high volume. If Beginner, focus on form and compound movements.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Failed to generate workout plan. Please try again.";
  } catch (error) {
    console.error("Error generating workout plan:", error);
    return "An error occurred while communicating with the AI. Please check your connection.";
  }
};
