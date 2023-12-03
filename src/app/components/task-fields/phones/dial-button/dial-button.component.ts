import {Component, Input, OnInit} from '@angular/core';
import {ApiService} from "../../../../services/api.service";
import {Observable} from "rxjs";
import {dotAnimation} from "../../../../util";

@Component({
    selector: 'app-dial-button',
    templateUrl: './dial-button.component.html',
    styleUrls: ['./dial-button.component.scss']
})
export class DialButtonComponent implements OnInit {

    @Input() phone?: string;
    isCalling = false;
    dotAnimation = dotAnimation;

    constructor(private api: ApiService) {
    }

    ngOnInit(): void {
    }

    callToPhone() {
        if(this.phone) {
            this.isCalling = true;
            this.api.callToPhone(this.phone).subscribe({
                next: () => {
                    setTimeout(() => {
                        this.isCalling = false;
                    },2000)
                },
                error: () => {
                    this.isCalling = false;
                }
            })
        }
    }
}
