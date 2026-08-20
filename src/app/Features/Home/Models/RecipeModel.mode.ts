export interface RecipeIngredientDto {
  id: number;
  name: string;
  quantity: number;
}

export interface RecipeDto {
  id: number;
  name: string;
  feeds: number;
  ingredients: RecipeIngredientDto[];
}