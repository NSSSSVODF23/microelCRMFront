import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import {map, Observable, of, tap} from 'rxjs';
import {PersonalityService} from "./services/personality.service";
import {AuthGuard} from "./guards/auth.guard";

@Injectable({
  providedIn: 'root'
})
export class EmployeeResolverResolver implements Resolve<boolean> {
  constructor(private personalityService: PersonalityService, private router: Router) {
  }
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    //   return this.personalityService.userData.pipe(tap((value)=>{
    //     if(value.offsite){
    //       this.router.resetConfig([
    //         {path: '', loadChildren: () => import('./moduls/installers/installers.module').then(m => m.InstallersModule),
    //           canActivate:[AuthGuard], canActivateChild:[AuthGuard]},
    //         {path: 'login', loadChildren: () => import('./moduls/login/login.module').then(m => m.LoginModule)},
    //       ])
    //       // this.router.navigate(['/']).then();
    //     }else{
    //       this.router.resetConfig([
    //         {path: '', loadChildren: () => import('./moduls/main/main.module').then(m => m.MainModule),
    //           canActivate:[AuthGuard], canActivateChild:[AuthGuard]},
    //         {path: 'login', loadChildren: () => import('./moduls/login/login.module').then(m => m.LoginModule)},
    //       ])
    //       // this.router.navigate(['/']).then();
    //     }
    //   }),map(()=>true));
    // }
    return of(true);
  }
}
