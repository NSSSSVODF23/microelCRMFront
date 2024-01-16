import {Component, OnDestroy, OnInit} from '@angular/core';
import {LoadingState, Page, PaidAction, PaidActionUnit} from "../../types/transport-interfaces";
import {ApiService} from "../../services/api.service";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {SubscriptionsHolder} from "../../util";
import {ActivatedRoute, Router} from "@angular/router";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {combineLatest, debounceTime, distinctUntilChanged, map} from "rxjs";
import {ConfirmationService} from "primeng/api";

@Component({
    templateUrl: './paid-actions-page.component.html',
    styleUrls: ['./paid-actions-page.component.scss']
})
export class PaidActionsPageComponent implements OnInit, OnDestroy {
    paidActionsPage?: Page<PaidAction>;
    loadingState: LoadingState = LoadingState.LOADING;

    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();
    filterForm = new FormGroup({
        nameQuery: new FormControl(''),
        includeDeleted: new FormControl(false)
    });

    page = 0;
    createDialogVisible = false;
    createDialogMode: 'create' | 'edit' = 'create';
    editingPaidActionId: number | undefined;
    createForm = new FormGroup({
        name: new FormControl<string>('', [Validators.required]),
        description: new FormControl<string>(''),
        cost: new FormControl<number>(0, [Validators.required]),
        unit: new FormControl<string>('', [Validators.required]),
    })
    typeOptions = [
        {label: 'За штуку', value: PaidActionUnit.AMOUNT},
        {label: 'За метр', value: PaidActionUnit.METRES},
        {label: 'За килограмм', value: PaidActionUnit.KILOGRAMS},
    ];
    beginCreate = false;
    get withoutNDFL(){
        if(!this.createForm.value.cost) return 0;
        return Math.round(this.createForm.value.cost-this.createForm.value.cost*0.13);
    };

    unitName(unit: PaidActionUnit) {
        switch (unit) {
            case PaidActionUnit.AMOUNT:
                return 'шт.';
            case PaidActionUnit.METRES:
                return 'метр';
            case PaidActionUnit.KILOGRAMS:
                return 'кг.';
        }
    }

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private route: ActivatedRoute, readonly router: Router, readonly confirm: ConfirmationService) {
    }

    get createDialogHeader() {
        return this.createDialogMode === 'create' ? 'Создание платного действия' : 'Редактирование платного действия';
    };

    trackByPaidAction(index: number, item: PaidAction) {
        return item.paidActionId + item.name + item.description + item.cost + item.unit;
    };

    ngOnInit(): void {
        this.filterForm.valueChanges.pipe(
            debounceTime(1000),
            distinctUntilChanged()
        ).pipe(
            map(value => {
                let query: any = {includeDeleted: value.includeDeleted}
                if (value.nameQuery) {
                    query['nameQuery'] = value.nameQuery;
                }
                this.page = 0;
                return query;
            })
        ).subscribe(value => {
            this.router.navigate(['.'], {relativeTo: this.route, queryParams: value}).then();
        });

        const params = this.route.params.pipe(distinctUntilChanged());
        const query = this.route.queryParams.pipe(distinctUntilChanged());

        combineLatest([params, query]).subscribe(([params, query]) => {
            this.loadingState = LoadingState.LOADING;
            // this.filterForm.disable({emitEvent: false});
            this.filterForm.patchValue({
                nameQuery: query['nameQuery'] ?? '',
                includeDeleted: query['includeDeleted'] === 'true'
            });

            this.api.getPageOfPaidActions(params['page']-1, query).subscribe({
                next: paidActions => {
                    if (paidActions.totalElements > 0) {
                        this.loadingState = LoadingState.READY;
                    } else {
                        this.loadingState = LoadingState.EMPTY;
                    }
                    this.paidActionsPage = paidActions;
                },
                error: () => this.loadingState = LoadingState.ERROR,
                complete: () => {
                    // this.filterForm.enable({emitEvent: false});
                    this.page = params['page'] || 0;
                }
            })
        });

        this.subscriptions.addSubscription('paCr', this.rt.paidActionCreated().subscribe(paidAction => {
            const exist = this.paidActionsPage?.content.find(p => p.identifier === paidAction.identifier);
            if (exist) return;
            this.paidActionsPage?.content.unshift(paidAction);
            if(this.paidActionsPage && this.paidActionsPage.content.length>25){
                // И удаляем последнюю
                this.paidActionsPage?.content.pop();
            }
        }));

        this.subscriptions.addSubscription('paEd', this.rt.paidActionUpdated().subscribe(paidAction => {
            if (!this.paidActionsPage) return;
            const index = this.paidActionsPage.content.findIndex(p => p.identifier === paidAction.identifier);
            if (index !== -1)
                this.paidActionsPage.content[index] = paidAction;
        }));

        this.subscriptions.addSubscription('paDe', this.rt.paidActionDeleted().subscribe(paidAction => {
            if (!this.paidActionsPage) return;
            const index = this.paidActionsPage.content.findIndex(p => p.identifier === paidAction.identifier);
            if (index !== -1) {
                this.paidActionsPage.content.splice(index, 1);
                this.paidActionsPage.totalElements--;
            }
        }))
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll();
    }

    changePage(page: number) {
        this.router.navigate(['/salary', 'paid-actions', page+1], {queryParamsHandling: 'merge'});
    }

    openCreationDialog(action?: PaidAction) {
        this.createForm.reset();
        this.createDialogMode = action ? 'edit' : 'create';
        this.editingPaidActionId = action?.paidActionId;
        if(action)
        this.createForm.setValue({
            name: action.name,
            description: action.description ?? '',
            cost: action.cost,
            unit: action.unit
        })
        this.createDialogVisible = true;
    }

    createPaidAction() {
        if (!this.createForm.valid) return;
        this.createForm.disable({emitEvent: false});
        this.beginCreate = true;
        const formValue: any = this.createForm.value;
        this.api.createPaidAction(formValue).subscribe({
            next: () => {
                this.createForm.enable({emitEvent: false});
                this.createDialogVisible = false;
                this.beginCreate = false;
            },
            error: () => {
                this.createForm.enable({emitEvent: false});
                this.beginCreate = false;
            }
        })
    }

    editPaidAction() {
        if(!this.createForm.valid || !this.editingPaidActionId) return;
        this.createForm.disable({emitEvent: false});
        this.beginCreate = true;
        const formValue: any = this.createForm.value;
        this.api.editPaidAction(this.editingPaidActionId, formValue).subscribe({
            next: () => {
                this.createForm.enable({emitEvent: false});
                this.createDialogVisible = false;
                this.beginCreate = false;
            },
            error: () => {
                this.createForm.enable({emitEvent: false});
                this.beginCreate = false;
            }
        })
    }

    deletePaidAction(paidActionId: number) {
        this.confirm.confirm({
            header: 'Подтверждение',
            message: 'Удалить платное действие?',
            accept: () => {
                this.api.deletePaidAction(paidActionId).subscribe();
            }
        })
    }
}
