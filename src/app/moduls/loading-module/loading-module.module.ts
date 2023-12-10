import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoadingModuleRoutingModule } from './loading-module-routing.module';
import {PersonalityService} from "../../services/personality.service";


@NgModule({
  declarations: [],
  exports:[],
  imports: [
    CommonModule,
    LoadingModuleRoutingModule,
  ],
  providers:[PersonalityService]
})
export class LoadingModuleModule { }
