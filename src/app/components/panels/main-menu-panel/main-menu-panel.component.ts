import { Component, OnInit } from '@angular/core';
import {ExtendedMenuModel} from "../../controls/extended-menu-item/extended-menu-item.component";

@Component({
  selector: 'app-main-menu-panel',
  templateUrl: './main-menu-panel.component.html',
  styleUrls: ['./main-menu-panel.component.scss']
})
export class MainMenuPanelComponent implements OnInit {
  tasksMenuItems: ExtendedMenuModel[] = [
    {
      label: 'Активные',
      link: '/tasks',
    },
    {
      label: 'Завершенные',
      link: '/tasks',
    },
    {
      label: 'Все',
      link: '/tasks',
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
