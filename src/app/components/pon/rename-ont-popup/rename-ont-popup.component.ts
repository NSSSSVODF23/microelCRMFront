import {Component, OnInit, ViewChild} from '@angular/core';
import {OverlayPanel} from "primeng/overlaypanel";
import {FormControl} from "@angular/forms";
import {OntManagementService} from "../../../services/pon/ont-management.service";
import {AutoUnsubscribe} from "../../../decorators";

@Component({
    selector: 'app-rename-ont-popup',
    templateUrl: './rename-ont-popup.component.html',
    styleUrls: ['./rename-ont-popup.component.scss']
})
@AutoUnsubscribe()
export class RenameOntPopupComponent implements OnInit {

    @ViewChild('panel') panel?: OverlayPanel;
    nameControl = new FormControl<string>("");

    openSub = this.service.openRename$.subscribe(data => {
        if (!data) {
            this.panel?.hide();
            return;
        }
        this.nameControl.reset(data.oldName ?? "");
        this.panel?.show(data.event);
    });

    constructor(readonly service: OntManagementService) {
    }

    ngOnInit(): void {
    }

}
