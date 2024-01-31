import {Component, Input, OnInit} from '@angular/core';
import {TypesOfContractsSuggestion, WorkLog} from "../../../types/transport-interfaces";
import {AfterWorkService} from "../../../services/after-work.service";
import {FormControl, Validators} from "@angular/forms";
import {OverlayPanel} from "primeng/overlaypanel";

@Component({
    selector: 'app-after-work-panel',
    templateUrl: './after-work-panel.component.html',
    styleUrls: ['./after-work-panel.component.scss']
})
export class AfterWorkPanelComponent implements OnInit {

    @Input() afterWorks: WorkLog[] = [];
    targetWorkLog?: WorkLog;
    panelVisible = false;
    concludedContractsControl = new FormControl<TypesOfContractsSuggestion[]>([], [Validators.required]);
    isRequestInProcess = false;

    constructor(readonly afterWorkService: AfterWorkService) {
    }

    ngOnInit(): void {
    }

    toggle() {
        this.panelVisible = !this.panelVisible;
    }

    markAsCompleted(contractsOverlay: OverlayPanel) {
        if(!this.targetWorkLog)
            return;
        this.isRequestInProcess = true;
        this.afterWorkService.markAsCompleted(this.targetWorkLog, this.concludedContractsControl.value)
            .subscribe(()=>contractsOverlay.hide())
    }
}
