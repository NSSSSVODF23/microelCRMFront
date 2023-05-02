import { Component, OnInit } from '@angular/core';
import {NotificationsService} from "../../../services/notifications.service";
import {flow, flowLeft} from "../../../animations";

@Component({
  selector: 'app-notifications-popup-panel',
  templateUrl: './notifications-popup-panel.component.html',
  styleUrls: ['./notifications-popup-panel.component.scss'],
  animations: [flowLeft]
})
export class NotificationsPopupPanelComponent implements OnInit {

  constructor(readonly notifyService: NotificationsService) { }

  ngOnInit(): void {
  }
}
