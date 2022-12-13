import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {ButtonModule} from "primeng/button";
import {TasksPageComponent} from './pages/tasks-page/tasks-page.component';
import {RouterModule} from "@angular/router";
import {AppRoutingModule} from "./app-routing.module";
import {SharedModule} from "primeng/api";
import { ButtonComponent } from './components/controls/button/button.component';
import { AccountPanelComponent } from './components/controls/account-panel/account-panel.component';
import { AvatarComponent } from './components/controls/avatar/avatar.component';
import { IconButtonComponent } from './components/controls/icon-button/icon-button.component';
import {MenuModule} from "primeng/menu";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import { MainMenuPanelComponent } from './components/panels/main-menu-panel/main-menu-panel.component';
import { ExtendPageHeightDirective } from './directives/extend-page-height.directive';
import { ExtendedMenuItemComponent } from './components/controls/extended-menu-item/extended-menu-item.component';
import { SubExtendedMenuItemComponent } from './components/controls/sub-extended-menu-item/sub-extended-menu-item.component';
import { TemplatesPageComponent } from './pages/templates-page/templates-page.component';
import {VirtualScrollerModule} from "@daalex90/ngx-virtual-scroller";

@NgModule({
    declarations: [
        AppComponent,
        TasksPageComponent,
        ButtonComponent,
        AccountPanelComponent,
        AvatarComponent,
        IconButtonComponent,
        MainMenuPanelComponent,
        ExtendPageHeightDirective,
        ExtendedMenuItemComponent,
        SubExtendedMenuItemComponent,
        TemplatesPageComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ButtonModule,
        RouterModule,
        AppRoutingModule,
        SharedModule,
        MenuModule,
        VirtualScrollerModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
