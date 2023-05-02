import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
    selector: 'app-button', templateUrl: './button.component.html', styleUrls: ['./button.component.scss']
})
export class ButtonComponent implements OnInit {
    @Input() model!: string;
    @Input() icon?: string;
    @Input() label!: string;
    @Input() disabled: boolean = false;
    @Input() iconPos = 'left';
    @Output() onClick: EventEmitter<any> = new EventEmitter();
    @Input() loading: boolean = false;

    constructor() {
    }

    ngOnInit(): void {
    }
}
