import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {SubscriptionsHolder} from "../../../util";
import {ActivatedRoute} from "@angular/router";
import {TasksCatalogPageCacheService} from "../../../services/tasks-catalog-page-cache.service";
import {combineLatest} from "rxjs";

@Component({
    templateUrl: './catalog-tasks-list-view.component.html', styleUrls: ['./catalog-tasks-list-view.component.scss']
})
export class CatalogTasksListViewComponent implements OnInit, AfterViewInit, OnDestroy {

    subscriptions = new SubscriptionsHolder();

    constructor(private route: ActivatedRoute, readonly cacheService: TasksCatalogPageCacheService) {
    }

    ngOnInit(): void {
        this.subscriptions.addSubscription('crrRt',
            combineLatest([this.route.params, this.route.data])
                .subscribe(([urlSegments, data]) => this.cacheService.updatePath(urlSegments, data))
        )
    }

    ngAfterViewInit() {
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribeAll();
    }
}
