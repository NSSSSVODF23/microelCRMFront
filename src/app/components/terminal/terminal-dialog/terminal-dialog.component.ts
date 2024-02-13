import {AfterContentInit, Component, OnInit} from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {BehaviorSubject, delay, Observable, Subject, Subscription} from "rxjs";
import {TelnetConnectionCredentials} from "../../../types/transport-interfaces";
import {TelnetTerminalsService} from "../../../services/telnet-terminals.service";
import {AutoUnsubscribe} from "../../../decorators";

@Component({
    selector: 'app-terminal-dialog',
    templateUrl: './terminal-dialog.component.html',
    styleUrls: ['./terminal-dialog.component.scss'],
})
@AutoUnsubscribe()
export class TerminalDialogComponent implements OnInit, AfterContentInit {

    credentials?: TelnetConnectionCredentials;
    dataReceiver?: Observable<string>;

    constructor(public ref: DynamicDialogRef, public config: DynamicDialogConfig, readonly service: TelnetTerminalsService) {
    }

    ngOnInit(): void {
    }

    ngAfterContentInit(): void {
        setTimeout(()=>{
            this.credentials = this.config.data['credentials'] as TelnetConnectionCredentials;
            this.dataReceiver = this.config.data['dataReceiver'] as Observable<string>;
        },1)
    }

}
