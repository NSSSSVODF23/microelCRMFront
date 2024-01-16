import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'app-w-input', templateUrl: './w-input.component.html', styleUrls: ['./w-input.component.scss']
})
export class WInputComponent implements OnInit {
    @Input() label: string = '';

    constructor() {
    }

    ngOnInit(): void {
    }

}
