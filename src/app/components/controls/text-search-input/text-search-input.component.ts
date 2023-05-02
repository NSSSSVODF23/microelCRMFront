import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
    selector: 'app-text-search-input',
    templateUrl: './text-search-input.component.html',
    styleUrls: ['./text-search-input.component.scss']
})
export class TextSearchInputComponent implements OnInit {
    @Input() value = '';
    @Output() valueChange: EventEmitter<string> = new EventEmitter();
    @Output() onSearch: EventEmitter<string> = new EventEmitter();
    @Output() onClear: EventEmitter<void> = new EventEmitter()
    isInputFocus = false;

    constructor() {
    }

    ngOnInit(): void {
    }

    clear() {
        this.value = '';
        this.valueChange.emit('')
        this.onClear.emit();
    }
}
