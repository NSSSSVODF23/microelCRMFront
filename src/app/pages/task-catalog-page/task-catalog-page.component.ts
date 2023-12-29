import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {map} from "rxjs";
import {TasksCatalogPageCacheService} from "../../services/tasks-catalog-page-cache.service";

@Component({
  templateUrl: './task-catalog-page.component.html',
  styleUrls: ['./task-catalog-page.component.scss']
})
export class TaskCatalogPageComponent implements OnInit {

  expandClass$ = this.route.url.pipe(map(url => url.join("/")))

  constructor(private route: ActivatedRoute, readonly cacheService: TasksCatalogPageCacheService) { }

  ngOnInit(): void {
  }

  expandClass(link: string) {
    return this.route.snapshot.url.join("/").includes(link) ? "mdi-expand_less" : "mdi-expand_more";
  }

}
