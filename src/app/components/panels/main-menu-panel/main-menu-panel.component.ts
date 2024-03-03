import {Component, OnInit} from '@angular/core';
import {ExtendedMenuModel} from "../../controls/extended-menu-item/extended-menu-item.component";
import {ApiService} from "../../../services/api.service";
import {ActivatedRoute, NavigationEnd, NavigationStart, Router} from "@angular/router";
import {filter, map, Observable, shareReplay} from "rxjs";
import {Wireframe} from "../../../types/transport-interfaces";
import {TasksCatalogPageCacheService} from "../../../services/tasks-catalog-page-cache.service";
import {PersonalityService} from "../../../services/personality.service";
import {AccessFlag} from "../../../types/access-flag";
import {MainMenuService} from "../../../services/main-menu.service";
import {MenuItem} from "primeng/api";
import {FormControl} from "@angular/forms";

@Component({
    selector: 'app-main-menu-panel',
    templateUrl: './main-menu-panel.component.html',
    styleUrls: ['./main-menu-panel.component.scss']
})
export class MainMenuPanelComponent implements OnInit {


    constructor(readonly menuService: MainMenuService) {}

    ngOnInit(): void {
    }

}
