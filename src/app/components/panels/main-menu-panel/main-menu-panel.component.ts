import {Component, OnInit} from '@angular/core';
import {MainMenuService} from "../../../services/main-menu.service";

@Component({
    selector: 'app-main-menu-panel',
    templateUrl: './main-menu-panel.component.html',
    styleUrls: ['./main-menu-panel.component.scss']
})
export class MainMenuPanelComponent implements OnInit {


    constructor(readonly menuService: MainMenuService) {
    }

    ngOnInit(): void {
    }

}
