import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {map, of, Subject, switchMap, tap} from "rxjs";
import {Employee, FieldItem, LoadingState, Wireframe} from "../../transport-interfaces";
import {AbstractControl, FormControl, FormGroup, ValidationErrors, Validators} from "@angular/forms";
import {FormToModelItemConverter, SubscriptionsHolder} from "../../util";
import {TFactorAction, WorksPickerValue} from "../../components/controls/works-picker/works-picker.component";
import {CustomValidators} from "../../custom-validators";
import {InputSwitchOnChangeEvent} from "primeng/inputswitch";

@Component({
    templateUrl: './bypass-work-calculation.component.html',
    styleUrls: ['./bypass-work-calculation.component.scss']
})
export class BypassWorkCalculationComponent implements OnInit, OnDestroy {

    selectedWireframe?: Wireframe;

    wireframesLoadingState = LoadingState.LOADING;
    wireframes$ = of(null).pipe(
        tap(() => {
            this.wireframesLoadingState = LoadingState.LOADING
        }),
        switchMap(() => {
            return this.api.getWireframes(false)
        }),
        tap({
            next: (wfms) => {
                this.wireframesLoadingState = wfms.length > 0 ? LoadingState.READY : LoadingState.EMPTY
            },
            error: () => {
                this.wireframesLoadingState = LoadingState.ERROR
            }
        }),
        map(wireframes => wireframes.map(wf => ({
            label: wf.name,
            value: wf.wireframeId
        }))),
    );

    templateLoadingState = LoadingState.EMPTY;
    taskFields: FieldItem[] = [];
    taskInformationForm = new FormGroup({} as any);
    installers: Employee[] = [];
    loadingInstallers$ = this.api.getInstallersEmployees()
        .pipe(tap({
            next: (installers) => {
                this.installers = installers;
            },
            error: () => {

            }
        }))
    installersReportForm = new FormGroup({
        installers: new FormControl([], [Validators.required]),
        report: new FormControl('', [Validators.required]),
        tags: new FormControl([]),
        date: new FormControl(new Date(), [Validators.required]),
    });
    subscriptions = new SubscriptionsHolder();
    worksPickerForm = new FormControl<WorksPickerValue | null>(null, [this.worksPickerValidator]);
    isSendingCalculation = false;
    employeeRatioForm = new FormControl<{ [key: string]: { ratio: number, sum: number } }>({});
    paidWorkForm = new FormGroup({
        isPaidWork: new FormControl(false),
        amountOfMoneyTaken: new FormControl(null)
    })
    private _selectTemplateSubject = new Subject<number>();
    selectWireframe$ = this._selectTemplateSubject.pipe(
        tap(() => {
            this.templateLoadingState = LoadingState.LOADING
        }),
        switchMap((id) => {
            return this.api.getWireframe(id)
        }),
        tap(() => this.loadingInstallers$.subscribe()),
        tap({
            next: (wf) => {
                this.taskFields = wf.allFields ?? [];
                this.selectedWireframe = wf;
                this.taskInformationForm = new FormGroup(
                    wf.allFields?.reduce((prev, curr) => {
                        return {
                            ...prev,
                            [curr.id]: new FormControl(null, CustomValidators.taskInput(curr.type, curr.variation))
                        }
                    }, {}) ?? new FormGroup({}));
                this.templateLoadingState = LoadingState.READY
            },
            error: () => {
                this.templateLoadingState = LoadingState.ERROR
            }
        })
    );

    constructor(private api: ApiService) {
    }

    worksPickerValidator(control: AbstractControl): ValidationErrors | null {
        const value = control.value;
        if (value === null || value === undefined) return {'required': true};
        if (!('actionsTaken' in value)) return {'required': true};
        if (value.actionsTaken === null || value.actionsTaken === undefined || value.actionsTaken.length === 0) return {'required': true}
        return null;
    }

    ngOnInit(): void {
        this.subscriptions.addSubscription('selwf', this.selectWireframe$.subscribe())
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribeAll();
    }

    selectTemplate(id: number) {
        this._selectTemplateSubject.next(id);
    }

    getFactorsActions(login: string) {
        if (!this.worksPickerForm.value?.factorsActions) return [];
        return this.worksPickerForm.value?.factorsActions.filter(war => war.login === login)
    }

    createTaskAndCalculate() {
        const employees: Employee[] = <Employee[]>this.installersReportForm.value.installers;
        if (!employees
            || !this.worksPickerForm.value?.actionsTaken
            || !this.selectedWireframe ||
            (this.paidWorkForm.value.isPaidWork && (!this.paidWorkForm.value.amountOfMoneyTaken || this.paidWorkForm.value.amountOfMoneyTaken < 1))) return;

        this.isSendingCalculation = true;
        this.worksPickerForm.disable()
        this.employeeRatioForm.disable()
        this.installersReportForm.disable()
        this.taskInformationForm.disable()
        this.paidWorkForm.disable()

        this.api.sendBypassWorkCalculation({
            taskInfo: {
                wireframeId: this.selectedWireframe.wireframeId,
                fields: FormToModelItemConverter.convert(this.taskInformationForm.value, this.selectedWireframe)
            },
            reportInfo: this.installersReportForm.value,
            actions: this.worksPickerForm.value.actionsTaken.map(at => ({
                workId: at.workId,
                actionId: at.actionId,
                count: at.count,
                uuid: at.uuid
            })),
            spreading: employees.map(emp => {
                return {
                    login: emp.login,
                    ratio: this.employeeRatioForm.value ? this.employeeRatioForm.value[emp.login].ratio : 0,
                    factorsActions: this.getFactorsActions(emp.login).filter(war => war).map((war: any) => ({
                        factor: war.factor,
                        name: war.name,
                        actionUuids: war.actionUuids,
                    })),
                }
            }),
            isPaidWork: this.paidWorkForm.value.isPaidWork,
            amountOfMoneyTaken: this.paidWorkForm.value.amountOfMoneyTaken
        }).subscribe(this.sendingCalculationHandler)
    }

    sendingCalculationHandler = {
        next:()=>{
            this.isSendingCalculation = false;
            this.worksPickerForm.enable()
            this.employeeRatioForm.enable()
            this.installersReportForm.enable()
            this.taskInformationForm.enable()
            this.paidWorkForm.enable()
            this.worksPickerForm.reset()
            this.employeeRatioForm.reset()
            this.paidWorkForm.reset()
            this.installersReportForm.reset({
                installers: [],
                report: '',
                tags: [],
                date: new Date(),
            })
            this.taskInformationForm.reset()
        },
        error:()=>{
            this.isSendingCalculation = false;
            this.worksPickerForm.enable()
            this.employeeRatioForm.enable()
            this.installersReportForm.enable()
            this.taskInformationForm.enable()
            this.paidWorkForm.enable()
        }
    }

    removeFactorActionHandler(event: TFactorAction[]) {
        if (this.worksPickerForm.value)
            this.worksPickerForm.setValue({
                actionsTaken: this.worksPickerForm.value.actionsTaken,
                factorsActions: event
            })
    }
}
