import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {InstallersRoutingModule} from './installers-routing.module';
import {ButtonModule} from "primeng/button";
import {UncompletedReportsPageComponent} from "../../pages/uncompleted-reports-page/uncompleted-reports-page.component";
import {WritingReportPageComponent} from "../../pages/writing-report-page/writing-report-page.component";
import {CommonComponentsModule} from "../common-components/common-components.module";
import {InputTextareaModule} from "primeng/inputtextarea";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {ReactiveFormsModule} from "@angular/forms";


@NgModule({
    declarations: [UncompletedReportsPageComponent, WritingReportPageComponent],
    imports: [
        CommonModule,
        CommonComponentsModule,
        ButtonModule,
        InstallersRoutingModule,
        InputTextareaModule,
        ProgressSpinnerModule,
        ReactiveFormsModule
    ]
})
export class InstallersModule {
}
