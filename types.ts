
export enum PlanType {
  DIET = 'DIET',
  WORKOUT = 'WORKOUT'
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female'
}

export enum DietPreference {
  VEG = 'Vegetarian',
  NON_VEG = 'Non-Vegetarian',
  BOTH = 'Veg + Non-Veg (Both)'
}

export enum DietGoal {
  WEIGHT_LOSS = 'Weight Loss',
  WEIGHT_GAIN = 'Weight Gain',
  MUSCLE_GAIN = 'Muscle Gain',
  MAINTENANCE = 'Maintenance',
  FAT_LOSS = 'Fat Loss'
}

export enum ExperienceLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export enum WorkoutSplit {
  STANDARD = 'Standard (Mix)',
  DOUBLE_MUSCLE = 'Double Muscle (2 Body Parts/Day)',
  PPL = 'Push Pull Legs',
  BRO_SPLIT = 'Bro Split (1 Body Part/Day)',
  FULL_BODY = 'Full Body'
}

export interface DietFormData {
  name: string;
  gender: Gender;
  age: string;
  weight: string;
  height: string;
  preference: DietPreference;
  goal: DietGoal;
  weightChangeTarget?: string; 
  healthConditions?: string;
  excludedFoods?: string;
  wakeupTime?: string;
  breakfast?: string;
  lunch?: string;
  eveningSnack?: string;
  postWorkout?: string;
  dinner?: string;
  sleepTime?: string;
}

export interface WorkoutFormData {
  name: string;
  gender: Gender;
  daysPerWeek: string;
  durationPerDay: string;
  focus: 'Cardio' | 'Strength' | 'Mix' | 'Powerlifting';
  experience: ExperienceLevel;
  split?: WorkoutSplit;
  healthConditions?: string;
  currentSquat?: string;
  currentBench?: string;
  currentDeadlift?: string;
}

export interface PlanResponse {
  markdown: string;
}

// --- TRACKER SPECIFIC TYPES ---

export interface TrackerSetLog {
  setNumber: number;
  weight: number;
  reps: number;
  suggestion?: string; // e.g. "Increase weight by 2.5kg"
}

export interface TrackerExercise {
  name: string;
  targetSets: number;
  targetReps: string; // "8-12"
  restTime: string; // "60s"
  logs: TrackerSetLog[];
}

export interface TrackerSession {
  targetMuscle: string;
  warmup: string[]; // List of warmup activities
  exercises: TrackerExercise[];
  startTime: string;
  endTime?: string;
}

export interface SavedPlan {
  id: string;
  type: 'diet' | 'workout' | 'tracker';
  date: string;
  title: string;
  content: string | TrackerSession; // HTML for plans, JSON for tracker
}
