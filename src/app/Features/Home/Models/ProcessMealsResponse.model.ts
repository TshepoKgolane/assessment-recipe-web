export interface ProcessMealsApiResponse {
  isSuccess: boolean;
  message: string;
  value: ProcessMealsResponse | null;
}

export interface ProcessMealsResponse {
  totalPeopleFed: number;
  mealPlan: MealPlan[];
  ingredientsUsed: Record<string, number>;
  ingredientsRemaining: Record<string, number>;
}

export interface MealPlan {
  recipeName: string;
  amount: number;
  feeds: number;
}
