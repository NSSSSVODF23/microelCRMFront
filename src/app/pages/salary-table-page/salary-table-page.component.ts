import {Component, OnDestroy, OnInit} from '@angular/core';
import {SubscriptionsHolder} from "../../util";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiService} from "../../services/api.service";
import {Employee, LoadingState, WorkReport} from "../../types/transport-interfaces";
import {map, mergeMap, Observable, of, shareReplay, Subject, switchMap, tap} from "rxjs";
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
