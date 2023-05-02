import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Employee, EmployeeStatus} from "../../../transport-interfaces";
import {ApiService} from "../../../services/api.service";
import {OverlayPanel} from "primeng/overlaypanel";
import {RealTimeUpdateService} from "../../../services/real-time-update.service";
import {Subscription} from "rxjs";
import {ElapsedTimePipe} from "../../../pipes/elapsed-time.pipe";

@Component({
    selector: 'app-employee-label',
    templateUrl: './employee-label.component.html',
    styleUrls: ['./employee-label.component.scss']
})
export class EmployeeLabelComponent implements OnInit, OnDestroy {
    @Input() size = 1.7;
    @Input() inline = false;
    @Input() showStatus = false;
    @ViewChild('preview') preview?: OverlayPanel;
    failed = false;
    sub?: Subscription;

    constructor(readonly api: ApiService, readonly rt: RealTimeUpdateService) {
    }

    _employee?: Employee = {} as Employee;

    get employee(): Employee | undefined {
        return this._employee;
    }

    @Input() set employee(employee: Employee | undefined) {
        if (this.showStatus && employee?.login && employee.login !== this._employee?.login) {
            if (this.sub) this.sub.unsubscribe();
            this.sub = this.rt.employeeUpdated(employee.login)
            .subscribe(employee => {
                this._employee = employee
            });
        }
        this._employee = employee;
    }

    _employeeId?: string;

    @Input() set employeeId(id: string) {
        this._employeeId = id;
        this.api.getEmployee(id, true).subscribe({
            next: employee => this.employee = employee,
            error: () => this.failed = true
        });
    }

    get statusStyle(): any {
        const style = {} as any;
        switch (this.employee?.status) {
            case EmployeeStatus.ONLINE:
                style.color = '#36ff3b';
                break;
            case EmployeeStatus.AWAY:
                style.color = '#ffc107';
                break;
            case EmployeeStatus.OFFLINE:
                style.color = '#d5dde1';
                break;
            default:
                break;
        }
        return style;
    };

    get status(): string {
        switch (this.employee?.status) {
            case EmployeeStatus.ONLINE:
                return 'В сети';
            case EmployeeStatus.AWAY:
                return 'Отошел';
            case EmployeeStatus.OFFLINE:
                return new ElapsedTimePipe().transform(this.employee?.lastSeen,'Был(а) в сети ', ' назад');
            default:
                return '';
        }
    };

    static createElement(employeeId: string, inline: boolean): HTMLElement {
        const element = document.createElement('employee-label-element') as any;
        element.employeeId = employeeId;
        element.inline = inline;
        return element;
    }

    ngOnInit(): void {

    }

    ngOnDestroy(): void {
        if (this.sub) this.sub.unsubscribe();
    }

    showPreview(event: MouseEvent) {
        if (this.preview) this.preview.show(event)
    }

    hidePreview() {
        setTimeout(() => {
            if (this.preview) this.preview.hide()
        })
    }
}
