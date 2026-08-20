import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { MealPrepService } from '../../Services/meal-prep-service';
import { IngredientDto } from '../../Models/IngredientDto.model';
import { ProcessMealsResponse } from '../../Models/ProcessMealsResponse.model';
import { finalize } from 'rxjs/internal/operators/finalize';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecipeDto } from '../../Models/RecipeModel.mode';
import { Subject, takeUntil } from 'rxjs';
const PredifinedIngredients: ReadonlyArray<Omit<IngredientDto, 'id'>> = [
  { name: 'Cucumber', quantity: 2 },
  { name: 'Olives', quantity: 2 },
  { name: 'Lettuce', quantity: 3 },
  { name: 'Meat', quantity: 6 },
  { name: 'Tomato', quantity: 6 },
  { name: 'Cheese', quantity: 8 },
  { name: 'Dough', quantity: 10 },
];
@Component({
  selector: 'app-meal-prep-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './meal-prep-dashboard.html',
  styleUrl: './meal-prep-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealPrepDashboard implements OnDestroy {
  private readonly api = inject(MealPrepService);
  private nextIngredientId = 1;
  private nextRecipeId = 1;
  private nextDraftIngredientId = 1;

  readonly draftRecipeName = signal('');
  readonly draftRecipeFeeds = signal(1);
  readonly draftIngredients = signal<IngredientDto[]>([
    { id: this.nextDraftIngredientId++, name: '', quantity: 1 },
  ]);

  readonly canAddRecipe = computed(
    () =>
      this.draftRecipeName().trim().length > 0 &&
      this.draftRecipeFeeds() > 0 &&
      this.draftIngredients().some(
        (ingredient) => ingredient.name.trim().length > 0 && ingredient.quantity > 0,
      ),
  );
  readonly recipes = signal<RecipeDto[]>([]);
  readonly usePreExistingRecipes = signal(true);
  readonly ingredients = signal<IngredientDto[]>(this.createDefaultIngredients());
  readonly result = signal<ProcessMealsResponse | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly hasUsableIngredients = computed(() =>
    this.ingredients().some(
      (ingredient) => ingredient.name.trim().length > 0 && ingredient.quantity > 0,
    ),
  );
  private destroy$ = new Subject<void>();

  addIngredient(): void {
    this.ingredients.update((ingredients) => [
      ...ingredients,
      { id: this.nextIngredientId++, name: '', quantity: 1 },
    ]);
  }

  removeIngredient(id: number): void {
    this.ingredients.update((ingredients) =>
      ingredients.filter((ingredient) => ingredient.id !== id),
    );
  }

  updateIngredientName(id: number, name: string): void {
    this.ingredients.update((ingredients) =>
      ingredients.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, name } : ingredient,
      ),
    );
  }

  updateIngredientQuantity(id: number, quantity: number | string): void {
    const parsedQuantity = Number(quantity);
    this.ingredients.update((ingredients) =>
      ingredients.map((ingredient) =>
        ingredient.id === id
          ? {
              ...ingredient,
              quantity: Number.isFinite(parsedQuantity)
                ? Math.max(0, Math.trunc(parsedQuantity))
                : 0,
            }
          : ingredient,
      ),
    );
  }
 clearIngredients(): void {
    this.ingredients.set([]);
    this.result.set(null);
    this.errorMessage.set(null);
  }
  resetIngredients(): void {
    this.ingredients.set(this.createDefaultIngredients());
    this.result.set(null);
    this.errorMessage.set(null);
  }

  optimize(): void {
    if (!this.hasUsableIngredients()) {
      this.result.set(null);
      this.errorMessage.set('Add at least one ingredient with a quantity greater than zero.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null); 
    this.api
      .generateOptimisedMealPrep(this.ingredients(), this.recipes(), this.usePreExistingRecipes())
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (result) => this.result.set(result),
        error: (error: unknown) => {
          this.result.set(null);
          this.errorMessage.set(this.getErrorMessage(error));
        },
      });
  }
  private createDefaultIngredients(): IngredientDto[] {
    return PredifinedIngredients.map((ingredient) => ({
      ...ingredient,
      id: this.nextIngredientId++,
    }));
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = error.error?.message ?? error.error?.Message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }

      if (error.status === 0) {
        return 'Unable to reach api, please ensure api is runnig';
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'The meal plan could not be generated. Please review the ingredients and try again.';
  }
 
updateDraftRecipeName(name: string): void {
    this.draftRecipeName.set(name);
  }

  updateDraftRecipeFeeds(feeds: number | string): void {
    const parsedFeeds = Number(feeds);
    this.draftRecipeFeeds.set(Number.isFinite(parsedFeeds) ? Math.max(0, Math.trunc(parsedFeeds)) : 0);
  }

  addDraftIngredient(): void {
    this.draftIngredients.update((ingredients) => [
      ...ingredients,
      { id: this.nextDraftIngredientId++, name: '', quantity: 1 },
    ]);
  }

  removeDraftIngredient(id: number): void {
    this.draftIngredients.update((ingredients) => ingredients.filter((ingredient) => ingredient.id !== id));
  }

  updateDraftIngredientName(id: number, name: string): void {
    this.draftIngredients.update((ingredients) =>
      ingredients.map((ingredient) => (ingredient.id === id ? { ...ingredient, name } : ingredient)),
    );
  }

  updateDraftIngredientQuantity(id: number, quantity: number | string): void {
    const parsedQuantity = Number(quantity);
    this.draftIngredients.update((ingredients) =>
      ingredients.map((ingredient) =>
        ingredient.id === id
          ? { ...ingredient, quantity: Number.isFinite(parsedQuantity) ? Math.max(0, Math.trunc(parsedQuantity)) : 0 }
          : ingredient,
      ),
    );
  }

  addRecipe(): void {
    if (!this.canAddRecipe()) {
      return;
    }

    const ingredients = this.draftIngredients()
      .filter((ingredient) => ingredient.name.trim().length > 0 && ingredient.quantity > 0)
      .map((ingredient) => ({ ...ingredient }));

    this.recipes.update((recipes) => [
      ...recipes,
      {
        id: this.nextRecipeId++,
        name: this.draftRecipeName().trim(),
        feeds: this.draftRecipeFeeds(),
        ingredients,
      },
    ]);

    this.resetDraftRecipe();
  }

  

  private resetDraftRecipe(): void {
    this.draftRecipeName.set('');
    this.draftRecipeFeeds.set(1);
    this.draftIngredients.set([{ id: this.nextDraftIngredientId++, name: '', quantity: 1 }]);
  }
  removeRecipe(id: number): void {
    this.recipes.update((recipes) => recipes.filter((recipe) => recipe.id !== id));
  }
 
  updateUsePreExistingRecipes(usePreExisting: boolean): void {
    this.usePreExistingRecipes.set(usePreExisting);
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
