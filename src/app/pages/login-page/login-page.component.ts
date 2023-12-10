import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ApiService} from "../../services/api.service";
import {fade} from "../../animations";
import { Router } from '@angular/router';
import {PersonalityService} from "../../services/personality.service";
import {AuthGuard} from "../../guards/auth.guard";
import {MainGuard} from "../../guards/main.guard";
import {routes} from "../../app-routing.module";

@Component({
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss'],
    animations: [fade]
})
export class LoginPageComponent implements OnInit {
    loginForm = new FormGroup({
        login: new FormControl('', Validators.required),
        password: new FormControl('', Validators.required)
    });
    wrongCredentialsTimer: any;
    isWrongCredentials = false;
    isLogining = false;

    constructor(readonly api: ApiService, readonly personalityService: PersonalityService, readonly router: Router) {
    }

    ngOnInit(): void {
    }

    setWrongCredentials() {
        if (this.wrongCredentialsTimer) clearTimeout(this.wrongCredentialsTimer);
        this.isWrongCredentials = true;
        this.wrongCredentialsTimer = setTimeout(() => this.isWrongCredentials = false, 3000);
    }

    signIn() {
        if (!this.loginForm.valid) return;
        this.isLogining = true;
        this.api.signIn(this.loginForm.getRawValue()).subscribe({
            next: (tokenUserinfo) => {
                this.personalityService.updateMe().subscribe()
                this.router.resetConfig(routes);
                setTimeout(
                    ()=>this.router.navigate(['/']).then(()=>this.isLogining = false),
                    100
                )
            },
            error: (err) => {
                this.setWrongCredentials();
                this.isLogining = false;
            }
        });
    }
}
