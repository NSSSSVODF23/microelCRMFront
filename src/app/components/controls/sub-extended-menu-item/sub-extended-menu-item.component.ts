import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-sub-extended-menu-item',
  templateUrl: './sub-extended-menu-item.component.html',
  styleUrls: ['./sub-extended-menu-item.component.scss']
})
export class SubExtendedMenuItemComponent implements OnInit {

  @Input() caption: string = "";
  @Input() link: any;

  constructor() { }

  ngOnInit(): void {
  }

}
