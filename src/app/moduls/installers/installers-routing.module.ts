import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {UncompletedReportsPageComponent} from "../../pages/uncompleted-reports-page/uncompleted-reports-page.component";
import {InstallersBootstrapComponent} from "../../pages/bootstaps/installers-bootstrap/installers-bootstrap.component";
import {AuthGuard} from "../../guards/auth.guard";
import {WritingReportPageComponent} from "../../pages/writing-report-page/writing-report-page.component";
import {InstallerGuard} from "../../guards/installer.guard";

const routes: Routes = [
    {
        path: '', component: InstallersBootstrapComponent,
        children: [
            {path: '', component: UncompletedReportsPageComponent},
            {path: 'writing-report/:workLogId', component: WritingReportPageComponent}
        ],
        canActivate: [AuthGuard, InstallerGuard], canActivateChild: [AuthGuard, InstallerGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class InstallersRoutingModule {
}
