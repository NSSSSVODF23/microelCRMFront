import {Component, OnInit} from '@angular/core';
import {AfterWorkService} from "../../services/after-work.service";
import {ActiveWorkLogService} from "../../services/active-work-log.service";

@Component({
    selector: 'app-float-dock-panel',
    templateUrl: './float-dock-panel.component.html',
    styleUrls: ['./float-dock-panel.component.scss']
})
export class FloatDockPanelComponent implements OnInit {

    dockPanelHovered = false;

    constructor(readonly afterWorkService: AfterWorkService, readonly activeWorkLogService: ActiveWorkLogService) {
    }

    get isActiveWorkEmpty() {
        return this.activeWorkLogService.isEmpty;
    }

    get isAfterWorkEmpty() {
        return this.afterWorkService.isEmpty;
    }

    get isAllEmpty() {
        return this.isAfterWorkEmpty && this.isActiveWorkEmpty;
    }

    ngOnInit(): void {
    }

    dockPanelHover() {
        this.dockPanelHovered = true;
    }

    dockPanelUnhover() {
        this.dockPanelHovered = false;
    }

}
