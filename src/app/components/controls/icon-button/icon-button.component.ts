import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
    selector: 'app-icon-button',
    templateUrl: './icon-button.component.html',
    styleUrls: ['./icon-button.component.scss']
})
export class IconButtonComponent implements OnInit {

    @Input() icon = "";
    @Input() size = 1.9;
    @Input() disabled = false;
    @Output() onClick = new EventEmitter<MouseEvent>();
    @Input() model: string = 'primary';
    @Input() loading = false;

    constructor() {
    }

    ngOnInit(): void {
    }

    clickHandler(event: MouseEvent) {
        if (this.disabled) return;
        this.onClick.emit(event);
    }
}
