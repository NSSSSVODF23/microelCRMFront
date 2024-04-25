import {Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR} from "@angular/forms";
import {Employee} from "../../../types/transport-interfaces";
import {SubscriptionsHolder} from "../../../util";
import {TFactorAction, WorksPickerValue} from "../works-picker/works-picker.component";
import {filter, fromEvent, map, merge, Observable, Subscription} from "rxjs";

@Component({
    selector: 'app-employee-sum-distribution',
    templateUrl: './employee-sum-distribution.component.html',
    styleUrls: ['./employee-sum-distribution.component.scss'],
    providers: [{
        provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => EmployeeSumDistributionComponent), multi: true
    }]
})
export class EmployeeSumDistributionComponent implements OnInit, OnDestroy, ControlValueAccessor {

    employeeRatioSubscriptions = new SubscriptionsHolder();
    employeeRatioForm = new FormGroup<{ [key: string]: FormGroup }>({})
    isDisabled = false;
    shiftDown$ = fromEvent(document, 'keydown').pipe( filter((event: Partial<KeyboardEvent>) => event.key === 'Shift'), map(() => 0.10));
    shiftUp$ = fromEvent(document, 'keyup').pipe( filter((event: Partial<KeyboardEvent>) => event.key === 'Shift'), map(() => 0.01));
    ctrlDown$ = fromEvent(document, 'keydown').pipe( filter((event: Partial<KeyboardEvent>) => event.key === 'Control'), map(() => 0.05));
    ctrlUp$ = fromEvent(document, 'keyup').pipe( filter((event: Partial<KeyboardEvent>) => event.key === 'Control'), map(() => 0.01));
    sliderStep$ = merge(this.shiftDown$, this.shiftUp$, this.ctrlDown$, this.ctrlUp$);

    private formSub?: Subscription;

    constructor() {
    }

    private _employees: Employee[] = [];

    get employees(): Employee[] {
        return this._employees
    }

    @Input() set employees(employees: Employee[] | null | undefined) {
        if (employees === null || employees === undefined) {
            this._employees = [];
            return;
        }
        this._employees = employees;
        const employeesCount = employees.length;
        const initRatio = 1 / employeesCount;
        this.employeeRatioForm = new FormGroup(employees.reduce((prev, curr) => {
            const employeeGroup = new FormGroup({
                ratio: new FormControl(initRatio), sum: new FormControl(initRatio * this.totalCostOfWork)
            })
            this.employeeRatioSubscriptions.addSubscription(curr.login + 'rt', employeeGroup.controls.ratio.valueChanges.subscribe((currRatio) => {
                if (currRatio === null) return;
                const currentLogin = curr.login;
                const sumOfOtherRatios = Object.keys(this.employeeRatioForm.value)
                    .filter(login => login !== currentLogin)
                    .map(login => this.employeeRatioForm.value[login].ratio)
                    .reduce((prev, curr) => {
                        return prev + curr;
                    }, 0);
                if ((currRatio + sumOfOtherRatios) > 1) {
                    const delta = (currRatio + sumOfOtherRatios) - 1;
                    const patchValue: { [key: string]: { ratio: number, sum: number } } = {};
                    for (let login in this.employeeRatioForm.value) {
                        patchValue[login] = {ratio: 0, sum: 0};
                        if (login === currentLogin) continue;
                        const ratio = this.employeeRatioForm.value[login].ratio;
                        const ratioPercent = ratio / sumOfOtherRatios;
                        patchValue[login].ratio = ratio - (delta * ratioPercent);
                        patchValue[login].sum = patchValue[login].ratio * this.totalCostOfWork;
                    }
                    patchValue[currentLogin].ratio = currRatio;
                    patchValue[currentLogin].sum = currRatio * this.totalCostOfWork;
                    this.employeeRatioForm.patchValue(patchValue, {emitEvent: false});
                } else {
                    this.employeeRatioForm.patchValue({
                        [currentLogin]: {
                            ratio: currRatio, sum: currRatio * this.totalCostOfWork
                        }
                    }, {emitEvent: false});
                }
            }));
            this.employeeRatioSubscriptions.addSubscription(curr.login + 'sum', employeeGroup.controls.sum.valueChanges.subscribe((currSum) => {
                if (currSum !== null && currSum > this.totalCostOfWork) currSum = this.totalCostOfWork;
                if (currSum === null) return;
                const currentLogin = curr.login;
                const sumOfOtherAmounts = Object.keys(this.employeeRatioForm.value)
                    .filter(login => login !== currentLogin)
                    .map(login => this.employeeRatioForm.value[login].sum)
                    .reduce((prev, curr) => {
                        return prev + curr;
                    }, 0);
                if ((currSum + sumOfOtherAmounts) > this.totalCostOfWork) {
                    const delta = (currSum + sumOfOtherAmounts) - this.totalCostOfWork;
                    const patchValue: { [key: string]: { ratio: number, sum: number } } = {};
                    for (let login in this.employeeRatioForm.value) {
                        patchValue[login] = {ratio: 0, sum: 0};
                        if (login === currentLogin) continue;
                        const sum = this.employeeRatioForm.value[login].sum;
                        const ratioPercent = sum / sumOfOtherAmounts;
                        patchValue[login].sum = sum - (delta * ratioPercent);
                        patchValue[login].ratio = patchValue[login].sum / this.totalCostOfWork;
                    }
                    patchValue[currentLogin].sum = currSum;
                    patchValue[currentLogin].ratio = currSum / this.totalCostOfWork;
                    this.employeeRatioForm.patchValue(patchValue, {emitEvent: false});
                } else {
                    this.employeeRatioForm.patchValue({
                        [currentLogin]: {
                            ratio: currSum / this.totalCostOfWork, sum: currSum
                        }
                    }, {emitEvent: false});
                }
            }));
            return {
                ...prev, [curr.login]: employeeGroup
            }
        }, {}))
        setTimeout(()=> this.onChange(this.employeeRatioForm.value))
        this.formSub?.unsubscribe();
        this.formSub = this.employeeRatioForm.valueChanges.subscribe((value) => {
            this.onChange(value);
            this.onTouched();
        })
    }

    actionPicker$?: Observable<WorksPickerValue|null>;
    actionPickerSub?: Subscription;

    @Input() set actionPicker(actionPicker: Observable<WorksPickerValue|null> | null | undefined) {
        this.actionPickerSub?.unsubscribe();
        if (actionPicker === null || actionPicker === undefined) {
            this.actionPicker$ = undefined;
            return;
        }
        this.actionPicker$ = actionPicker;
        this.actionPickerSub = this.actionPicker$.subscribe(value => {
            if(!value) return;
            this._actionsTaken = value.actionsTaken;
            this._factorsActions = value.factorsActions ?? [];
            this.recalculateAmountsForEmployees();
        })
    }

    private _factorsActions: TFactorAction[] = [];

    get factorsActions(): TFactorAction[] {
        return this._factorsActions
    }

    private _actionsTaken: any[] = [];

    get actionsTaken(): any[] {
        return this._actionsTaken
    }

    get totalCostOfWork() {
        return this.actionsTaken.reduce((total, action) => total + action.cost, 0);
    };

    get allMoney() {
        if (!this.employeeRatioForm.value) return 0;
        return Object.values(this.employeeRatioForm.value).reduce((prev, curr) => {
            return prev + curr.sum
        }, 0)
    }

    get allMoneyWithRatio() {
        return this.allMoney + this.getTotalWorkActionsRatioSum();
    }

    @Output() onRemoveFactorAction = new EventEmitter<TFactorAction[]>();

    getTotalWorkActionsRatioSum() {
        return this.factorsActions.reduce((prev, curr) => {
            return prev + this.getWorkActionsRatioSum(curr.uuid);
        }, 0);
    }

    onChange: any = () => {
    };

    onTouched: any = () => {
    };

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        this.formSub?.unsubscribe();
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    equalize() {
        const employeesCount = this.employees.length;
        const initRatio = 1 / employeesCount;
        const ratios = Object.keys(this.employeeRatioForm.value).map(login=>login).reduce((prev, curr) => {
            return  {...prev,[curr]:{ratio:initRatio, sum: initRatio * this.totalCostOfWork}}
        },{})
        this.employeeRatioForm.patchValue(ratios);
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }

    writeValue(obj: any): void {
        this.employeeRatioForm.patchValue(obj,{emitEvent: false});
    }

    trackByEmployee(index: number, employee: any) {
        return employee.login + employee.fullName + employee.avatar;
    };

    trackByWar(index: number, war: any) {
        return war.uuid + war.name + war.factor;
    };

    hasWorkActionRatio(login: string) {
        return this.factorsActions.find(w => w.login === login)
    }

    getFactorsActions(login: string) {
        return this.factorsActions.filter(war => war.login === login)
    }

    removeWorkActionRatio(uuid: string) {
        this.onRemoveFactorAction.emit(this.factorsActions.filter(w => w.uuid !== uuid));
    }

    getEmployeeTotalPayment(login: string) {
        return this.employeeRatioForm.value[login].sum + this.getFactorsActions(login).reduce((prev, curr) => {
            return prev + this.getWorkActionsRatioSum(curr.uuid);
        }, 0)
    }

    getWorkActionsRatioSum(uuid: string) {
        const factorAction = this.factorsActions.find(war => war.uuid === uuid);
        if (factorAction) {
            const costOfWork = factorAction.actionUuids.reduce((prev, curr) => {
                const actionTaken = this.actionsTaken.find(at => at.uuid === curr);
                if (!actionTaken) return prev;
                return prev + actionTaken.cost;
            }, 0);
            const employeeRatio = this.employeeRatioForm.value[factorAction.login].ratio;
            const cost = costOfWork * employeeRatio;
            return Math.round((cost * factorAction.factor) - cost);
        }
        return 0;
    }

    recalculateAmountsForEmployees() {
        for (const login in this.employeeRatioForm.value) {
            const current = this.employeeRatioForm.value[login];
            this.employeeRatioForm.patchValue({
                [login]: {
                    ratio: current.ratio, sum: current.ratio * this.totalCostOfWork
                }
            }, {emitEvent: false});
        }
    }
}
