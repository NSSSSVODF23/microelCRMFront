import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TasksPageComponent} from "./pages/tasks-page/tasks-page.component";
import { TemplatesPageComponent } from './pages/templates-page/templates-page.component';

const routes: Routes = [
    {path: "tasks", component: TasksPageComponent},
    {path: "templates", component: TemplatesPageComponent},
    {path: '**', redirectTo: 'tasks', pathMatch: 'full'},
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
