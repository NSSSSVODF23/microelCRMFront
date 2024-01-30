import {Injectable} from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    CanActivateChild,
    CanLoad,
    Route,
    RouterStateSnapshot,
    UrlSegment,
    UrlTree
} from '@angular/router';
import {Observable} from 'rxjs';
import {Storage} from "../util";

@Injectable({
    providedIn: 'root'
})
export class MainGuard implements CanActivate, CanActivateChild, CanLoad {

    constructor() {
    }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        // console.log(state)
        return !Storage.loadOrDefault('isOffsite', false);
        // return true;
    }

    canActivateChild(
        childRoute: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        // console.log(state)
        return !Storage.loadOrDefault('isOffsite', false);
        // return true;
    }

    canLoad(route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return !Storage.loadOrDefault('isOffsite', false);
    }

}
