import {NgModule} from '@angular/core';

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
import moment from 'moment';
import 'moment/locale/ru';
import { Chart } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';
import {ConfirmDialogModule} from "primeng/confirmdialog";

moment.locale('ru');
registerLocaleData(localeRu, 'ru');
Chart.register(zoomPlugin);
Chart.register(annotationPlugin);


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
        ConfirmDialogModule,
    ],
    exports: [BrowserAnimationsModule, RouterOutlet, FormsModule, HttpClientModule],
    bootstrap: [AppComponent]
})
export class AppModule {

}
