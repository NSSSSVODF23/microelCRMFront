import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild, CanLoad, Route,
  Router,
  RouterStateSnapshot, UrlSegment,
  UrlTree
} from '@angular/router';
import {map, Observable, tap} from 'rxjs';
import {PersonalityService} from "../services/personality.service";
import {AuthGuard} from "./auth.guard";
import {Storage} from "../util";

@Injectable({
  providedIn: 'root'
})
export class InstallerGuard implements CanActivate, CanActivateChild, CanLoad {

  personality$ = this.personality.userData.pipe(map((employee)=>employee.offsite??false));

  constructor(private personality:PersonalityService, private router: Router) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // console.log(state)
    return Storage.loadOrDefault('isOffsite', false);
    // return true;
  }
  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // console.log(state)
    return Storage.loadOrDefault('isOffsite', false);
    // return true;
  }

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return Storage.loadOrDefault('isOffsite', false);
  }

}
