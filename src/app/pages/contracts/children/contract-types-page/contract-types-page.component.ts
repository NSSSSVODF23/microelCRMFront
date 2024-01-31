import {Component, OnInit, ViewChild} from '@angular/core';
import {DynamicValueFactory} from "../../../../util";
import {ApiService} from "../../../../services/api.service";
import {RealTimeUpdateService} from "../../../../services/real-time-update.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Employee, TypesOfContracts} from "../../../../types/transport-interfaces";
import {ConfirmationService} from "primeng/api";
import {InputTextarea} from "primeng/inputtextarea";

@Component({
    templateUrl: './contract-types-page.component.html', styleUrls: ['./contract-types-page.component.scss']
})
export class ContractTypesPageComponent implements OnInit {

    typesContracts$ = DynamicValueFactory.of(this.api.getContractTypesList(), 'typeOfContractId', this.rt.createTypeOfContract(), this.rt.updateTypeOfContract(), this.rt.deleteTypeOfContract());

    createDialogVisible = false;
    editDialogVisible = false;

    isRequestSending = false;

    editingContractTypeId?: number;

    typeContractForm = new FormGroup({
        name: new FormControl<string>('', [Validators.required, Validators.minLength(3)]),
        description: new FormControl<string>(''),
        receivers: new FormControl<Employee[]>([], [Validators.required, Validators.minLength(1), Validators.maxLength(10)]),
        archivers: new FormControl<Employee[]>([], [Validators.required, Validators.minLength(1), Validators.maxLength(10)])
    });

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private confirmService: ConfirmationService) {
    }

    ngOnInit(): void {
    }

    openCreateDialog() {
        this.createDialogVisible = true;
        this.typeContractForm.reset({
            name: '', description: '', receivers: [], archivers: []
        });
    }

    openEditDialog(event: { event: any, typeContract: TypesOfContracts }) {
        this.editDialogVisible = true;
        this.editingContractTypeId = event.typeContract.typeOfContractId;
        this.typeContractForm.reset({
            name: event.typeContract.name,
            description: event.typeContract.description,
            receivers: event.typeContract.receivers,
            archivers: event.typeContract.archivers,
        })
    }

    openDeleteDialog(event: { event: any, typeContract: TypesOfContracts }) {
        this.confirmService.confirm({
            header: 'Удаление типа договора', message: 'Вы действительно хотите удалить тип договора?', accept: () => {
                this.api.removeContractType(event.typeContract.typeOfContractId).subscribe();
            }
        });
    }

    createTypeOfContract() {
        this.isRequestSending = true;
        const {name, description, receivers, archivers} = this.typeContractForm.value;

        this.api.createContractType(
            {
                name: name ?? '',
                description: description ?? '',
                receivers: receivers?.map(e => e.login) ?? [],
                archivers: archivers?.map(e => e.login) ?? []
            }
        )
            .subscribe({
                next: () => {
                    this.createDialogVisible = false;
                    this.isRequestSending = false;
                }, error: () => {
                    this.isRequestSending = false;
                }
            })
    }

    editTypeOfContract() {
        if (!this.editingContractTypeId) return;
        this.isRequestSending = true;
        const {name, description, receivers, archivers} = this.typeContractForm.value;

        this.api.updateContractType(this.editingContractTypeId, {
            name: name ?? '',
            description: description ?? '',
            receivers: receivers?.map(e => e.login) ?? [],
            archivers: archivers?.map(e => e.login) ?? []
        })
            .subscribe({
                next: () => {
                    this.editDialogVisible = false;
                    this.isRequestSending = false;
                }, error: () => {
                    this.isRequestSending = false;
                }
            })
    }
}
