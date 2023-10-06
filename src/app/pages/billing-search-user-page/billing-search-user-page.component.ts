import {Component, OnInit} from '@angular/core';
import {BillingUserSearchingService} from "../../services/billing-user-searching.service";
import {flowInChild} from "../../animations";

@Component({
    templateUrl: './billing-search-user-page.component.html',
    styleUrls: ['./billing-search-user-page.component.scss'],
    animations: [
        flowInChild
    ]
})
export class BillingSearchUserPageComponent implements OnInit {
    filterModeItems = [
        {label: "Адрес", value: "address"},
        {label: "Логин", value: "login"},
        {label: "ФИО", value: "fio"},
    ];

    constructor(readonly busService: BillingUserSearchingService) {
    }

    ngOnInit(): void {
    }

    pageChange(event: any) {
        this.busService.first = event.first;
        this.busService.page = this.busService.users.slice(event.first, event.first + event.rows);
    }

    clearSearchQuery() {
        this.busService.filtrationForm.patchValue({query: ''})
    }
}
