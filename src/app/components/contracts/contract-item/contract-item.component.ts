import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TypesOfContracts} from "../../../types/transport-interfaces";

@Component({
  selector: 'app-contract-item',
  templateUrl: './contract-item.component.html',
  styleUrls: ['./contract-item.component.scss']
})
export class ContractItemComponent implements OnInit {

  @Input() typeContract?: TypesOfContracts;
  @Output() onEdit = new EventEmitter<{event: any, typeContract: TypesOfContracts}>();
  @Output() onDelete = new EventEmitter<{event: any, typeContract: TypesOfContracts}>();

  constructor() { }

  ngOnInit(): void {
  }

}
