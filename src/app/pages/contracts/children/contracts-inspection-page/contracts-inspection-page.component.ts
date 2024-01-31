import {Component, OnInit} from '@angular/core';
import {ApiService} from "../../../../services/api.service";
import {DynamicValueFactory} from "../../../../util";
import {of} from "rxjs";

@Component({
    templateUrl: './contracts-inspection-page.component.html',
    styleUrls: ['./contracts-inspection-page.component.scss']
})
export class ContractsInspectionPageComponent implements OnInit {

    workLogs$ = DynamicValueFactory.ofPageAltAll(of([0, {}]), this.api.getWorkLogsUnconfirmedContracts.bind(this.api));

    constructor(private api: ApiService) {
    }

    ngOnInit(): void {
    }

}
