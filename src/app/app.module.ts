import {Injector, NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {registerLocaleData} from "@angular/common";
import localeRu from '@angular/common/locales/ru';
import {LoginModule} from "./moduls/login/login.module";
import {MainModule} from "./moduls/main/main.module";
import {BrowserModule} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {AppRoutingModule} from "./app-routing.module";
import {HttpClientModule} from "@angular/common/http";
import {FormsModule} from "@angular/forms";
import {RouterModule, RouterOutlet} from "@angular/router";
import {ToastModule} from "primeng/toast";
import {CommonComponentsModule} from "./moduls/common-components/common-components.module";
import {InstallersBootstrapComponent} from './pages/bootstaps/installers-bootstrap/installers-bootstrap.component';
import {
    ModuleLoadingBootstrapComponent
} from './pages/bootstaps/module-loading-bootstrap/module-loading-bootstrap.component';
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {ButtonModule} from "primeng/button";
import {TerminalDialogComponent} from "./components/terminal/terminal-dialog/terminal-dialog.component";
import {DialogService, DynamicDialogModule} from "primeng/dynamicdialog";

registerLocaleData(localeRu, 'ru');


@NgModule({
    declarations: [AppComponent, InstallersBootstrapComponent, ModuleLoadingBootstrapComponent],
    imports: [
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        MainModule,
        LoginModule,
        RouterModule,
        RouterOutlet,
        FormsModule,
        HttpClientModule,
        ToastModule,
        CommonComponentsModule,
        ProgressSpinnerModule,
        ButtonModule,
    ],
    exports: [BrowserAnimationsModule, RouterOutlet, FormsModule, HttpClientModule],
    bootstrap: [AppComponent]
})
export class AppModule {

}
