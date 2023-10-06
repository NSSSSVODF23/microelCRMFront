import {Component, Input, OnInit} from '@angular/core';
import {DhcpBinding} from "../../../transport-interfaces";
import {BehaviorSubject, debounceTime} from "rxjs";

@Component({
  selector: 'app-binding-connection-location-view',
  templateUrl: './binding-connection-location-view.component.html',
  styleUrls: ['./binding-connection-location-view.component.scss']
})
export class BindingConnectionLocationViewComponent implements OnInit {

  @Input() binding?: DhcpBinding;
  overlayVisibleChange = new BehaviorSubject(false);
  overlayVisible = this.overlayVisibleChange.pipe(
      debounceTime(200)
  );
  isLocationRefreshing = false;

  constructor() { }

  ngOnInit(): void {
  }

  refreshConnectionLocation(bindindId?: number) {

  }
}
