import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
    selector: 'app-editing-caption',
    templateUrl: './editing-caption.component.html',
    styleUrls: ['./editing-caption.component.scss']
})
export class EditingCaptionComponent implements OnInit {
    editing = false;
    @Input() caption?: string = '';
    @Output() captionChange: EventEmitter<string> = new EventEmitter();
    @Output() onStopEditing: EventEmitter<string> = new EventEmitter();

    constructor() {
    }

    ngOnInit(): void {
    }

    stopEditing(event?: KeyboardEvent) {
        if (!event) {
            this.editing = false;
            this.onStopEditing.emit(this.caption);
            return;
        }
        if (event.key === "Enter" || event.key === "Escape") {
            this.editing = false;
            this.onStopEditing.emit(this.caption);
        }
    }



}
