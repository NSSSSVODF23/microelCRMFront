import {Component} from '@angular/core';
import {Employee} from "../../types/transport-interfaces";
import {SalaryTableCacheService} from "../../services/salary-table-cache.service";

interface SalaryTableCell {
    employee: Employee,
    sumWithNDFL: number,
    sumWithoutNDFL: number
    date: Date
}

@Component({
    templateUrl: './salary-table-page.component.html', styleUrls: ['./salary-table-page.component.scss']
})
export class SalaryTablePageComponent {

    constructor(readonly cache: SalaryTableCacheService) {
    }

}
