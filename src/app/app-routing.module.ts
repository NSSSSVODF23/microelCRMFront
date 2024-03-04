import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from "./guards/auth.guard";
import {Storage} from "./util";

export const routes: Routes = [
    {path:'', loadChildren: ()=> {
        if(Storage.loadOrDefault("isOffsite", false)){
            return import('./moduls/installers/installers.module').then(m=>m.InstallersModule)
        }else{
            return import('./moduls/main/main.module').then(m => m.MainModule)
        }
    }, canActivate:[AuthGuard], canActivateChild:[AuthGuard]},
    {path: 'login', loadChildren: () => import('./moduls/login/login.module').then(m => m.LoginModule)},
    // {breadcrumb: "**", redirectTo: "", pathMatch: "full"},
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {
        // scrollPositionRestoration: 'enabled',
    })],
    exports: [RouterModule],
})
export class AppRoutingModule {
}
