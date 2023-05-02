import {Injectable} from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    CanActivateChild,
    Router,
    RouterStateSnapshot,
    UrlTree
} from '@angular/router';
import {catchError, map, Observable, of} from 'rxjs';
import {ApiService} from '../services/api.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

    constructor(readonly api: ApiService, readonly router: Router) {
    }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.api.authCheckout().pipe(catchError((err, caught)=>{
            return of(this.router.createUrlTree(['/login']));
        }), map((value)=> {
            if (value instanceof UrlTree) return value; else return true;
        }));
    }

    canActivateChild(
        childRoute: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.api.authCheckout().pipe(catchError((err, caught)=>{
            return of(this.router.createUrlTree(['/login']));
        }), map((value)=> {
            if (value instanceof UrlTree) return value; else return true;
        }));
    }

}
