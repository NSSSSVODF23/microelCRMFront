import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TasksPageComponent} from "../../pages/tasks-page/tasks-page.component";
import {TaskCreationPageComponent} from "../../pages/task-creation-page/task-creation-page.component";
import {TaskPageComponent} from "../../pages/task-page/task-page.component";
import {TemplatesPageComponent} from "../../pages/templates-page/templates-page.component";
import {
    WireframeConstructorPageComponent
} from "../../pages/wireframe-constructor-page/wireframe-constructor-page.component";
import {EmployeesPageComponent} from "../../pages/employees-page/employees-page.component";
import {MainBootstrapComponent} from "../../pages/main-bootstrap/main-bootstrap.component";
import {StagesPageComponent} from "../../pages/stages-page/stages-page.component";
import {GeneralDashboardPageComponent} from "../../pages/general-dashboard/general-dashboard-page.component";
import {TestingPageComponent} from "../../pages/testing-page/testing-page.component";
import {IncomingTasksPageComponent} from "../../pages/incoming-tasks-page/incoming-tasks-page.component";
import {TaskCalendarPageComponent} from "../../pages/task-calendar-page/task-calendar-page.component";
import {ParseTaskPageComponent} from "../../pages/parse-task-page/parse-task-page.component";
import {ParseAddressPageComponent} from "../../pages/parse-address-page/parse-address-page.component";

const routes: Routes = [
    {
        path: '', component: MainBootstrapComponent, children: [
            {path: '', component: GeneralDashboardPageComponent},
            {path: 'tasks/incoming', component: IncomingTasksPageComponent},
            {path: 'tasks/calendar', component: TaskCalendarPageComponent},
            {path: 'tasks/list', component: TasksPageComponent},
            {path: 'tasks/status/:status', component: TasksPageComponent},
            {path: 'tasks/status/:status/:template', component: TasksPageComponent},
            {path: 'tasks/stages/:template', component: StagesPageComponent},
            {path: 'task/create', component: TaskCreationPageComponent},
            {path: 'task/:id', component: TaskPageComponent},
            {path: 'tasks/templates', component: TemplatesPageComponent},
            {path: 'tasks/templates/constructor', component: WireframeConstructorPageComponent},
            {path: 'employees', component: EmployeesPageComponent},
            {path: 'testing', component: TestingPageComponent},
            {path: 'parser/tracker', component: ParseTaskPageComponent},
            {path: 'parser/address', component: ParseAddressPageComponent}
        ]
    },
    // {path: '**', redirectTo: 'tasks/status/all', pathMatch: 'full'},
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MainRoutingModule {
}
