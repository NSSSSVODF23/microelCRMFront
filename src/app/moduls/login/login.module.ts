import {NgModule} from '@angular/core';

import {LoginRoutingModule} from './login-routing.module';
import {LoginPageComponent} from "../../pages/login-page/login-page.component";
import {InputTextModule} from "primeng/inputtext";
import {PasswordModule} from "primeng/password";
import {CommonComponentsModule} from "../common-components/common-components.module";
import {ReactiveFormsModule} from "@angular/forms";
import {NgIf} from "@angular/common";
import {ButtonModule} from "primeng/button";


@NgModule({
    declarations: [
        LoginPageComponent
    ],
    imports: [
        LoginRoutingModule,
        InputTextModule,
        PasswordModule,
        CommonComponentsModule,
        ReactiveFormsModule,
        NgIf,
        ButtonModule
    ]
})
export class LoginModule {
}
