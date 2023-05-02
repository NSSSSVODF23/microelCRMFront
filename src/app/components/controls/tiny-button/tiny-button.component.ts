import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
    selector: 'app-tiny-button',
    templateUrl: './tiny-button.component.html',
    styleUrls: ['./tiny-button.component.scss']
})
export class TinyButtonComponent implements OnInit {
    @Input() icon?: string;
    @Input() label?: string;
    @Input() disabled = false;
    @Input() size = 1;
    @Input() model: "primary" | "secondary" | "success" | "danger" | "warn" | "info" = "primary";
    @Output() onClick = new EventEmitter<MouseEvent>();

    constructor() {
    }

    ngOnInit(): void {
    }

    clickHandler(event: MouseEvent) {
        if (this.disabled) return;
        this.onClick.emit(event);
    }

}
