import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { IngredientDto } from '../Models/IngredientDto.model';
import {
  ProcessMealsApiResponse,
  ProcessMealsResponse,
} from '../Models/ProcessMealsResponse.model';
import { environment } from '../../../../environments/environment.development';
import { map } from 'rxjs';
import { RecipeDto } from '../Models/RecipeModel.mode';

@Injectable({
  providedIn: 'root',
})
export class MealPrepService {
  private readonly endpoint = `${environment.apiUrl}/Food/GenerateOptomisedMealPrep`;

  constructor(private readonly httpClient: HttpClient) {}

  generateOptimisedMealPrep(
    ingredients: IngredientDto[],
    recipes: RecipeDto[],
    usePreExistingRecipes: boolean,
  ): Observable<ProcessMealsResponse> {
    const validRequest =
      ingredients.length > 0 &&
      ingredients.every(
        (ingredient) =>
          ingredient.name.trim().length > 0 &&
          Number.isFinite(ingredient.quantity) &&
          ingredient.quantity >= 0,
      );

    if (!validRequest) {
      throw new Error(
        'Invalid request: All ingredients must have a name and a non-negative quantity.',
      );
    }

    const payload = {
      ingredients: ingredients.map((ingredient) => ({
        name: ingredient.name.trim(),
        quantity: Math.trunc(Number(ingredient.quantity)),
      })),
      recipes: recipes,
      usePreExistingRecipes: usePreExistingRecipes,
    };

    return this.httpClient.post<ProcessMealsApiResponse>(this.endpoint, payload).pipe(
      map((response) => {
        if (!response.isSuccess || !response.value) {
          throw new Error(response.message || 'The API could not generate a meal plan.');
        }

        return response.value;
      }),
    );
  }
}
