import {Component, OnInit} from '@angular/core';
import {ExtendedMenuModel} from "../../controls/extended-menu-item/extended-menu-item.component";
import {ApiService} from "../../../services/api.service";
import {ActivatedRoute} from "@angular/router";
import {map, Observable, shareReplay} from "rxjs";
import {Wireframe} from "../../../types/transport-interfaces";
import {TasksCatalogPageCacheService} from "../../../services/tasks-catalog-page-cache.service";
import {PersonalityService} from "../../../services/personality.service";
import {AccessFlag} from "../../../types/access-flag";

@Component({
    selector: 'app-main-menu-panel',
    templateUrl: './main-menu-panel.component.html',
    styleUrls: ['./main-menu-panel.component.scss']
})
export class MainMenuPanelComponent implements OnInit {

    AccessFlag = AccessFlag;

    stagesMenuItems: ExtendedMenuModel[] = []
    stageMenuExtended = false;
    stagesLoaded = false;

    category: string = 'main';
    incomingCount$ = this.api.getCountIncomingTasks().pipe(map(count => count.toString()), shareReplay(1));

    lastCatalogRoute$ = <Observable<string[]>> this.taskCatalogCache.lastRoute$
        .pipe(
            map(route=>TasksCatalogPageCacheService.convertToPath(route, true)),
            map(path => ['/tasks','catalog',...path])
        );

    constructor(readonly api: ApiService, readonly route: ActivatedRoute, readonly personality: PersonalityService,
                private taskCatalogCache: TasksCatalogPageCacheService) {

    }

    ngOnInit(): void {
        this.route.url.pipe(map(urlArray => urlArray.map(url => url.path))).subscribe(url => {

            this.category = url[0];
            if(!this.stagesLoaded)
                this.api.getWireframesNames().subscribe(wireframes => {
                    wireframes.forEach((wireframe: Wireframe) => {
                        const stageMenuLink = ['/tasks/stages', wireframe.wireframeId.toString()];
                        this.stagesMenuItems = [...this.stagesMenuItems, {
                            label: wireframe.name,
                            link: stageMenuLink,
                            extended: false
                        }];
                        if("/" + url.join("/") === stageMenuLink.join("/")) this.stageMenuExtended = true;
                    })
                    this.stagesLoaded = true;
                })

        })
    }

}
