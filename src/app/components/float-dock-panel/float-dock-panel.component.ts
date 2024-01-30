import { Component, OnInit } from '@angular/core';
import {AfterWorkService} from "../../services/after-work.service";
import {first, lastValueFrom} from "rxjs";

@Component({
  selector: 'app-float-dock-panel',
  templateUrl: './float-dock-panel.component.html',
  styleUrls: ['./float-dock-panel.component.scss']
})
export class FloatDockPanelComponent implements OnInit {

  dockPanelHovered = false;

  constructor(readonly afterWorkService: AfterWorkService) { }

  ngOnInit(): void {
  }

  get isAfterWorkEmpty(){
    return this.afterWorkService.isEmpty;
  }

  get isAllEmpty(){
    return this.isAfterWorkEmpty;
  }

  dockPanelHover() {
    this.dockPanelHovered = true;
  }

  dockPanelUnhover() {
    this.dockPanelHovered = false;
  }

}
