import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {first, map, Observable, tap} from 'rxjs';
import {TasksCatalogPageCacheService} from "../services/tasks-catalog-page-cache.service";

@Injectable({
    providedIn: 'root'
})
export class CatalogRedirectGuard implements CanActivate {

    catalogCachedRoute$ = this.service.lastRoute$
        .pipe(
            map(route => ['/tasks', 'catalog', ...TasksCatalogPageCacheService.convertToPath(route, true)]),
        );

    constructor(private service: TasksCatalogPageCacheService, private router: Router) {
    }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        if (this.service.hasCachedRoute) {
            return this.catalogCachedRoute$
                .pipe(
                    map(path => {
                      if(path.join('/') === state.url) {
                          return true;
                      }
                      return this.router.createUrlTree(path)
                    })
                )
        } else {
            return true;
        }
    }

}
