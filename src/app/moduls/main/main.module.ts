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
    DatePipe, JsonPipe, KeyValuePipe,
    NgClass,
    NgForOf,
    NgIf,
    NgStyle,
    NgSwitch,
    NgSwitchCase,
    NgTemplateOutlet, SlicePipe
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
// import {VirtualScrollerModule} from "@daalex90/ngx-virtual-scroller";
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
        ParseAddressPageComponent
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
        AutoFocusModule
    ],
    providers: [MessageService, {provide: LOCALE_ID, useValue: 'ru'}, ConfirmationService]
})
export class MainModule {
}
