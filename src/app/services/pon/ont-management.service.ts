import {Injectable} from '@angular/core';
import {ApiService} from "../api.service";
import {filter, first, ReplaySubject, switchMap, tap} from "rxjs";
import {BlockUiService} from "../block-ui.service";
import {BillingUserItemData, Ont} from "../../types/transport-interfaces";
import {ConfirmationService} from "primeng/api";
import {RealTimeUpdateService} from "../real-time-update.service";

@Injectable({
    providedIn: 'root'
})
export class OntManagementService {

    openRename$ = new ReplaySubject<{ event: Event, id: number, oldName: string } | null>(1);
    openAssignLogin$ = new ReplaySubject<{ event: Event, id: number, oldLogin: string } | null>(1);
    openAssignOnt$ = new ReplaySubject<{ event: Event, login: string, ont: Ont | null } | null>(1);
    userSuggestions: BillingUserItemData[] = [];
    ontSuggestions: Ont[] = [];
    updatingOntIds: number[] = [];

    constructor(private api: ApiService, private rt: RealTimeUpdateService,
                private blockUi: BlockUiService, private confirmService: ConfirmationService) {
    }

    hideAll() {
        this.openRename$.next(null);
        this.openAssignLogin$.next(null);
        this.openAssignOnt$.next(null);
    }

    getUserSuggestions(query: string) {
        this.api.getUserSuggestions(query).subscribe(data => this.userSuggestions = data);
    }

    getOntSuggestions(query: string) {
        this.api.getOntSuggestions(query).subscribe(data => this.ontSuggestions = data);
    }

    rename(newName: string | null) {
        this.openRename$
            .pipe(
                first(),
                filter(d => !!d),
                tap(id => this.blockUi.wait({message: 'Переименовываем терминал...'})),
                switchMap(data => this.api.renameOnt(data!.id, newName ?? ''))
            )
            .subscribe({
                next: () => this.blockUi.unblock(),
                error: () => this.blockUi.unblock()
            })
    }

    assignLogin(newLogin: string | null) {
        this.openAssignLogin$
            .pipe(
                first(),
                filter(d => !!d),
                tap(id => this.blockUi.wait({message: 'Назначаем логин...'})),
                switchMap(data => this.api.assignLoginToOnt(data!.id, newLogin ?? ''))
            )
            .subscribe({
                next: () => this.blockUi.unblock(),
                error: () => this.blockUi.unblock()
            })
    }

    assignOnt(newOnt: Ont | null) {
        if(newOnt)
            this.openAssignOnt$
                .pipe(
                    first(),
                    filter(d => !!d),
                    tap(id => this.blockUi.wait({message: 'Назначаем терминал...'})),
                    switchMap(data => this.api.assignLoginToOnt(newOnt.id, data!.login))
                )
                .subscribe({
                    next: () => this.blockUi.unblock(),
                    error: () => this.blockUi.unblock()
                })
    }

    reboot(id: number) {
        this.confirmService.confirm({
            header: 'Перезагрузка',
            message: `Вы уверены, что хотите перезагрузить терминал?`,
            accept: () => {
                this.api.rebootOnt(id).subscribe();
            }
        })
    }

    update(id: number) {
        this.api.updateOnt(id)
            .pipe(
                switchMap((workerId)=> {
                    this.updatingOntIds.push(id);
                    return this.rt.receiveSpentWorkersInQueue()
                        .pipe(
                            filter(worker => worker.id === workerId),
                            first()
                        )
                })
            )
            .subscribe(
                {
                    next: () => {
                        this.updatingOntIds.splice(this.updatingOntIds.indexOf(id), 1);
                    },
                    error: () => {
                        this.updatingOntIds.splice(this.updatingOntIds.indexOf(id), 1);
                    }
                }
            );
    }

    isUpdatingOnt(id: number) {
        return this.updatingOntIds.includes(id);
    }
}
