import {Component, OnDestroy, OnInit} from '@angular/core';
import {SubscriptionsHolder} from "../../util";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiService} from "../../services/api.service";
import {Position, SalaryRow} from "../../transport-interfaces";

@Component({
    templateUrl: './salary-table-page.component.html', styleUrls: ['./salary-table-page.component.scss']
})
export class SalaryTablePageComponent implements OnInit, OnDestroy {

    filtrationForm = new FormGroup({
        date: new FormControl(new Date()),
        position: new FormControl(null),
    })

    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();
    mainTableColumns: string[] = [];
    tableRow: any[] = [];
    salaryRows: SalaryRow[] = [];
    positions: any[] = [];
    tableLoadHandler = {
        next: (rows: SalaryRow[]) => {
            this.salaryRows = rows;
            for (const row of rows) {
                const tbRow = [row.employee.fullName];
                for (let i = 0; i < this.numberDaysOfMonth; i++) {
                    const salaryPoints = row.salaryPoints.filter(point => new Date(point.date).getDate() === (i + 1));
                    if (salaryPoints.length > 0) {
                        tbRow.push(salaryPoints.reduce((prev, curr) => prev + curr.value, 0).toString());
                    } else {
                        tbRow.push("0");
                    }
                }
                tbRow.push(row.sum.toString());
                this.tableRow.push(tbRow);
            }
        }, error: () => {

        },
    }
    filtrationHandler = {
        next: (filters: any) => {
            this.mainTableColumns = ["Сотрудник"];
            for (let i = 0; i < this.numberDaysOfMonth; i++) {
                this.mainTableColumns.push((i + 1).toString());
            }
            this.tableRow = [];
            this.mainTableColumns.push("Сумма");
            this.api.getSalaryTable(this.filtrationForm.value).subscribe(this.tableLoadHandler)
        }, error: () => {

        },
    }
    positionsLoadHandler = {
        next: (positions: Position[]) => {
            this.positions = positions.map(position=>({value:position.positionId,label:position.name}));
            this.filtrationForm.patchValue({position: this.positions[0].value});
        },
        error: () => {

        }
    }

    constructor(private api: ApiService) {
    }

    get numberDaysOfMonth() {
        if (this.filtrationForm.value.date) return new Date(this.filtrationForm.value.date.getFullYear(), this.filtrationForm.value.date.getMonth() + 1, 0).getDate();
        return 0;
    }

    get totalSalary() {
        return this.salaryRows.reduce((prev, curr) => prev + curr.sum, 0);
    };

    ngOnInit(): void {
        this.api.getPositions().subscribe(this.positionsLoadHandler)
        this.subscriptions.addSubscription('flCh', this.filtrationForm.valueChanges.subscribe(this.filtrationHandler));
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll();
    }

}
