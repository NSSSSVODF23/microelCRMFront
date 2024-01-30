import {NgModule} from '@angular/core';
import {CommonModule, NgClass} from '@angular/common';
import {AccountPanelComponent} from "../../components/controls/account-panel/account-panel.component";
import {AttachmentLinkComponent} from "../../components/controls/attachment-link/attachment-link.component";
import {AvatarComponent} from "../../components/controls/avatar/avatar.component";
import {ButtonComponent} from "../../components/controls/button/button.component";
import {EditingCaptionComponent} from "../../components/controls/editing-caption/editing-caption.component";
import {ExtendedMenuItemComponent} from "../../components/controls/extended-menu-item/extended-menu-item.component";
import {FileInputComponent} from "../../components/controls/file-input/file-input.component";
import {IconButtonComponent} from "../../components/controls/icon-button/icon-button.component";
import {
    SubExtendedMenuItemComponent
} from "../../components/controls/sub-extended-menu-item/sub-extended-menu-item.component";
import {TaskFieldViewComponent} from "../../components/controls/task-field-view/task-field-view.component";
import {TaskTemplateInputComponent} from "../../components/controls/task-template-input/task-template-input.component";
import {TextSearchInputComponent} from "../../components/controls/text-search-input/text-search-input.component";
import {
    AttachmentsHistoryDialogComponent
} from "../../components/panels/attachments-history-dialog/attachments-history-dialog.component";
import {
    CircleLoadingIndicatorComponent
} from "../../components/panels/circle-loading-indicator/circle-loading-indicator.component";
import {GridBasedViewerComponent} from "../../components/panels/grid-based-viewer/grid-based-viewer.component";
import {LoadingPanelComponent} from "../../components/panels/loading-panel/loading-panel.component";
import {MainMenuPanelComponent} from "../../components/panels/main-menu-panel/main-menu-panel.component";
import {MediaViewerComponent} from "../../components/panels/media-viewer/media-viewer.component";
import {TaskListElementComponent} from "../../components/panels/task-list-element/task-list-element.component";
import {
    SelectFieldToViewButtonComponent
} from "../../components/select-field-to-view-button/select-field-to-view-button.component";
import {MenuModule} from "primeng/menu";
import {ButtonModule} from "primeng/button";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {DropdownModule} from "primeng/dropdown";
import {InputNumberModule} from "primeng/inputnumber";
import {InputTextareaModule} from "primeng/inputtextarea";
import {DialogModule} from "primeng/dialog";
import {TabViewModule} from "primeng/tabview";
import {BadgeModule} from "primeng/badge";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {MainBootstrapComponent} from "../../pages/main-bootstrap/main-bootstrap.component";
import {ToastModule} from "primeng/toast";
import {InputTextModule} from "primeng/inputtext";
import {InputMaskModule} from "primeng/inputmask";
import {CommonPipesModule} from "../common-pipes/common-pipes.module";
import {ImageCropperModule} from "ngx-image-cropper";
import {SkeletonModule} from "primeng/skeleton";
import {IntersectionObserverDirective} from "../../directives/intersection-observer.directive";
import {FreeDragDirective} from "../../directives/free-drag.directive";
import {ScrollControllerDirective} from "../../directives/scroll-controller.directive";
import {RegexPatternCheckerDirective} from "../../directives/regex-pattern-checker.directive";
import {ColorizeDirective} from "../../directives/colorize.directive";
import {ExtendPageHeightDirective} from "../../directives/extend-page-height.directive";
import {IpInputComponent} from "../../components/controls/task-inputs/ip-input/ip-input.component";
import {ListPanelComponent} from "../../components/panels/simple-panel/list-panel.component";
import {ColoredTagComponent} from "../../components/controls/colored-tag/colored-tag.component";
import {CheckboxModule} from "primeng/checkbox";
import {TaskJournalComponent} from "../../components/panels/task-journal/task-journal.component";
import {MarkdownModule} from "ngx-markdown";
import {LazyPageLoader} from "../../directives/lazy-page-loader.directive";
import {ExpandingPanelComponent} from "../../components/panels/expanding-panel/expanding-panel.component";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {StompClientService} from "../../services/stomp-client.service";
import {stompFactory} from "../../stomp.config";
import {TinyButtonComponent} from "../../components/controls/tiny-button/tiny-button.component";
import {TaskLinkComponent} from "../../components/controls/task-link/task-link.component";
import {TaskTagsViewComponent} from "../../components/panels/task-tags-view/task-tags-view.component";
import {MultiSelectModule} from "primeng/multiselect";
import {TaskTagListItemComponent} from "../../components/controls/task-tag-item/task-tag-list-item.component";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {ColorPickerModule} from "primeng/colorpicker";
import {AutoFocusModule} from "primeng/autofocus";
import {
    LazyEndlessPageListComponent
} from "../../components/panels/lazy-endless-page-list/lazy-endless-page-list.component";
import {DragScrollingDirective} from "../../directives/drag-scrolling.directive";
import {
    TaskTagFilterInputComponent
} from "../../components/controls/task-tag-filter-input/task-tag-filter-input.component";
import {TaskStatusChooserComponent} from "../../components/controls/task-status-chooser/task-status-chooser.component";
import {
    TaskTemplateFilterInputComponent
} from "../../components/controls/task-template-filter-input/task-template-filter-input.component";
import {AddressInputComponent} from "../../components/controls/task-inputs/address-input/address-input.component";
import {
    PhoneListInputComponent
} from "../../components/controls/task-inputs/phone-list-input/phone-list-input.component";
import {EmployeeLabelComponent} from "../../components/controls/employee-label/employee-label.component";
import {MessagesModule} from "primeng/messages";
import {TimestampChipsComponent} from "../../components/panels/timestamp-chips/timestamp-chips.component";
import {NotificationItemComponent} from "../../components/panels/notification-item/notification-item.component";
import {QuillViewHTMLComponent} from "ngx-quill";
import {CloseIfScrollDirective} from "../../directives/close-if-scroll.directive";
import {TextRevivalDirective} from "../../directives/text-revival.directive";
import {SplitButtonModule} from "primeng/splitbutton";
import {
    EmployeeInsertPanelComponent
} from "../../components/panels/employee-insert-panel/employee-insert-panel.component";
import {DepartmentLabelComponent} from "../../components/controls/department-label/department-label.component";
import {
    AppointedInstallersComponent
} from "../../components/controls/appointed-installers/appointed-installers.component";
import {
    TaskSelectingDialogComponent
} from "../../components/panels/task-linking-dialog/task-selecting-dialog.component";
import {PaginatorModule} from "primeng/paginator";
import {ListboxModule} from "primeng/listbox";
import {CalendarModule} from "primeng/calendar";
import {BlockUIModule} from "primeng/blockui";
import {SidebarModule} from "primeng/sidebar";
import {ScrollToBottomEmitterDirective} from "../../directives/scroll-to-bottom-emitter.directive";
import {
    NotificationsPopupPanelComponent
} from "../../components/panels/notifications-popup-panel/notifications-popup-panel.component";
import {ChatPanelComponent} from "../../components/panels/chat-panel/chat-panel.component";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {
    TrackerBindingsInputComponent
} from "../../components/controls/tracker-bindings-input/tracker-bindings-input.component";
import {AdjustInputWidthDirective} from "../../directives/adjust-input-width.directive";
import {ProgressBarModule} from "primeng/progressbar";
import {AudioPlayerComponent} from "../../components/panels/audio-player/audio-player.component";
import {SliderModule} from "primeng/slider";
import {EmojiStyleApplyDirective} from "../../directives/emoji-style-apply.directive";
import {TextFieldModule} from "@angular/cdk/text-field";
import {TextareaAutoresizeDirective} from "../../directives/textarea-autoresize.directive";
import {FileAttachmentComponent} from "../../components/panels/file-attachment/file-attachment.component";
import {EmojiPanelComponent} from "../../components/panels/emoji-panel/emoji-panel.component";
import {RippleModule} from "primeng/ripple";
import {AvatarListComponent} from "../../components/panels/avatar-list/avatar-list.component";
import {AnimateModule} from "primeng/animate";
import {PositionInScrolledViewDirective} from "../../directives/position-in-scrolled-view.directive";
import {ContextMenuComponent} from "../../components/controls/context-menu/context-menu.component";
import {MyActiveChatsComponent} from "../../components/panels/my-active-chats/my-active-chats.component";
import {WorkLogsDialogComponent} from "../../components/panels/work-logs-dialog/work-logs-dialog.component";
import {
    ActiveWorkLogsPanelComponent
} from "../../components/panels/active-work-logs-panel/active-work-logs-panel.component";
import {TimeElapsedComponent} from "../../components/controls/time-elapsed/time-elapsed.component";
import {
    InputVariationSelectorComponent
} from "../../components/controls/input-variation-selector/input-variation-selector.component";
import {
    TaskTemplateMultiSelectorComponent
} from "../../components/panels/task-template-multi-selector/task-template-multi-selector.component";
import {SelectButtonModule} from "primeng/selectbutton";
import {EmployeeSelectorComponent} from "../../components/controls/employee-selector/employee-selector.component";
import {DataRangeInputComponent} from "../../components/controls/data-range-input/data-range-input.component";
import {
    ObserverSelectorInputComponent
} from "../../components/controls/observer-selector-input/observer-selector-input.component";
import {AutoCompleteModule} from "primeng/autocomplete";
import {TaskTagSelectorComponent} from "../../components/controls/task-tag-selector/task-tag-selector.component";
import {TickerDirective} from "../../directives/ticker.directive";
import {PreventInputDirective} from "../../directives/prevent-input.directive";
import {WorksPickerComponent} from "../../components/controls/works-picker/works-picker.component";
import {TableModule} from "primeng/table";
import {SlideMenuModule} from "primeng/slidemenu";
import {DragDropModule} from "primeng/dragdrop";
import {
    EmployeeSumDistributionComponent
} from "../../components/controls/employee-sum-distribution/employee-sum-distribution.component";
import {TooltipDirective} from "../../directives/tooltip.directive";
import {IpViewComponent} from "../../components/panels/ip-view/ip-view.component";
import {ChartModule} from "primeng/chart";
import {CopyClipboardDirective} from "../../directives/copy-clipboard.directive";
import {
    ConnectionServicesInputComponent
} from "../../components/controls/task-inputs/connection-services-input/connection-services-input.component";
import {
    ClientEquipmentListInputComponent
} from "../../components/controls/task-inputs/client-equipment-list-input/client-equipment-list-input.component";
import {CountInputComponent} from "../../components/controls/count-input/count-input.component";
import {AcpHouseInputComponent} from "../../components/controls/acp-house-input/acp-house-input.component";
import {CommutatorViewComponent} from "../../components/panels/commutator-view/commutator-view.component";
import {
    BindingConnectionLocationViewComponent
} from "../../components/panels/binding-connection-location-view/binding-connection-location-view.component";
import {
    EquipmentsFieldFilterComponent
} from "../../components/controls/equipments-field-filter/equipments-field-filter.component";
import {KeyFilterModule} from "primeng/keyfilter";
import {
    CountingLivesInputComponent
} from "../../components/controls/task-inputs/counting-lives-input/counting-lives-input.component";
import {ChatLinkComponent} from "../../components/controls/chat-link/chat-link.component";
import {
    DashboardTaskStatisticPanelComponent
} from "../../components/panels/dashboard-task-statistic-panel/dashboard-task-statistic-panel.component";
import {FilesViewerComponent} from "../../components/panels/files-system/files-viewer/files-viewer.component";
import {TreeModule} from "primeng/tree";
import {BreadcrumbModule} from "primeng/breadcrumb";
import {MenubarModule} from "primeng/menubar";
import {DialButtonComponent} from "../../components/task-fields/phones/dial-button/dial-button.component";
import {
    DialButtonsListComponent
} from "../../components/task-fields/phones/dial-buttons-list/dial-buttons-list.component";
import {BillingLoginComponent} from "../../components/task-fields/billing-login/billing-login.component";
import {
    TaskFieldsTableViewComponent
} from "../../components/task-fields/task-fields-table-view/task-fields-table-view.component";
import {
    PassportDetailsInputComponent
} from "../../components/controls/task-inputs/passport-details-input/passport-details-input.component";
import {FocusAfterInitDirective} from "../../directives/focus-after-init.directive";
import {ListElementLazyScrollDirective} from "../../directives/list-element-lazy-scroll.directive";
import {CatalogMenuItemComponent} from "../../components/task-catalog/catalog-menu-item/catalog-menu-item.component";
import {
    TaskTagInlineSelectorComponent
} from "../../components/controls/task-tag-inline-selector/task-tag-inline-selector.component";
import {
    AppointInstallersDialogComponent
} from "../../components/task-control-dialogs/appoint-installers-dialog/appoint-installers-dialog.component";
import {PickListModule} from "primeng/picklist";
import {
    EditTaskDialogComponent
} from "../../components/task-control-dialogs/edit-task-dialog/edit-task-dialog.component";
import {
    TaskSchedulingDialogComponent
} from "../../components/task-control-dialogs/task-scheduling-dialog/task-scheduling-dialog.component";
import {LabelComponent} from "../../components/controls/label/label.component";
import {
    ServerDocumentsInputComponent
} from "../../components/controls/server-documents-input/server-documents-input.component";
import {AddressInputAltComponent} from "../../components/controls/address-input-alt/address-input-alt.component";
import {InputSwitchModule} from "primeng/inputswitch";
import {ContextMenuModule} from "primeng/contextmenu";
import {AfterWorkPanelComponent} from "../../components/after-work/after-work-panel/after-work-panel.component";
import {FloatDockPanelComponent} from "../../components/float-dock-panel/float-dock-panel.component";
import {
    ForceCloseDialogComponent
} from "../../components/task-control-dialogs/force-close-dialog/force-close-dialog.component";


@NgModule({
    declarations: [
        AccountPanelComponent,
        AttachmentLinkComponent,
        AvatarComponent,
        ButtonComponent,
        EditingCaptionComponent,
        ExtendedMenuItemComponent,
        FileInputComponent,
        IconButtonComponent,
        SubExtendedMenuItemComponent,
        TaskFieldViewComponent,
        TaskTemplateInputComponent,
        TextSearchInputComponent,
        AttachmentsHistoryDialogComponent,
        CircleLoadingIndicatorComponent,
        GridBasedViewerComponent,
        LoadingPanelComponent,
        MainMenuPanelComponent,
        MediaViewerComponent,
        TaskListElementComponent,
        SelectFieldToViewButtonComponent,
        MainBootstrapComponent,
        IntersectionObserverDirective,
        FreeDragDirective,
        ScrollControllerDirective,
        RegexPatternCheckerDirective,
        ColorizeDirective,
        ExtendPageHeightDirective,
        DragScrollingDirective,
        IpInputComponent,
        ListPanelComponent,
        ColoredTagComponent,
        TaskJournalComponent,
        LazyPageLoader,
        ExpandingPanelComponent,
        TinyButtonComponent,
        TaskLinkComponent,
        TaskTagsViewComponent,
        TaskTagListItemComponent,
        LazyEndlessPageListComponent,
        TaskTagFilterInputComponent,
        TaskStatusChooserComponent,
        TaskTemplateFilterInputComponent,
        AddressInputComponent,
        PhoneListInputComponent,
        EmployeeLabelComponent,
        TimestampChipsComponent,
        NotificationItemComponent,
        CloseIfScrollDirective,
        TextRevivalDirective,
        EmployeeInsertPanelComponent,
        DepartmentLabelComponent,
        AppointedInstallersComponent,
        TaskSelectingDialogComponent,
        ScrollToBottomEmitterDirective,
        NotificationsPopupPanelComponent,
        ChatPanelComponent,
        TrackerBindingsInputComponent,
        AdjustInputWidthDirective,
        AudioPlayerComponent,
        EmojiStyleApplyDirective,
        TextareaAutoresizeDirective,
        FileAttachmentComponent,
        EmojiPanelComponent,
        AvatarListComponent,
        PositionInScrolledViewDirective,
        ContextMenuComponent,
        MyActiveChatsComponent,
        WorkLogsDialogComponent,
        ActiveWorkLogsPanelComponent,
        TimeElapsedComponent,
        InputVariationSelectorComponent,
        TaskTemplateMultiSelectorComponent,
        EmployeeSelectorComponent,
        DataRangeInputComponent,
        ObserverSelectorInputComponent,
        TaskTagSelectorComponent,
        TickerDirective,
        PreventInputDirective,
        WorksPickerComponent,
        EmployeeSumDistributionComponent,
        TooltipDirective,
        IpViewComponent,
        CopyClipboardDirective,
        ConnectionServicesInputComponent,
        ClientEquipmentListInputComponent,
        CountInputComponent,
        AcpHouseInputComponent,
        CommutatorViewComponent,
        BindingConnectionLocationViewComponent,
        EquipmentsFieldFilterComponent,
        CountingLivesInputComponent,
        ChatLinkComponent,
        DashboardTaskStatisticPanelComponent,
        FilesViewerComponent,
        DialButtonComponent,
        DialButtonsListComponent,
        BillingLoginComponent,
        TaskFieldsTableViewComponent,
        PassportDetailsInputComponent,
        FocusAfterInitDirective,
        ListElementLazyScrollDirective,
        CatalogMenuItemComponent,
        TaskTagInlineSelectorComponent,
        AppointInstallersDialogComponent,
        EditTaskDialogComponent,
        TaskSchedulingDialogComponent,
        LabelComponent,
        ServerDocumentsInputComponent,
        AddressInputAltComponent,
        AfterWorkPanelComponent,
        FloatDockPanelComponent,
        ForceCloseDialogComponent
    ],
    exports: [
        AccountPanelComponent,
        AttachmentLinkComponent,
        AvatarComponent,
        ButtonComponent,
        EditingCaptionComponent,
        ExtendedMenuItemComponent,
        FileInputComponent,
        IconButtonComponent,
        SubExtendedMenuItemComponent,
        TaskFieldViewComponent,
        TaskTemplateInputComponent,
        TextSearchInputComponent,
        AttachmentsHistoryDialogComponent,
        CircleLoadingIndicatorComponent,
        GridBasedViewerComponent,
        LoadingPanelComponent,
        MainMenuPanelComponent,
        MediaViewerComponent,
        TaskListElementComponent,
        SelectFieldToViewButtonComponent,
        MainBootstrapComponent,
        IntersectionObserverDirective,
        FreeDragDirective,
        ScrollControllerDirective,
        RegexPatternCheckerDirective,
        ColorizeDirective,
        ExtendPageHeightDirective,
        DragScrollingDirective,
        IpInputComponent,
        ListPanelComponent,
        ColoredTagComponent,
        TaskJournalComponent,
        LazyPageLoader,
        ExpandingPanelComponent,
        TinyButtonComponent,
        TaskLinkComponent,
        TaskTagsViewComponent,
        TaskTagListItemComponent,
        LazyEndlessPageListComponent,
        TaskTagFilterInputComponent,
        TaskStatusChooserComponent,
        TaskTemplateFilterInputComponent,
        AddressInputComponent,
        PhoneListInputComponent,
        EmployeeLabelComponent,
        TimestampChipsComponent,
        NotificationItemComponent,
        CloseIfScrollDirective,
        TextRevivalDirective,
        EmployeeInsertPanelComponent,
        DepartmentLabelComponent,
        AppointedInstallersComponent,
        TaskSelectingDialogComponent,
        ScrollToBottomEmitterDirective,
        NotificationsPopupPanelComponent,
        ChatPanelComponent,
        TrackerBindingsInputComponent,
        AdjustInputWidthDirective,
        AudioPlayerComponent,
        EmojiStyleApplyDirective,
        TextareaAutoresizeDirective,
        FileAttachmentComponent,
        EmojiPanelComponent,
        AvatarListComponent,
        PositionInScrolledViewDirective,
        ContextMenuComponent,
        MyActiveChatsComponent,
        WorkLogsDialogComponent,
        ActiveWorkLogsPanelComponent,
        TimeElapsedComponent,
        InputVariationSelectorComponent,
        TaskTemplateMultiSelectorComponent,
        EmployeeSelectorComponent,
        DataRangeInputComponent,
        ObserverSelectorInputComponent,
        TaskTagSelectorComponent,
        TickerDirective,
        PreventInputDirective,
        WorksPickerComponent,
        EmployeeSumDistributionComponent,
        TooltipDirective,
        IpViewComponent,
        CopyClipboardDirective,
        ConnectionServicesInputComponent,
        ClientEquipmentListInputComponent,
        CountInputComponent,
        AcpHouseInputComponent,
        CommutatorViewComponent,
        BindingConnectionLocationViewComponent,
        EquipmentsFieldFilterComponent,
        CountingLivesInputComponent,
        ChatLinkComponent,
        DashboardTaskStatisticPanelComponent,
        FilesViewerComponent,
        DialButtonComponent,
        DialButtonsListComponent,
        BillingLoginComponent,
        TaskFieldsTableViewComponent,
        PassportDetailsInputComponent,
        FocusAfterInitDirective,
        ListElementLazyScrollDirective,
        CatalogMenuItemComponent,
        TaskTagInlineSelectorComponent,
        AppointInstallersDialogComponent,
        EditTaskDialogComponent,
        TaskSchedulingDialogComponent,
        LabelComponent,
        ServerDocumentsInputComponent,
        AddressInputAltComponent,
        AfterWorkPanelComponent,
        ForceCloseDialogComponent
    ],
    imports: [
        CommonPipesModule,
        CommonModule,
        MenuModule,
        ButtonModule,
        FormsModule,
        DropdownModule,
        InputNumberModule,
        InputTextareaModule,
        DialogModule,
        TabViewModule,
        BadgeModule,
        ProgressSpinnerModule,
        ToastModule,
        NgClass,
        InputTextModule,
        InputMaskModule,
        ImageCropperModule,
        SkeletonModule,
        CheckboxModule,
        MarkdownModule,
        OverlayPanelModule,
        MultiSelectModule,
        ConfirmPopupModule,
        ColorPickerModule,
        AutoFocusModule,
        ReactiveFormsModule,
        MessagesModule,
        QuillViewHTMLComponent,
        SplitButtonModule,
        PaginatorModule,
        ListboxModule,
        CalendarModule,
        BlockUIModule,
        SidebarModule,
        ConfirmDialogModule,
        ProgressBarModule,
        SliderModule,
        TextFieldModule,
        RippleModule,
        AnimateModule,
        SelectButtonModule,
        AutoCompleteModule,
        TableModule,
        SlideMenuModule,
        DragDropModule,
        ChartModule,
        KeyFilterModule,
        TreeModule,
        BreadcrumbModule,
        MenubarModule,
        PickListModule,
        InputSwitchModule,
        ContextMenuModule,
    ],
    providers: [
        {
            provide: StompClientService,
            useFactory: stompFactory
        }
    ]
})
export class CommonComponentsModule {
}
