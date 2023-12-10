import {Component, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {ActivatedRoute} from "@angular/router";
import {filter, switchMap, tap} from "rxjs";
import {CustomNavigationService} from "../../services/custom-navigation.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
    templateUrl: './writing-report-page.component.html',
    styleUrls: ['./writing-report-page.component.scss']
})
export class WritingReportPageComponent implements OnInit {

    reportForm = new FormGroup({
        workLogId: new FormControl<number | null>(null, [Validators.required]),
        reportDescription: new FormControl("", [Validators.required])
    })
    reportSaving = false
    error = "";
    workLog$ = this.route.params.pipe(
        filter(params => !!params['workLogId']),
        switchMap(params => this.api.getWorkLog(params['workLogId'])),
        tap({
            next: (workLog) => {
                this.reportForm.setValue({
                    workLogId: workLog.workLogId,
                    reportDescription: ""
                });
            },
            error: (err) => {
                this.error = err.error.message
            },
        }),
    );

    constructor(private api: ApiService, private route: ActivatedRoute, readonly nav: CustomNavigationService) {
    }

    ngOnInit(): void {
    }

    saveReport() {
        this.reportSaving = true;
        this.api.saveReport(this.reportForm.value).subscribe({
            next: () => {
                this.reportSaving = false;
                this.nav.backOrDefault(["/"])
            },
            error: (err) => {
                this.reportSaving = false;
            }
        });
    }

}
