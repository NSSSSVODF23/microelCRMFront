import {LOCALE_ID, NgModule, SecurityContext} from '@angular/core';

import {MainRoutingModule} from './main-routing.module';
import {TasksPageComponent} from "../../pages/tasks-page/tasks-page.component";
import {TemplatesPageComponent} from "../../pages/templates-page/templates-page.component";
import {
    WireframeConstructorPageComponent
} from "../../pages/wireframe-constructor-page/wireframe-constructor-page.component";
import {TaskCreationPageComponent} from "../../pages/task-creation-page/task-creation-page.component";
import {TaskPageComponent} from "../../pages/task-page/task-page.component";
import {EmployeesPageComponent} from "../../pages/employees-page/employees-page.component";
import {ConfirmationService, MessageService} from "primeng/api";
import {MarkdownModule} from "ngx-markdown";
import {CommonComponentsModule} from "../common-components/common-components.module";
import {InputSwitchModule} from "primeng/inputswitch";
import {RouterOutlet} from "@angular/router";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {
    AsyncPipe,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    JsonPipe,
    KeyValuePipe,
    NgClass,
    NgForOf,
    NgIf,
    NgStyle,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    NgTemplateOutlet,
    SlicePipe,
    TitleCasePipe
} from "@angular/common";
import {TabViewModule} from "primeng/tabview";
import {DialogModule} from "primeng/dialog";
import {DropdownModule} from "primeng/dropdown";
import {PanelModule} from "primeng/panel";
import {ToggleButtonModule} from "primeng/togglebutton";
import {CheckboxModule} from "primeng/checkbox";
import {InputTextareaModule} from "primeng/inputtextarea";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {TimelineModule} from "primeng/timeline";
import {LMarkdownEditorModule} from "ngx-markdown-editor";
import {CalendarModule} from "primeng/calendar";
import {ScrollTopModule} from "primeng/scrolltop";
import {StepsModule} from "primeng/steps";
import {OrderListModule} from "primeng/orderlist";
import {MenuModule} from "primeng/menu";
import {InputTextModule} from "primeng/inputtext";
import {CommonPipesModule} from "../common-pipes/common-pipes.module";
import {MultiSelectModule} from "primeng/multiselect";
import {StagesPageComponent} from "../../pages/stages-page/stages-page.component";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {PickListModule} from "primeng/picklist";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {SkeletonModule} from "primeng/skeleton";
import {OrganizationChartModule} from "primeng/organizationchart";
import {GeneralDashboardPageComponent} from "../../pages/general-dashboard/general-dashboard-page.component";
import {ColorPickerModule} from "primeng/colorpicker";
import {TestingPageComponent} from "../../pages/testing-page/testing-page.component";
import {ScrollingModule} from "@angular/cdk/scrolling";
import {PaginatorModule} from "primeng/paginator";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {ListboxModule} from "primeng/listbox";
import {MenubarModule} from "primeng/menubar";
import {EditorComponent} from "@tinymce/tinymce-angular";
import {QuillEditorComponent, QuillViewHTMLComponent} from "ngx-quill";
import {IncomingTasksPageComponent} from "../../pages/incoming-tasks-page/incoming-tasks-page.component";
import {TaskCalendarPageComponent} from "../../pages/task-calendar-page/task-calendar-page.component";
import {FullCalendarModule} from "@fullcalendar/angular";
import {ContextMenuModule} from "primeng/contextmenu";
import {ParseTaskPageComponent} from "../../pages/parse-task-page/parse-task-page.component";
import {VirtualScrollerModule} from "primeng/virtualscroller";
import {ProgressBarModule} from "primeng/progressbar";
import {ParseAddressPageComponent} from "../../pages/parse-address-page/parse-address-page.component";
import {SelectButtonModule} from "primeng/selectbutton";
import {AutoFocusModule} from "primeng/autofocus";
import {SalaryTablePageComponent} from "../../pages/salary-table-page/salary-table-page.component";
import {PaidActionsPageComponent} from "../../pages/paid-actions-page/paid-actions-page.component";
import {WorksPageComponent} from "../../pages/works-page/works-page.component";
import {BreadcrumbModule} from "primeng/breadcrumb";
import {TreeModule} from "primeng/tree";
import {RippleModule} from "primeng/ripple";
import {SalaryEstimationPageComponent} from "../../pages/salary-estimation-page/salary-estimation-page.component";
import {TreeTableModule} from "primeng/treetable";
import {DragDropModule} from "primeng/dragdrop";
import {TableModule} from "primeng/table";
import {SliderModule} from "primeng/slider";
import {SlideMenuModule} from "primeng/slidemenu";
import {SplitButtonModule} from "primeng/splitbutton";
import {BillingSearchUserPageComponent} from "../../pages/billing/billing-search-user-page/billing-search-user-page.component";
import {BillingUserPageComponent} from "../../pages/billing/billing-user-page/billing-user-page.component";
import {AddressesListPageComponent} from "../../pages/addresses-list-page/addresses-list-page.component";
import {ChipsModule} from "primeng/chips";
import {InputMaskModule} from "primeng/inputmask";
import {AngularYandexMapsModule, YaConfig} from "angular8-yandex-maps";
import {BypassWorkCalculationComponent} from "../../pages/bypass-work-calculation/bypass-work-calculation.component";
import {BillingSettingsPageComponent} from "../../pages/billing/billing-settings-page/billing-settings-page.component";
import {TelegramSettingsPageComponent} from "../../pages/telegram-settings-page/telegram-settings-page.component";
import {AcpSettingsPageComponent} from "../../pages/acp-settings-page/acp-settings-page.component";
import {AutoCompleteModule} from "primeng/autocomplete";
import {KeyFilterModule} from "primeng/keyfilter";
import {FilesPageComponent} from "../../pages/files-page/files-page.component";
import {AnimateModule} from "primeng/animate";
import {TaskCatalogPageComponent} from "../../pages/task-catalog/task-catalog-page/task-catalog-page.component";
import {
    CatalogTasksListViewComponent
} from "../../pages/task-catalog/catalog-tasks-list-view/catalog-tasks-list-view.component";
import {BlockUIModule} from "primeng/blockui";
import {
    TaskCatalogSearchPageComponent
} from "../../pages/task-catalog/task-catalog-search-page/task-catalog-search-page.component";
import {
    CatalogSearchTasksListViewComponent
} from "../../pages/task-catalog/catalog-search-tasks-list-view/catalog-search-tasks-list-view.component";
import {ChipModule} from "primeng/chip";
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
import {ChartModule} from "primeng/chart";
import {TopologyBootstrapPage} from "../../pages/topology/topology-bootstrap-page/topology-bootstrap-page.component";
import {TopologyHousesPage} from "../../pages/topology/children/topology-houses-page/topology-houses-page.component";
import {
    TopologySessionsPage
} from "../../pages/topology/children/topology-sessions-page/topology-sessions-page.component";
import {
    TopologyCommutatorsPage
} from "../../pages/topology/children/topology-commutators-page/topology-commutators-page.component";
import {TopologyHousePage} from "../../pages/topology/children/topology-house-page/topology-house-page.component";
import {NgTerminalModule} from "ng-terminal";
import {TaskRegistryPage} from "../../pages/task-registry-page/task-registry-page.component";
import {PonBootstrapPage} from "../../pages/pon/pon-bootstrap-page/pon-bootstrap-page.component";
import {PonTerminalsPage} from "../../pages/pon/children/pon-terminals-page/pon-terminals-page.component";
import {PonEventsPage} from "../../pages/pon/children/pon-events-page/pon-events-page.component";
import {PonTerminalPage} from "../../pages/pon/children/pon-terminal-page/pon-terminal-page.component";
import {PonSchemePage} from "../../pages/pon/children/scheme/children/pon-scheme-page/pon-scheme-page.component";
import {
    SchemeBootstrapPage
} from "../../pages/pon/children/scheme/scheme-bootstrap-page/scheme-bootstrap-page.component";
import {
    PonSchemeListPage
} from "../../pages/pon/children/scheme/children/pon-scheme-list-page/pon-scheme-list-page.component";
import {TopologySensorsPage} from "../../pages/topology/children/topology-sensors-page/topology-sensors-page.component";
import {TagModule} from "primeng/tag";
import {BillingBootstrapPage} from "../../pages/billing/billing-bootstrap-page/billing-bootstrap-page.component";
import {UserRequestsPage} from "../../pages/billing/user-requests-page/user-requests-page.component";
import {UserSettingsPage} from "../../pages/billing/user-settings-page/user-settings-page.component";

const mapConfig: YaConfig = {
    apikey: '008574e5-f34b-4270-b3d5-91aaabd036e8',
    lang: 'ru_RU',
};

@NgModule({
    declarations: [
        TasksPageComponent,
        TemplatesPageComponent,
        WireframeConstructorPageComponent,
        TaskCreationPageComponent,
        TaskPageComponent,
        EmployeesPageComponent,
        StagesPageComponent,
        GeneralDashboardPageComponent,
        TestingPageComponent,
        IncomingTasksPageComponent,
        TaskCalendarPageComponent,
        ParseTaskPageComponent,
        ParseAddressPageComponent,
        SalaryTablePageComponent,
        PaidActionsPageComponent,
        WorksPageComponent,
        SalaryEstimationPageComponent,
        BillingSearchUserPageComponent,
        BillingUserPageComponent,
        AddressesListPageComponent,
        BypassWorkCalculationComponent,
        BillingSettingsPageComponent,
        TelegramSettingsPageComponent,
        AcpSettingsPageComponent,
        FilesPageComponent,
        TaskCatalogPageComponent,
        TaskCatalogSearchPageComponent,
        CatalogTasksListViewComponent,
        CatalogSearchTasksListViewComponent,
        ContractsBootstrapPageComponent,
        ContractsInspectionPageComponent,
        ContractTypesPageComponent,
        StatisticsBootstrapPage,
        EmployeeWorkStatisticsPage,
        TopologyBootstrapPage,
        TopologyHousesPage,
        TopologyHousePage,
        TopologySessionsPage,
        TopologySensorsPage,
        TopologyCommutatorsPage,
        TaskRegistryPage,
        PonBootstrapPage,
        PonTerminalsPage,
        PonEventsPage,
        PonTerminalPage,
        SchemeBootstrapPage,
        PonSchemeListPage,
        PonSchemePage,
        BillingBootstrapPage,
        UserRequestsPage,
        UserSettingsPage
    ],
    imports: [
        CommonComponentsModule,
        MainRoutingModule,
        MarkdownModule.forRoot({sanitize: SecurityContext.NONE}),
        InputSwitchModule,
        RouterOutlet,
        FormsModule,
        NgStyle,
        AsyncPipe,
        TabViewModule,
        NgForOf,
        DialogModule,
        ReactiveFormsModule,
        DropdownModule,
        PanelModule,
        ToggleButtonModule,
        CheckboxModule,
        NgIf,
        InputTextareaModule,
        ConfirmDialogModule,
        NgTemplateOutlet,
        NgSwitch,
        NgSwitchCase,
        NgSwitchDefault,
        DatePipe,
        TimelineModule,
        LMarkdownEditorModule,
        CalendarModule,
        ScrollTopModule,
        VirtualScrollerModule,
        StepsModule,
        OrderListModule,
        MenuModule,
        InputTextModule,
        CommonPipesModule,
        MultiSelectModule,
        OverlayPanelModule,
        PickListModule,
        NgClass,
        ProgressSpinnerModule,
        SkeletonModule,
        OrganizationChartModule,
        ColorPickerModule,
        ScrollingModule,
        PaginatorModule,
        ConfirmPopupModule,
        ListboxModule,
        JsonPipe,
        MenubarModule,
        EditorComponent,
        QuillEditorComponent,
        QuillViewHTMLComponent,
        FullCalendarModule,
        ContextMenuModule,
        VirtualScrollerModule,
        ProgressBarModule,
        KeyValuePipe,
        SlicePipe,
        SelectButtonModule,
        AutoFocusModule,
        TitleCasePipe,
        CurrencyPipe,
        BreadcrumbModule,
        TreeModule,
        RippleModule,
        TreeTableModule,
        DragDropModule,
        TableModule,
        SliderModule,
        DecimalPipe,
        SlideMenuModule,
        SplitButtonModule,
        ChipsModule,
        InputMaskModule,
        AngularYandexMapsModule.forRoot(mapConfig),
        AutoCompleteModule,
        KeyFilterModule,
        AnimateModule,
        BlockUIModule,
        ChipModule,
        ChartModule,
        NgTerminalModule,
        TagModule,
    ],
    providers: [MessageService, {provide: LOCALE_ID, useValue: 'ru'}, ConfirmationService]
})
export class MainModule {
}
