import {Component, OnInit} from '@angular/core';
import {PonSchemeListService} from "../../../../../../services/pon/scheme/pon-scheme-list.service";
import {MenuItem} from "primeng/api";
import {Menu} from "primeng/menu";
import {PonData} from "../../../../../../pon/scheme/elements";
import {ContextButtonStyle} from "../../../../../../components/controls/context-menu/context-menu.component";

@Component({
    templateUrl: './pon-scheme-list-page.component.html',
    styleUrls: ['./pon-scheme-list-page.component.scss']
})
export class PonSchemeListPage implements OnInit {

    schemeMenuOptions: MenuItem[] = [];

    constructor(readonly ponSchemeService: PonSchemeListService) {
    }

    ngOnInit(): void {
    }

    openSchemeMenu(scheme: PonData.PonScheme, event: Event, menuEl: Menu) {
        this.schemeMenuOptions = [
            {
                label: 'Редактировать',
                icon: 'mdi-edit',
                command: () => {
                    this.ponSchemeService.openEditDialog(scheme);
                }
            },
            {
                label: 'Удалить',
                icon: 'mdi-delete',
                styleClass: 'danger-menu-button',
                command: () => {
                    this.ponSchemeService.deleteScheme(scheme.id);
                }
            }
        ];
        if (menuEl.visible) {
            menuEl.target = event.target;
            menuEl.alignOverlay();
        }
        menuEl.show(event);
        // setTimeout(() =>
        //     menuEl.show(event), 100
        // );
        // event.stopPropagation();
    }

}
