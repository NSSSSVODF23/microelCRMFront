import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from "./guards/auth.guard";

const routes: Routes = [
    {path: '', loadChildren: ()=> import('./moduls/main/main.module').then(m => m.MainModule), canActivate:[AuthGuard], canActivateChild:[AuthGuard]},
    {path: 'login', loadChildren: () => import('./moduls/login/login.module').then(m => m.LoginModule)},
    // {breadcrumb: "**", redirectTo: "", pathMatch: "full"},
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {})],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
