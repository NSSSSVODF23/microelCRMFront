import { Injectable } from '@angular/core';
import {Location} from "@angular/common";
import {Router} from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class CustomNavigationService {

  constructor(private location: Location, private router: Router) {

  }

  backOrDefault(defaultRoute: string[]){
    const navId: {navigationId: number} = this.location.getState() as any;
    if( navId.navigationId !== 1){
      this.location.back()
    }else{
      this.router.navigate(defaultRoute).then();
    }
  }
}
