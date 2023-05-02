import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {fade} from "../../../animations";

@Component({
    selector: 'app-expanding-panel',
    templateUrl: './expanding-panel.component.html',
    styleUrls: ['./expanding-panel.component.scss']
})
export class ExpandingPanelComponent implements OnInit {
    @Input() buttonCaption: string = "";
    @Input() display: boolean = false;
    @Output() displayChange: EventEmitter<boolean> = new EventEmitter();

    constructor() {
    }

    ngOnInit(): void {
    }

    showContent() {
        this.display = true;
        this.displayChange.emit(this.display);
    }
}
