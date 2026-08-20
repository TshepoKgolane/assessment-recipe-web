import { Routes } from '@angular/router';
import { MealPrepDashboard } from './Features/Home/pages/meal-prep-dashboard/meal-prep-dashboard';

export const routes: Routes = [
  {
    path: '',
    component: MealPrepDashboard,
  },
  {
    path: '**', // 404 should redirect to the dashboard still
    component: MealPrepDashboard,
  },
];
