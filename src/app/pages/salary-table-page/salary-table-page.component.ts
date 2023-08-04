import {Component, OnDestroy, OnInit} from '@angular/core';
import {SubscriptionsHolder} from "../../util";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiService} from "../../services/api.service";
import {Employee, LoadingState, WorkReport} from "../../transport-interfaces";
import {map, mergeMap, Observable, of, shareReplay, Subject, switchMap, tap} from "rxjs";

interface SalaryTableCell {
    employee: Employee,
    sumWithNDFL: number,
    sumWithoutNDFL: number
    date: Date
}

@Component({
    templateUrl: './salary-table-page.component.html', styleUrls: ['./salary-table-page.component.scss']
})
export class SalaryTablePageComponent implements OnInit, OnDestroy {

    filtrationForm = new FormGroup({
        date: new FormControl(new Date()),
        position: new FormControl<number|null>(null),
    })

    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();

    salaryTable$ = this.filtrationForm.valueChanges.pipe(
        tap(()=> {
            this.tableLoadingState = LoadingState.LOADING
            this.selectDay(null)
        }),
        switchMap(filters => this.api.getSalaryTable(filters)),
        tap({
            next:()=>this.tableLoadingState=LoadingState.READY,
            error:()=>this.tableLoadingState=LoadingState.ERROR
        })
    )

    tableLoadingState = LoadingState.LOADING;

    ndflSwitch = new FormControl(false);
    ndflValue$ = this.ndflSwitch.valueChanges.pipe(
        shareReplay(1)
    );

    positions$ =  this.api.getPositions()
        .pipe(
            map(positions=>positions.map(({name,positionId})=>({label:name,value:positionId}))),
            tap(items=>this.filtrationForm.patchValue({position: items[0].value}))
        )

    selectedDaySubject = new Subject<SalaryTableCell|null>();

    selectedDay$:Observable<SalaryTableCell|null> = this.selectedDaySubject.pipe(shareReplay(1));

    workingDay$ = this.selectedDay$.pipe(
        map((day:any)=>day?[new Date(day.date),day.employee.login]:null),
        tap(()=>this.calculatedLoadingState = LoadingState.LOADING),
        mergeMap((day)=> {
            if (day) {
                return this.api.getWorkingDay(day[0], day[1])
            } else return of(null)
        }),
        tap({
            next:(workingDay)=>this.calculatedLoadingState= workingDay===null?LoadingState.EMPTY:LoadingState.READY,
            error:()=>this.calculatedLoadingState=LoadingState.ERROR
        })
    )

    highlightedDay?: {row:number,col:number};
    calculatedLoadingState = LoadingState.LOADING;

    trackByCell(index:number, cell:SalaryTableCell|null){
        return cell?.date;
    };

    selectDay(cell:SalaryTableCell|null, rowIndex?:number, colIndex?:number){
        this.selectedDaySubject.next(cell);
        if(rowIndex !== undefined && colIndex !== undefined){
            this.highlightedDay = {row:rowIndex,col:colIndex};
            return;
        }
        this.highlightedDay = undefined;
    }

    getReport(reports: WorkReport[], targetLogin: string){
        return reports.find(report=>report.author.login === targetLogin)?.description;
    }

    constructor(private api: ApiService) {
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll();
    }

    isSelected(row: number, col: number) {
        return this.highlightedDay?.row === row && this.highlightedDay?.col === col;
    }
}
