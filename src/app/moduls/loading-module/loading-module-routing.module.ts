import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // {path:'', component: ModuleLoadingBootstrapComponent, children:[
  //   {path:'', loadChildren: ()=>import('../main/main.module').then(m=>m.MainModule), canLoad:[MainGuard]},
  //   {path:'', loadChildren: ()=>import('../installers/installers.module').then(m=>m.InstallersModule), canLoad:[InstallerGuard]},
  // ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LoadingModuleRoutingModule { }
