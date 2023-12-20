import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {VariationItem} from "../task-template-input/task-template-input.component";

@Component({
    selector: 'app-input-variation-selector',
    templateUrl: './input-variation-selector.component.html',
    styleUrls: ['./input-variation-selector.component.scss']
})
export class InputVariationSelectorComponent implements OnInit, OnChanges {
    @Input() variationList: VariationItem[] = [];

    @Input() value: string = '';
    @Output() valueChange = new EventEmitter<string>();

    constructor() {
    }

    get currentName(): string {
        if (!this.value) return '';
        return this.variationList.find(v => v.value === this.value)?.label ?? '';
    }

    trackByVariation(index: number, variation: VariationItem): string {
        return variation.value;
    };

    ngOnInit(): void {
    }

    ngOnChanges(changes: SimpleChanges): void {
        const value = changes['value'];

        if (value && !value.currentValue && this.variationList && this.variationList.length) {
            this.onChange(this.variationList[0].value);
        }
    }

    onChange(value: string) {
        this.value = value;
        this.valueChange.emit(value);
    }

}
