
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
  wakeupTime?: string;
  breakfast?: string;
  lunch?: string;
  eveningSnack?: string;
  postWorkout?: string;
  dinner?: string;
}

export interface WorkoutFormData {
  name: string;
  gender: Gender;
  daysPerWeek: string;
  durationPerDay: string;
  focus: 'Cardio' | 'Strength' | 'Mix';
  experience: ExperienceLevel;
  split?: WorkoutSplit;
}

export interface PlanResponse {
  markdown: string;
}
