import {Component, Input, OnInit} from '@angular/core';
import {DhcpBinding} from "../../../transport-interfaces";
import {BehaviorSubject, debounceTime, tap} from "rxjs";
import {ApiService} from "../../../services/api.service";

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

  constructor(private api: ApiService) { }

  ngOnInit(): void {
  }

  refreshConnectionLocation(vlan?: number) {
    if(vlan){
      this.isLocationRefreshing = true
      this.api.commutatorRemoteUpdateByVlan(vlan).subscribe({
        next: () => this.isLocationRefreshing = false,
        error: () => this.isLocationRefreshing = false
      })
    }
  }
}
