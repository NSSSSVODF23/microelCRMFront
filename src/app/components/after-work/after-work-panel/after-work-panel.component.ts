import {Component, Input, OnInit} from '@angular/core';
import {WorkLog} from "../../../types/transport-interfaces";
import {AfterWorkService} from "../../../services/after-work.service";

@Component({
    selector: 'app-after-work-panel',
    templateUrl: './after-work-panel.component.html',
    styleUrls: ['./after-work-panel.component.scss']
})
export class AfterWorkPanelComponent implements OnInit {

    @Input() afterWorks: WorkLog[] = [];
    panelVisible = false;

    constructor(readonly afterWorkService: AfterWorkService) {
    }

    ngOnInit(): void {
    }

    toggle() {
        this.panelVisible = !this.panelVisible;
    }
}
