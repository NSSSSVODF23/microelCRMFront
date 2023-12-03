import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-dial-buttons-list',
  templateUrl: './dial-buttons-list.component.html',
  styleUrls: ['./dial-buttons-list.component.scss']
})
export class DialButtonsListComponent implements OnInit {

  @Input() phoneData?: { [id: string]: string };

  get phones(){
    return this.phoneData ? Object.values(this.phoneData) : [];
  }

  constructor() { }

  ngOnInit(): void {
  }

}
