import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ApiService} from "../../services/api.service";
import {fade} from "../../animations";
import { Router } from '@angular/router';

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

    constructor(readonly api: ApiService, readonly router: Router) {
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
        this.api.signIn(this.loginForm.getRawValue()).subscribe({
            next: () => {
                this.router.navigate(['/']).then();
            },
            error: (err) => {
                this.setWrongCredentials();
            }
        });
    }
}
