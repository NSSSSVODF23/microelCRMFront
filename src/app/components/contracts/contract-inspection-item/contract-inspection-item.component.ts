import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Contract, Employee, WorkLog} from "../../../types/transport-interfaces";
import {FormArray, FormControl, FormGroup} from "@angular/forms";
import {first, map} from "rxjs";
import {ApiService} from "../../../services/api.service";
import {BlockUiService} from "../../../services/block-ui.service";
import {PersonalityService} from "../../../services/personality.service";

type ContractControl = FormGroup<{ name: FormControl<string>, id: FormControl<number>, count: FormControl<number>, checked: FormControl<boolean> }>;
type ContractValue = Partial<{ name: string, id: number, count: number, checked: boolean }>;

@Component({
    selector: 'app-contract-inspection-item',
    templateUrl: './contract-inspection-item.component.html',
    styleUrls: ['./contract-inspection-item.component.scss']
})
export class ContractInspectionItemComponent implements OnInit, OnChanges {

    @Input() workLog?: WorkLog;

    receiveContracts = new FormArray<ContractControl>([]);
    initialReceiveValues = [] as ContractValue[];
    archiveContracts = new FormArray<ContractControl>([]);
    initialArchiveValues = [] as ContractValue[];

    receiveHasChanged$ = this.receiveContracts.valueChanges.pipe(map(value => this.hasChangeForm(value, this.initialReceiveValues)));
    archiveHasChanged$ = this.archiveContracts.valueChanges.pipe(map(value => this.hasChangeForm(value, this.initialArchiveValues)));

    constructor(private api: ApiService, private blockService: BlockUiService, private personality: PersonalityService) {
    }

    ngOnInit(): void {
    }

    ngOnChanges(changes: SimpleChanges): void {
        const WORK_LOG_CHANGE = changes['workLog'];

        this.receiveContracts.clear();
        this.archiveContracts.clear();

        if (WORK_LOG_CHANGE && WORK_LOG_CHANGE.currentValue) {
            this.personality.userLogin$.pipe(first()).subscribe(login => {
                const {concludedContracts} = WORK_LOG_CHANGE.currentValue as WorkLog;
                this.setupControls(concludedContracts, login);
            })
        }
    }

    receiveCheck() {
        this.blockService.wait({message: "Приемка договоров"});
        this.api.markContractsAsReceived(
            this.receiveContracts.value
                .filter(value => this.hasChange(value, this.initialReceiveValues))
                .map(value => value.id!)
        ).subscribe({
            next: () => {
                this.blockService.unblock();
            },
            error: () => {
                this.blockService.unblock();
            }
        })
    }

    archiveCheck() {
        this.blockService.wait({message: "Архивация договоров"});
        this.api.markContractsAsArchived(
            this.archiveContracts.value
                .filter(value => this.hasChange(value, this.initialArchiveValues))
                .map(value => value.id!)
        ).subscribe({
            next: () => {
                this.blockService.unblock();
            },
            error: () => {
                this.blockService.unblock();
            }
        })
    }

    private hasChangeForm(values: ContractValue[], initials: ContractValue[]): boolean {
        return values.reduce((acc, value) => acc || this.hasChange(value, initials), false);
    }

    private hasChange(value: ContractValue, initials: ContractValue[]): boolean {
        return value.checked !== initials.find(initial => initial.id === value.id)?.checked;
    }

    private setupControls(concludedContracts: Contract[], login: string){
        this.receiveContracts.clear();
        this.archiveContracts.clear();

        for (let contract of concludedContracts) {
            this.appendReceiveControls(contract, login);
            this.appendArchiveControls(contract, login);
        }

        this.initialReceiveValues = this.receiveContracts.value;
        this.initialArchiveValues = this.archiveContracts.value;
    }

    private appendReceiveControls(contract: Contract, login: string) {
        const RECEIVE_CONTROL = new FormGroup({
            name: new FormControl(contract.typeOfContract.name),
            id: new FormControl(contract.contractId),
            checked: new FormControl(!!contract.received),
            count: new FormControl(contract.count)
        }) as ContractControl;

        if (
            !!contract.received ||
            this.loginIsNotInTheList(login, contract.typeOfContract.receivers)
        ) RECEIVE_CONTROL.disable()

        this.receiveContracts.push(RECEIVE_CONTROL)
    }

    private appendArchiveControls(contract: Contract, login: string) {
        const ARCHIVE_CONTROL = new FormGroup({
            name: new FormControl(contract.typeOfContract.name),
            id: new FormControl(contract.contractId),
            checked: new FormControl(!!contract.archived),
            count: new FormControl(contract.count)
        }) as ContractControl;

        if (
            !contract.received ||
            !!contract.archived ||
            this.loginIsNotInTheList(login, contract.typeOfContract.archivers)
        ) ARCHIVE_CONTROL.disable()

        this.archiveContracts.push(ARCHIVE_CONTROL);
    }

    private loginIsNotInTheList(login: string, list: Employee[]): boolean {
        return !list.map(e=>e.login).includes(login);
    }

}
