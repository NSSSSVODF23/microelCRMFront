import {Component, OnInit, ViewChild} from '@angular/core';
import {OverlayPanel} from "primeng/overlaypanel";
import {FormControl} from "@angular/forms";
import {OntManagementService} from "../../../services/pon/ont-management.service";
import {Ont} from "../../../types/transport-interfaces";

@Component({
    selector: 'app-login-assign-ont-popup',
    templateUrl: './login-assign-ont-popup.component.html',
    styleUrls: ['./login-assign-ont-popup.component.scss']
})
export class LoginAssignOntPopupComponent implements OnInit {

    @ViewChild('panel') panel?: OverlayPanel;
    ontControl = new FormControl<Ont | null>(null);

    openSub = this.service.openAssignOnt$.subscribe(data => {
        if (!data) {
            this.panel?.hide();
            return;
        }
        this.ontControl.reset(data.ont ?? null);
        this.panel?.show(data.event);
    });

    constructor(readonly service: OntManagementService) {
    }

    ngOnInit(): void {
    }

}
