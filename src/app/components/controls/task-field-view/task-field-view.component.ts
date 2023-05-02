import {Component, Input, OnInit} from '@angular/core';
import {ModelItem} from "../../../transport-interfaces";
import {fade} from "../../../animations";

@Component({
    selector: 'app-task-field-view',
    templateUrl: './task-field-view.component.html',
    styleUrls: ['./task-field-view.component.scss'],
    animations: [fade]
})
export class TaskFieldViewComponent implements OnInit {

    @Input() item?: ModelItem;

    constructor() {
    }

    ngOnInit(): void {
    }

}
