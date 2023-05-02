import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Department} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {OverlayPanel} from "primeng/overlaypanel";

@Component({
    selector: 'app-department-label',
    templateUrl: './department-label.component.html',
    styleUrls: ['./department-label.component.scss']
})
export class DepartmentLabelComponent implements OnInit {

    @Input() department?: Department = {} as Department;
    @Input() size = 1.7;
    @Input() inline = false;
    @ViewChild('preview') preview?: OverlayPanel;
    failed = false;

    constructor(readonly api: ApiService) {
    }

    _departmentId?: number;

    @Input() set departmentId(id: number) {
        this._departmentId = id;
        this.api.getDepartment(id, true).subscribe({
            next: department => this.department = department,
            error: () => this.failed = true
        });
    }

    static createElement(id: number, inline: boolean) {
        const element = document.createElement('department-label-element') as any;
        element.departmentId = id;
        element.inline = inline;
        return element;
    }

    ngOnInit(): void {
    }

    showPreview(event: MouseEvent) {
        if(this.preview) this.preview.show(event);
    }

    hidePreview() {
        setTimeout(()=> {
            if (this.preview) this.preview.hide()
        });
    }
}
