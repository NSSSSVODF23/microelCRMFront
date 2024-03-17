import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {PonTerminalsListService} from "../../../../services/page-cache/pon-terminals-list.service";
import {fadeFast} from "../../../../animations";
import {OntManagementService} from "../../../../services/pon/ont-management.service";
import {MenuItem} from "primeng/api";
import {Ont} from "../../../../types/transport-interfaces";
import {ContextMenu} from "primeng/contextmenu";
import {AutoUnsubscribe} from "../../../../decorators";
import {fromEvent} from "rxjs";
import {Table} from "primeng/table";

@Component({
    templateUrl: './pon-terminals-page.component.html',
    styleUrls: ['./pon-terminals-page.component.scss'],
    animations: [fadeFast]
})
@AutoUnsubscribe()
export class PonTerminalsPage implements OnInit {

    @ViewChild('tableEl') tableEl?: Table;

    ontMgmtOptions!: MenuItem[];
    selectedOnt: Ont | null = null;

    closeAuxPopups = fromEvent(document, 'contextmenu')
        .subscribe(() => {
            this.ontMgmt.hideAll()
        })

    constructor(readonly service: PonTerminalsListService, readonly ontMgmt: OntManagementService) {
    }

    ngOnInit(): void {
    }

    statusText(status: boolean) {
        return status ? 'В сети' : 'Не в сети'
    }

    statusTextClass(status: boolean) {
        return status ? 'text-green-400' : 'text-red-400'
    }

    signalText(signal: number) {
        return signal ? signal.toFixed(2) : 'Нет сигнала'
    }

    signalTextClass(signal: number) {
        if (!signal) return 'text-bluegray-300';
        if (signal < -28.5) return 'text-red-600';
        if (signal < -25.5) return 'text-orange-400';
        if (signal < 0) return 'text-green-500';
        return 'text-bluegray-500'
    }

    scrollTop() {
        window.scroll(0, 0)
    }

    showContextMenu(cm: ContextMenu, event: MouseEvent, ont: Ont) {
        this.ontMgmtOptions = [
            {
                label: 'Переименовать',
                icon: 'mdi-drive_file_rename_outline',
                command: () => {
                    this.ontMgmt.openRename$.next({event, id: ont.id, oldName: ont.description});
                }
            },
            {
                label: 'Назначить логин',
                icon: 'mdi-face',
                command: () => {
                    this.ontMgmt.openAssignLogin$.next({event, id: ont.id, oldLogin: ont.userLogin});
                }
            },
            {
                label: 'Перезагрузить',
                icon: 'mdi-restart_alt',
                command: () => {
                    this.ontMgmt.reboot(ont.id);
                }
            }
        ];
        event.preventDefault();
        cm.show(event);
    }
}
