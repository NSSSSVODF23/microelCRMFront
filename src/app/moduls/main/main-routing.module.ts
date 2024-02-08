import {NgModule} from '@angular/core';
import {CanActivateFn, RouterModule, Routes} from '@angular/router';
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
import {accessCanActivate} from "../../guards/access-flag.guard";
import {AccessFlag} from "../../types/access-flag";
import {
    ContractsBootstrapPageComponent
} from "../../pages/contracts/contracts-bootstrap-page/contracts-bootstrap-page.component";
import {
    ContractsInspectionPageComponent
} from "../../pages/contracts/children/contracts-inspection-page/contracts-inspection-page.component";
import {
    ContractTypesPageComponent
} from "../../pages/contracts/children/contract-types-page/contract-types-page.component";
import {
    StatisticsBootstrapPage
} from "../../pages/statistics/statistics-bootstrap-page/statistics-bootstrap-page.component";
import {
    EmployeeWorkStatisticsPage
} from "../../pages/statistics/children/employee-work-statistics-page/employee-work-statistics-page.component";
import {TopologyBootstrapPage} from "../../pages/topology/topology-bootstrap-page/topology-bootstrap-page.component";
import {
    TopologyHousesPageComponent
} from "../../pages/topology/children/topology-houses-page/topology-houses-page.component";
import {
    TopologyCommutatorsPage
} from "../../pages/topology/children/topology-commutators-page/topology-commutators-page.component";
import {
    TopologySessionsPage
} from "../../pages/topology/children/topology-sessions-page/topology-sessions-page.component";

const routes: Routes = [{
    path: '', component: MainBootstrapComponent, children: [
        {path: '', component: GeneralDashboardPageComponent},
        {
            path: 'tasks/search',
            component: TaskCatalogSearchPageComponent,
            children: [{path: '', component: CatalogSearchTasksListViewComponent}, {
                path: ':status', component: CatalogSearchTasksListViewComponent
            }, {path: ':status/:class', component: CatalogSearchTasksListViewComponent}, {
                path: ':status/:class/:type', component: CatalogSearchTasksListViewComponent
            }]
        },
        {path: 'tasks/catalog', pathMatch: 'full', redirectTo: 'tasks/catalog/active'},
        {
            path: 'tasks/catalog', component: TaskCatalogPageComponent, children: [{
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
                path: 'term/:status', component: CatalogTasksListViewComponent, data: {scheduled: SchedulingType.DEADLINE}
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
                path: ':status/:class', component: CatalogTasksListViewComponent
            }, {
                path: ':status/:class/:type', component: CatalogTasksListViewComponent
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
            }]
        },
        {path: 'tasks/calendar', component: TaskCalendarPageComponent},
        {path: 'task/create', component: TaskCreationPageComponent},
        {path: 'task/:id', component: TaskPageComponent},
        {path: 'tasks/templates', component: TemplatesPageComponent, canActivate:[accessCanActivate(AccessFlag.EDIT_TASK_TEMPLATES, AccessFlag.EDIT_TASK_TAGS, AccessFlag.EDIT_DEVICES)]},
        {path: 'tasks/templates/constructor', component: WireframeConstructorPageComponent, canActivate:[accessCanActivate(AccessFlag.EDIT_TASK_TEMPLATES)]},
        {path: 'employees', component: EmployeesPageComponent, canActivate:[accessCanActivate(AccessFlag.MANAGE_EMPLOYEES)]},
        {path: 'testing', component: TestingPageComponent},
        {path: 'parser/tracker', component: ParseTaskPageComponent},
        {path: 'parser/address', component: ParseAddressPageComponent},
        {path: 'salary/table', component: SalaryTablePageComponent, canActivate:[accessCanActivate(AccessFlag.COUNT_SALARY)]},
        {path: 'salary/paid-actions', redirectTo: '/salary/paid-actions/1?includeDeleted=false', pathMatch: 'full'},
        {path: 'salary/paid-actions/:page', component: PaidActionsPageComponent, canActivate:[accessCanActivate(AccessFlag.EDIT_PRICE)]},
        {path: 'salary/works', component: WorksPageComponent, canActivate:[accessCanActivate(AccessFlag.EDIT_PRICE)]},
        {path: 'salary/estimation', component: SalaryEstimationPageComponent, canActivate:[accessCanActivate(AccessFlag.COUNT_SALARY)]},
        {path: 'salary/estimation/bypass', component: BypassWorkCalculationComponent, canActivate:[accessCanActivate(AccessFlag.COUNT_SALARY)]},
        {path: 'clients/billing/search', component: BillingSearchUserPageComponent, canActivate:[accessCanActivate(AccessFlag.BILLING)]},
        {path: 'clients/billing/user/:login', component: BillingUserPageComponent, canActivate:[accessCanActivate(AccessFlag.BILLING)]},
        {path: 'addresses/list', component: AddressesListPageComponent, canActivate:[accessCanActivate(AccessFlag.EDIT_ADDRESS_BOOK, AccessFlag.EDIT_HOUSE_ADDRESS_BOOK)]},
        {path: 'system/billing', component: BillingSettingsPageComponent, canActivate:[accessCanActivate(AccessFlag.MANAGE_SYSTEM_SETTINGS)]},
        {path: 'system/telegram', component: TelegramSettingsPageComponent, canActivate:[accessCanActivate(AccessFlag.MANAGE_SYSTEM_SETTINGS)]},
        {path: 'system/acp', component: AcpSettingsPageComponent, canActivate:[accessCanActivate(AccessFlag.MANAGE_SYSTEM_SETTINGS)]},
        {path: 'files', component: FilesPageComponent, canActivate:[accessCanActivate(AccessFlag.READ_WRITE_FILES)]},
        {
            path: 'contracts',
            component: ContractsBootstrapPageComponent,
            children: [
                {path: 'inspection', component: ContractsInspectionPageComponent, canActivate:[accessCanActivate(AccessFlag.VIEW_CONTRACTS)]},
                {path: 'types', component: ContractTypesPageComponent, canActivate:[accessCanActivate(AccessFlag.MANAGE_CONTRACTS_TYPES)]}
            ]
        },
        {
            path: 'statistics',
            component: StatisticsBootstrapPage,
            children: [
                {path: 'employee-works', component: EmployeeWorkStatisticsPage},
            ],
            canActivate:[accessCanActivate(AccessFlag.VIEW_STATISTICS)]
        },
        {
            path: 'topology',
            component: TopologyBootstrapPage,
            children: [
                {path: 'houses', component: TopologyHousesPageComponent},
                {path: 'commutators', component: TopologyCommutatorsPage, canActivate:[accessCanActivate(AccessFlag.VIEW_SWITCH, AccessFlag.EDIT_SWITCH)]},
                {path: 'sessions', component: TopologySessionsPage, canActivate:[accessCanActivate(AccessFlag.BILLING)]},
            ],
            // canActivate:[accessCanActivate(AccessFlag.VIEW_STATISTICS)]
        }
    ],
    canActivate: [AuthGuard, MainGuard]
}];

@NgModule({
    imports: [RouterModule.forChild(routes)], exports: [RouterModule],
})
export class MainRoutingModule {
}
