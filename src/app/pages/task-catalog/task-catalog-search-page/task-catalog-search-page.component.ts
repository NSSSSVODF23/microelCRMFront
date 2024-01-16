import {Component, OnInit} from '@angular/core';
import {CustomNavigationService} from "../../../services/custom-navigation.service";
import {TasksCatalogSearchPageCacheService} from "../../../services/tasks-catalog-search-page-cache.service";
import {TasksCatalogPageCacheService} from "../../../services/tasks-catalog-page-cache.service";
import {map} from "rxjs";
import {OverlayPanel} from "primeng/overlaypanel";

@Component({
    selector: 'app-task-catalog-search-page',
    templateUrl: './task-catalog-search-page.component.html',
    styleUrls: ['./task-catalog-search-page.component.scss']
})
export class TaskCatalogSearchPageComponent implements OnInit {

    isSearchInputFocused = false;
    catalogCachedRoute$ = this.catalogService.lastRoute$
        .pipe(
            map(route => TasksCatalogPageCacheService.convertToPath(route, true)),
            map(path => ['/tasks', 'catalog', ...path])
        );
    allFiltersVisible = false;
    allFiltersPanelWidth: string = '';

    constructor(readonly nav: CustomNavigationService, readonly cacheService: TasksCatalogSearchPageCacheService, private catalogService: TasksCatalogPageCacheService) {
    }

    ngOnInit(): void {
    }

    resizeFilterPanel(size: string, panel: OverlayPanel) {
        this.allFiltersPanelWidth = size;
        setTimeout(() => {
            panel.align();
        })
    }
}
