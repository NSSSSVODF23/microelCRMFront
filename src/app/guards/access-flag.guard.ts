import {inject, Injectable} from '@angular/core';
import {CanActivateFn, Router, UrlTree} from '@angular/router';
import {first, map, Observable} from 'rxjs';
import {PersonalityService} from "../services/personality.service";


@Injectable({
    providedIn: 'root'
})
export class AccessFlagGuard {

    constructor(private personality: PersonalityService, private router: Router) {
    }

    canActivate(...accessFlags: number[]): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.personality.userData$.pipe(
            first(),
            map(value => {
                return this.personality.isHasAccess(...accessFlags) ||  this.router.createUrlTree(['/']);
            })
        );
    }
}


export function accessCanActivate(...accessFlags: number[]): CanActivateFn {
    return (route, state) => {
        return inject(AccessFlagGuard).canActivate(...accessFlags);
    }
}
