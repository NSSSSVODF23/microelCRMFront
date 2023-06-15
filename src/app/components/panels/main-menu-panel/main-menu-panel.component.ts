import {Component, OnInit} from '@angular/core';
import {ExtendedMenuModel} from "../../controls/extended-menu-item/extended-menu-item.component";
import {ApiService} from "../../../services/api.service";
import {ActivatedRoute} from "@angular/router";
import {map} from "rxjs";
import {Wireframe} from "../../../transport-interfaces";

@Component({
    selector: 'app-main-menu-panel',
    templateUrl: './main-menu-panel.component.html',
    styleUrls: ['./main-menu-panel.component.scss']
})
export class MainMenuPanelComponent implements OnInit {
    stagesMenuItems: ExtendedMenuModel[] = []
    stageMenuExtended = false;
    stagesLoaded = false;

    category: string = 'main';
    incomingCount$ = this.api.getCountIncomingTasks().pipe(map(count => count.toString()));

    constructor(readonly api: ApiService, readonly route: ActivatedRoute) {

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
