import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Menu} from "primeng/menu";

@Component({
    selector: 'app-select-field-to-view-button',
    templateUrl: './select-field-to-view-button.component.html',
    styleUrls: ['./select-field-to-view-button.component.scss']
})
export class SelectFieldToViewButtonComponent implements OnInit,AfterViewInit {
    @Input() classes: any;
    selectedField: any;
    @Input() index?: number;
    @Output() selectView: EventEmitter<any> = new EventEmitter();
    @ViewChild("menu") menu!: Menu;

    constructor() {
    }

    @Input() fields:any;

    openContextMenu(event:any) {
        this.fields = this.fields.map((field: any) => {
            field.command = () => {
                this.selectedField = field;
                field.listViewIndex = this.index;
                this.selectView.emit({id: field.id, index: this.index});
            }
            return field;
        });
        this.selectingField();
        this.menu.toggle(event)
    }

    ngOnInit(): void {
        this.selectingField();
    }

    ngAfterViewInit(): void {
    }

    private selectingField(){
        this.fields?.forEach((f:any)=>{
            if (f.listViewIndex && f.listViewIndex === this.index) this.selectedField = f;
        })
    }

}
