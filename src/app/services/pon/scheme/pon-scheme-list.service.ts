import {Injectable} from '@angular/core';
import {ApiService} from "../../api.service";
import {RealTimeUpdateService} from "../../real-time-update.service";
import {map, shareReplay, startWith, switchMap} from "rxjs";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {PonForm} from "../../../pon/scheme/froms";
import {ConfirmationService} from "primeng/api";
import {BlockUiService} from "../../block-ui.service";
import {PonData} from "../../../pon/scheme/elements";
import {Router} from "@angular/router";
import {EventType} from "../../../types/transport-interfaces";

@Injectable({
    providedIn: 'root'
})
export class PonSchemeListService {

    ponSchemeForm = new FormGroup({
        name: new FormControl('', [Validators.required]),
        description: new FormControl(''),
    });
    editableSchemeId?: number;
    modifySchemeInProcess = false;
    ponSchemeDialogVisible = false;

    selectedPonScheme?: number;

    ponSchemeLoader$ = this.api.getPonSchemes().pipe(shareReplay(1));
    ponSchemeList$ = this.rt.receiveSchemeChange()
        .pipe(
            startWith(null),
            switchMap(event => {
                if (!event) return this.ponSchemeLoader$;
                return this.ponSchemeLoader$.pipe(map(schemes => {
                    switch (event.type) {
                        case EventType.CREATE:
                            return [event.scheme, ...schemes];
                        case EventType.UPDATE:
                            return schemes.map(scheme => {
                                if (scheme.id === event.scheme.id) {
                                    return event.scheme;
                                }
                                return scheme;
                            });
                        case EventType.DELETE:
                            return schemes.filter(scheme => {
                                return scheme.id !== event.scheme.id;
                            });
                    }
                    return [];
                }))
            }),
            shareReplay(1)
        );

    constructor(private api: ApiService, private rt: RealTimeUpdateService, private router: Router,
                private confirmService: ConfirmationService, private blockUi: BlockUiService) {
    }

    selectScheme(scheme: PonData.PonScheme) {
        this.selectedPonScheme = scheme.id;
    }

    openCreateDialog() {
        this.editableSchemeId = undefined;
        this.ponSchemeForm.reset({
            name: '',
            description: ''
        });
        this.ponSchemeDialogVisible = true;
    }

    openEditDialog(scheme: PonData.PonScheme) {
        this.editableSchemeId = scheme.id;
        this.ponSchemeForm.reset({
            name: scheme.name,
            description: scheme.description
        });
        this.ponSchemeDialogVisible = true;
    }

    createScheme() {
        this.modifySchemeInProcess = true;
        this.api.createPonScheme(this.ponSchemeForm.value as PonForm.Scheme).subscribe({
            next: scheme => {
                this.ponSchemeDialogVisible = false;
                this.modifySchemeInProcess = false;
            },
            error: () => {
                this.modifySchemeInProcess = false;
            }
        });
    }

    editScheme() {
        if (!this.editableSchemeId) return;
        this.modifySchemeInProcess = true;
        this.api.updatePonScheme(this.editableSchemeId, this.ponSchemeForm.value as PonForm.Scheme).subscribe({
            next: scheme => {
                this.ponSchemeDialogVisible = false;
                this.modifySchemeInProcess = false;
            },
            error: () => {
                this.modifySchemeInProcess = false;
            }
        });
    }

    deleteScheme(id: number) {
        this.confirmService.confirm({
            message: 'Вы действительно хотите удалить схему?',
            header: 'Удаление схемы',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.blockUi.wait({message: 'Удаление схемы...'})
                this.api.deletePonScheme(id).subscribe({
                    next: () => {
                        this.blockUi.unblock();
                    },
                    error: () => {
                        this.blockUi.unblock();
                    }
                });
            }
        });
    }

    openViewScheme(scheme: PonData.PonScheme) {
        this.router.navigate(['/pon', 'scheme', scheme.id], {queryParams: {mode: 'view'}}).then();
    }
}
