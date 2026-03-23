import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LocationPickerComponent } from './features/location/location-picker.component';
import { ProjectsComponent } from './features/projects/projects.component';
import { UsersComponent } from './features/users/users.component';
import { TasksComponent } from './features/tasks/tasks.component';
import { locationGuard } from './core/location.guard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'dashboard',
	},
	{
		path: 'location',
		component: LocationPickerComponent,
	},
	{
		path: 'dashboard',
		component: DashboardComponent,
		canActivate: [locationGuard],
	},
	{
		path: 'projects',
		component: ProjectsComponent,
	},
	{
		path: 'users',
		component: UsersComponent,
	},
	{
		path: 'tasks',
		component: TasksComponent,
	},
];
