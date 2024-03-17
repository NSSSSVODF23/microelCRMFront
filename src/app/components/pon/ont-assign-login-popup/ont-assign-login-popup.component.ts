import {Component, OnInit, ViewChild} from '@angular/core';
import {OverlayPanel} from "primeng/overlaypanel";
import {OntManagementService} from "../../../services/pon/ont-management.service";
import {AutoUnsubscribe} from "../../../decorators";
import {FormControl} from "@angular/forms";

@Component({
    selector: 'app-ont-assign-login-popup',
    templateUrl: './ont-assign-login-popup.component.html',
    styleUrls: ['./ont-assign-login-popup.component.scss']
})
@AutoUnsubscribe()
export class OntAssignLoginPopupComponent implements OnInit {

    @ViewChild('panel') panel?: OverlayPanel;
    loginControl = new FormControl<{ uname: string } | null>(null);


    openSub = this.service.openAssignLogin$.subscribe(data => {
        if (!data) {
            this.panel?.hide();
            return;
        }
        this.loginControl.reset(data.oldLogin ? {uname: data.oldLogin} : null);
        this.panel?.show(data.event);
    });

    constructor(readonly service: OntManagementService) {
    }

    ngOnInit(): void {
    }


}
