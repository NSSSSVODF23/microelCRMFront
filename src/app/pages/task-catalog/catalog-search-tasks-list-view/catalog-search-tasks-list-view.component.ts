import {Component, OnDestroy, OnInit} from '@angular/core';
import {SubscriptionsHolder} from "../../../util";
import {ActivatedRoute} from "@angular/router";
import {TasksCatalogPageCacheService} from "../../../services/tasks-catalog-page-cache.service";
import {combineLatest} from "rxjs";
import {TasksCatalogSearchPageCacheService} from "../../../services/tasks-catalog-search-page-cache.service";

@Component({
    templateUrl: './catalog-search-tasks-list-view.component.html',
    styleUrls: ['./catalog-search-tasks-list-view.component.scss']
})
export class CatalogSearchTasksListViewComponent implements OnInit, OnDestroy {

    subscriptions = new SubscriptionsHolder();

    constructor(private route: ActivatedRoute, readonly cacheService: TasksCatalogSearchPageCacheService) {
    }

    ngOnInit(): void {
        this.subscriptions.addSubscription('crrRt',
            combineLatest([this.route.params])
                .subscribe(([urlSegments]) => this.cacheService.updatePath(urlSegments))
        )
    }

    ngAfterViewInit() {
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribeAll();
    }

}
