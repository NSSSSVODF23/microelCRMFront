import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {map, Observable} from 'rxjs';
import {TasksCatalogPageCacheService} from "../services/tasks-catalog-page-cache.service";

@Injectable({
    providedIn: 'root'
})
export class CatalogRedirectGuard implements CanActivate {

    isRedirecting = false;
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
                        if(state.url === '/tasks/catalog' && !this.isRedirecting) {
                            this.isRedirecting = true;
                            return this.router.createUrlTree(path);
                        }
                        this.isRedirecting  = false;
                        return true;
                        // if (path.join('/') !== state.url || this.isRedirecting) {
                        //     this.isRedirecting = false;
                        //     return true;
                        // }
                        // this.isRedirecting = true;
                        // return this.router.createUrlTree(path)
                    })
                )
        } else {
            if(state.url === '/tasks/catalog') {
                this.isRedirecting = true;
                return this.router.createUrlTree(['/tasks', 'catalog', 'active']);
            }
            this.isRedirecting = false;
            return true;
        }
    }

}
