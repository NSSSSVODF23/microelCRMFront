import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {Employee, EmployeeStatus} from "../../../types/transport-interfaces";
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
export class EmployeeLabelComponent implements OnInit, OnChanges, OnDestroy {
    @Input() size = 1.7;
    @Input() inline = false;
    @Input() showStatus = false;
    @Input() employee?: Employee | string;
    loadStatus: 'ready' | 'loading' | 'empty' | 'error' = 'loading';
    @ViewChild('preview') preview?: OverlayPanel;
    sub?: Subscription;
    _employee?: Employee;

    constructor(readonly api: ApiService, readonly rt: RealTimeUpdateService) {
    }

    get statusStyle(): any {
        const style = {} as any;
        switch (this._employee?.status) {
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
        switch (this._employee?.status) {
            case EmployeeStatus.ONLINE:
                return 'В сети';
            case EmployeeStatus.AWAY:
                return 'Отошел';
            case EmployeeStatus.OFFLINE:
                return new ElapsedTimePipe().transform(this._employee?.lastSeen, 'Был(а) в сети ', ' назад');
            default:
                return '';
        }
    };

    static createElement(employeeId: string, inline: boolean): HTMLElement {
        const element = document.createElement('employee-label-element') as any;
        element.employee = employeeId;
        element.inline = inline;
        return element;
    }

    ngOnInit(): void {
        this.loadingEmployee();
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

    ngOnChanges(changes: SimpleChanges): void {
        const employeeChange = changes['employee'];
        if (employeeChange && employeeChange.currentValue) {
            this.loadingEmployee();
        }
    }

    private loadingEmployee() {
        if (this.employee) {
            if (typeof this.employee === 'string') {
                this.api.getEmployee(this.employee, true).subscribe({
                    next: (employee) => {
                        this._employee = employee;
                        this.sub = this.rt.employeeUpdated(this._employee.login)
                            .subscribe(employee => {
                                this._employee = employee
                            });
                        this.loadStatus = 'ready';
                    },
                    error: () => {
                        this.loadStatus = 'error';
                    }
                })
            } else {
                this._employee = this.employee;
                this.loadStatus = 'ready';
                this.sub = this.rt.employeeUpdated(this._employee.login)
                    .subscribe(employee => {
                        this._employee = employee
                    });
            }
        } else {
            this.loadStatus = 'empty';
        }
    }
}
