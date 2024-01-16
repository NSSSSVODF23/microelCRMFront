import {Injectable} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {SubscriptionsHolder} from "../util";
import {first, map, merge, mergeMap, Observable, of, pairwise, shareReplay, Subject, switchMap, tap} from "rxjs";
import {LoadingState, SalaryTableCell, WorkReport} from "../types/transport-interfaces";
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {MenuItem} from "primeng/api";

@Injectable({
    providedIn: 'root'
})
export class SalaryTableCacheService {

    filtrationForm = new FormGroup({
        date: new FormControl(new Date()),
        position: new FormControl<number | null>(null),
    })

    accountingMenuItems$: Observable<MenuItem[]> = this.filtrationForm.valueChanges.pipe(
        map(filters => {
            return [
                {
                    label: 'Зарплата монтажников',
                    url: "/api/private/accounting/monthly-salary-report-table?date="+filters.date?.getTime()
                }
            ]
        })
    );



    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();

    tableLoadingState = LoadingState.LOADING;
    tableLoad$ = this.filtrationForm.valueChanges.pipe(
        tap(() => {
            this.tableLoadingState = LoadingState.LOADING
            this.selectDay(null)
        }),
        switchMap(filters => this.api.getSalaryTable(filters).pipe(map(table => ({table,update:null}))) ),
        tap({
            next: () => this.tableLoadingState = LoadingState.READY,
            error: () => this.tableLoadingState = LoadingState.ERROR
        }),
        shareReplay(1)
    )
    tableUpdate$ = this.rt.salaryTableUpdated().pipe(
        switchMap((update)=>this.tableLoad$.pipe(map(cache=>({table:cache.table, update:update})))),
    )
    salaryTable$ = merge(this.tableLoad$, this.tableUpdate$).pipe(
        map(cache=> {
            if(cache.update){
                for(let [cachedIndex,employee] of cache.update.employees.entries()){
                    const index = cache.table.employees.findIndex(cachedEmp=>cachedEmp.login === employee.login);
                    if(index !== -1){
                        cache.table.employees[index] = employee;
                        cache.table.payload[index] = cache.update.payload[cachedIndex];
                        cache.table.totalSum[index] = cache.update.totalSum[cachedIndex];
                        cache.table.totalSumAllEmployees=cache.update.totalSumAllEmployees;
                    }
                }
                this.selectedDay$.pipe(first()).subscribe(salaryCell=>{
                    if(salaryCell === null) return;
                    const index = cache.update.employees.findIndex(cachedEmp=>cachedEmp.login === salaryCell.employee.login);
                    if(index !== -1){
                        const newSalaryCell = cache.update.payload[index].find(cell=>cell.date === salaryCell.date);
                        if(newSalaryCell)
                            this.updateDaySubject.next(newSalaryCell);
                    }
                })
            }
            return cache.table
        }),
        shareReplay(1),
    )
    ndflSwitch = new FormControl(false);
    ndflValue$ = this.ndflSwitch.valueChanges.pipe(
        shareReplay(1)
    );

    positions$ = this.api.getPositions()
        .pipe(
            map(positions => ([{label: 'Все', value: null}, ...positions.map(({name, positionId}) => ({
                label: name,
                value: positionId
            }))])),
        )

    selectDaySubject = new Subject<SalaryTableCell | null>();
    updateDaySubject = new Subject<SalaryTableCell | null>();

    selectedDay$: Observable<SalaryTableCell | null> = merge(this.selectDaySubject.asObservable(),this.updateDaySubject.asObservable()).pipe(shareReplay(1));
    highlightedDay?: { row: number, col: number };
    calculatedLoadingState = LoadingState.LOADING;
    workingDay$ = this.selectedDay$.pipe(
        map((day: any) => day ? [new Date(day.date), day.employee.login] : null),
        tap(() => this.calculatedLoadingState = LoadingState.LOADING),
        mergeMap((day) => {
            if (day) {
                return this.api.getWorkingDay(day[0], day[1])
            } else return of(null)
        }),
        tap(()=>{
            setTimeout(()=> window.scrollTo({top:document.body.scrollHeight}))
        }),
        tap({
            next: (workingDay) => this.calculatedLoadingState = workingDay === null ? LoadingState.EMPTY : LoadingState.READY,
            error: () => this.calculatedLoadingState = LoadingState.ERROR
        })
    )

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
        setTimeout(() => {
            this.filtrationForm.patchValue(this.filtrationForm.value);
        })
    }

    trackByCell(index: number, cell: SalaryTableCell | null) {
        return cell?.date;
    };

    selectDay(cell: SalaryTableCell | null, rowIndex?: number, colIndex?: number) {
        this.selectDaySubject.next(cell);
        if (rowIndex !== undefined && colIndex !== undefined) {
            this.highlightedDay = {row: rowIndex, col: colIndex};
            return;
        }
        this.highlightedDay = undefined;
    }

    getReport(reports: WorkReport[], targetLogin: string) {
        return reports.find(report => report.author.login === targetLogin)?.description;
    }

    isSelected(row: number, col: number) {
        return this.highlightedDay?.row === row && this.highlightedDay?.col === col;
    }
}
