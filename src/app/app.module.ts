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
import { NotificationsPopupPanelComponent } from './components/panels/notifications-popup-panel/notifications-popup-panel.component';
import {FullCalendarModule} from "@fullcalendar/angular";

registerLocaleData(localeRu, 'ru');

@NgModule({
    declarations: [AppComponent],
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

    ],
    exports: [BrowserAnimationsModule, RouterOutlet, FormsModule, HttpClientModule],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
