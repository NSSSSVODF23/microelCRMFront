import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiService} from "../../../services/api.service";

@Component({
    selector: 'app-force-close-dialog',
    templateUrl: './force-close-dialog.component.html',
    styleUrls: ['./force-close-dialog.component.scss']
})
export class ForceCloseDialogComponent implements OnInit {

    @Input() visible = false;
    @Input() taskId?: number;
    @Output() visibleChange = new EventEmitter<boolean>();
    reason: string = "";
    requestRunning = false;

    constructor(private api: ApiService) {
    }

    ngOnInit(): void {
    }

    setVisible(visible: boolean) {
        this.visible = visible;
        this.visibleChange.emit(visible);
    }

    forceCloseWorkLog() {
        if (!this.taskId) return;
        this.api.forceCloseWorkLog(this.taskId, this.reason)
            .subscribe({
                next: () => {
                    this.setVisible(false);
                    this.reason = "";
                    this.requestRunning = false;
                },
                error: () => this.requestRunning = false
            })
    }
}
