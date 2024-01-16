import {Component, OnDestroy, OnInit} from '@angular/core';
import {TasksCatalogPageCacheService} from "../../../services/tasks-catalog-page-cache.service";
import {SchedulingType} from "../../../types/transport-interfaces";

@Component({
    templateUrl: './task-catalog-page.component.html', styleUrls: ['./task-catalog-page.component.scss']
})
export class TaskCatalogPageComponent implements OnInit, OnDestroy {

    SchedulingType = SchedulingType;

    constructor(readonly cacheService: TasksCatalogPageCacheService) {
    }

    ngOnInit(): void {
    }

    ngOnDestroy() {
    }

}
