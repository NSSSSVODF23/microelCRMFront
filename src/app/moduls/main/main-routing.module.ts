import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TaskCreationPageComponent} from "../../pages/task-creation-page/task-creation-page.component";
import {TaskPageComponent} from "../../pages/task-page/task-page.component";
import {TemplatesPageComponent} from "../../pages/templates-page/templates-page.component";
import {
    WireframeConstructorPageComponent
} from "../../pages/wireframe-constructor-page/wireframe-constructor-page.component";
import {EmployeesPageComponent} from "../../pages/employees-page/employees-page.component";
import {MainBootstrapComponent} from "../../pages/main-bootstrap/main-bootstrap.component";
import {GeneralDashboardPageComponent} from "../../pages/general-dashboard/general-dashboard-page.component";
import {TestingPageComponent} from "../../pages/testing-page/testing-page.component";
import {TaskCalendarPageComponent} from "../../pages/task-calendar-page/task-calendar-page.component";
import {ParseTaskPageComponent} from "../../pages/parse-task-page/parse-task-page.component";
import {ParseAddressPageComponent} from "../../pages/parse-address-page/parse-address-page.component";
import {SalaryTablePageComponent} from "../../pages/salary-table-page/salary-table-page.component";
import {PaidActionsPageComponent} from "../../pages/paid-actions-page/paid-actions-page.component";
import {WorksPageComponent} from "../../pages/works-page/works-page.component";
import {SalaryEstimationPageComponent} from "../../pages/salary-estimation-page/salary-estimation-page.component";
import {BillingSearchUserPageComponent} from "../../pages/billing-search-user-page/billing-search-user-page.component";
import {BillingUserPageComponent} from "../../pages/billing-user-page/billing-user-page.component";
import {AddressesListPageComponent} from "../../pages/addresses-list-page/addresses-list-page.component";
import {BypassWorkCalculationComponent} from "../../pages/bypass-work-calculation/bypass-work-calculation.component";
import {BillingSettingsPageComponent} from "../../pages/billing-settings-page/billing-settings-page.component";
import {TelegramSettingsPageComponent} from "../../pages/telegram-settings-page/telegram-settings-page.component";
import {AcpSettingsPageComponent} from "../../pages/acp-settings-page/acp-settings-page.component";
import {AcpSessionsPageComponent} from "../../pages/acp-sessions-page/acp-sessions-page.component";
import {CommutatorListPageComponent} from "../../pages/commutator-list-page/commutator-list-page.component";
import {FilesPageComponent} from "../../pages/files-page/files-page.component";
import {AuthGuard} from "../../guards/auth.guard";
import {MainGuard} from "../../guards/main.guard";
import {TaskCatalogPageComponent} from "../../pages/task-catalog/task-catalog-page/task-catalog-page.component";
import {
    CatalogTasksListViewComponent
} from "../../pages/task-catalog/catalog-tasks-list-view/catalog-tasks-list-view.component";
import {SchedulingType} from "../../types/transport-interfaces";
import {
    TaskCatalogSearchPageComponent
} from "../../pages/task-catalog/task-catalog-search-page/task-catalog-search-page.component";
import {
    CatalogSearchTasksListViewComponent
} from "../../pages/task-catalog/catalog-search-tasks-list-view/catalog-search-tasks-list-view.component";

const routes: Routes = [{
    path: '',
    component: MainBootstrapComponent,
    children: [
        {
            path: '',
            component: GeneralDashboardPageComponent
        }, // {path: 'tasks/incoming', component: IncomingTasksPageComponent},
        {
            path: 'tasks/search',
            component: TaskCatalogSearchPageComponent,
            children: [{path: '', component: CatalogSearchTasksListViewComponent}, {
                path: ':status',
                component: CatalogSearchTasksListViewComponent
            }, {path: ':status/:class', component: CatalogSearchTasksListViewComponent}, {
                path: ':status/:class/:type',
                component: CatalogSearchTasksListViewComponent
            },]
        }, {path: 'tasks/catalog', pathMatch: 'full', redirectTo: 'tasks/catalog/active'}, {
            path: 'tasks/catalog',
            component: TaskCatalogPageComponent,
            children: [{
                path: 'scheduled/:status',
                component: CatalogTasksListViewComponent,
                data: {scheduled: SchedulingType.PLANNED}
            }, {
                path: 'scheduled/:status/:class',
                component: CatalogTasksListViewComponent,
                data: {scheduled: SchedulingType.PLANNED}
            }, {
                path: 'scheduled/:status/:class/:type',
                component: CatalogTasksListViewComponent,
                data: {scheduled: SchedulingType.PLANNED}
            }, {
                path: 'scheduled/:status/:class/:type/actual-time/:actualTime',
                component: CatalogTasksListViewComponent,
                data: {scheduled: SchedulingType.PLANNED, pageType: 'actual-time'}
            }, {
                path: 'scheduled/:status/:class/:type/actual-time/:actualTime/:tag',
                component: CatalogTasksListViewComponent,
                data: {scheduled: SchedulingType.PLANNED, pageType: 'actual-time'}
            }, {
                path: 'term/:status',
                component: CatalogTasksListViewComponent,
                data: {scheduled: SchedulingType.DEADLINE}
            }, {
                path: 'term/:status/:class',
                component: CatalogTasksListViewComponent,
                data: {scheduled: SchedulingType.DEADLINE}
            }, {
                path: 'term/:status/:class/:type',
                component: CatalogTasksListViewComponent,
                data: {scheduled: SchedulingType.DEADLINE}
            }, {
                path: 'term/:status/:class/:type/term-time/:termTime',
                component: CatalogTasksListViewComponent,
                data: {scheduled: SchedulingType.DEADLINE, pageType: 'term-time'}
            }, {
                path: 'term/:status/:class/:type/term-time/:termTime/:tag',
                component: CatalogTasksListViewComponent,
                data: {scheduled: SchedulingType.DEADLINE, pageType: 'term-time'}
            }, {path: ':status', component: CatalogTasksListViewComponent}, {
                path: ':status/:class',
                component: CatalogTasksListViewComponent
            }, {
                path: ':status/:class/:type',
                component: CatalogTasksListViewComponent
            }, {
                path: ':status/:class/:type/dir/:directory',
                component: CatalogTasksListViewComponent,
                data: {pageType: 'dir'}
            }, {
                path: ':status/:class/:type/dir/:directory/:tag',
                component: CatalogTasksListViewComponent,
                data: {pageType: 'dir'}
            }, {
                path: ':status/:class/:type/close-time/:closeTime',
                component: CatalogTasksListViewComponent,
                data: {pageType: 'close-time'}
            }, {
                path: ':status/:class/:type/close-time/:closeTime/:tag',
                component: CatalogTasksListViewComponent,
                data: {pageType: 'close-time'}
            },]
        }, {
            path: 'tasks/calendar',
            component: TaskCalendarPageComponent
        }, // {path: 'tasks/list', component: TasksPageComponent},
        // {path: 'tasks/status/:status', component: TasksPageComponent},
        // {path: 'tasks/status/:status/:template', component: TasksPageComponent},
        // {path: 'tasks/stages/:template', component: StagesPageComponent},
        {path: 'task/create', component: TaskCreationPageComponent}, {
            path: 'task/:id',
            component: TaskPageComponent
        }, {path: 'tasks/templates', component: TemplatesPageComponent}, {
            path: 'tasks/templates/constructor',
            component: WireframeConstructorPageComponent
        }, {path: 'employees', component: EmployeesPageComponent}, {
            path: 'testing',
            component: TestingPageComponent
        }, {path: 'parser/tracker', component: ParseTaskPageComponent}, {
            path: 'parser/address',
            component: ParseAddressPageComponent
        }, {path: 'salary/table', component: SalaryTablePageComponent}, {
            path: 'salary/paid-actions',
            redirectTo: '/salary/paid-actions/1?includeDeleted=false',
            pathMatch: 'full'
        }, {path: 'salary/paid-actions/:page', component: PaidActionsPageComponent}, {
            path: 'salary/works',
            component: WorksPageComponent
        }, {path: 'salary/estimation', component: SalaryEstimationPageComponent}, {
            path: 'salary/estimation/bypass',
            component: BypassWorkCalculationComponent
        }, {
            path: 'clients/billing/search',
            component: BillingSearchUserPageComponent
        }, {path: 'clients/billing/user/:login', component: BillingUserPageComponent}, {
            path: 'clients/sessions',
            component: AcpSessionsPageComponent
        }, {path: 'addresses/list', component: AddressesListPageComponent}, {
            path: 'system/billing',
            component: BillingSettingsPageComponent
        }, {path: 'system/telegram', component: TelegramSettingsPageComponent}, {
            path: 'system/acp',
            component: AcpSettingsPageComponent
        }, {path: 'commutators/list', component: CommutatorListPageComponent}, {
            path: 'files',
            component: FilesPageComponent
        }, // {path: '**', redirectTo: ''}
    ],
    canActivate: [AuthGuard, MainGuard],
    // canActivateChild: [AuthGuard, MainGuard]
}, // {breadcrumb: '**', redirectTo: 'tasks/status/all', pathMatch: 'full'},
];

@NgModule({
    imports: [RouterModule.forChild(routes)], exports: [RouterModule],
})
export class MainRoutingModule {
}
