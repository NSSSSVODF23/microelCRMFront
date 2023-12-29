import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-catalog-menu-item',
  templateUrl: './catalog-menu-item.component.html',
  styleUrls: ['./catalog-menu-item.component.scss']
})
export class CatalogMenuItemComponent implements OnInit {

  @Input() expand = false;
  @Output() expandChange = new EventEmitter<boolean>(true);
  @Input() link?: string;
  @Input() label?: string;
  @Input() counter?: number;

  constructor() { }

  ngOnInit(): void {
  }

}
