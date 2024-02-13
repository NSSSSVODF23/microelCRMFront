import {Injectable} from '@angular/core';
import {ApiService} from "./api.service";
import {RealTimeUpdateService} from "./real-time-update.service";
import {finalize, first, map, Observable, shareReplay, Subject, switchMap, takeUntil, tap} from "rxjs";
import {v4} from "uuid";
import {PersonalityService} from "./personality.service";
import {TelnetConnectionCredentials} from "../types/transport-interfaces";
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {TerminalDialogComponent} from "../components/terminal/terminal-dialog/terminal-dialog.component";

@Injectable({
    providedIn: 'root',
})
export class TelnetTerminalsService {

    sessions: TelnetConnectionCredentials[] = [];
    dataReceiversMap: Map<string, Observable<string>> = new Map();
    closeStreamSignalMap: Map<string, Subject<any>> = new Map();
    openTerminalDialogs: Map<string, DynamicDialogRef> = new Map();

    constructor(private api: ApiService, private rt: RealTimeUpdateService,
                private personality: PersonalityService, private dialogService: DialogService) {
        this.personality.userLogin$
            .pipe(
                switchMap(login => this.rt.telnetConnectionMessage(login))
            )
            .subscribe(
                credentials => this.appendSession(credentials)
            )
    }

    connect(name: string, ip: string) {
        this.api.connectToTelnetSession({ip, name, sessionId: v4(), lastState: 'ok'}).subscribe();
    }

    send(data: string, sessionId?: string) {
        if(!sessionId) return;
        const CURRENT_SESSION = this.sessions.find(s => s.sessionId === sessionId);
        if(!CURRENT_SESSION) return;
        if(CURRENT_SESSION.lastState != 'ok') return;
        if (data === '') {
            this.api.sendDataToTelnetSession(sessionId, '\b').subscribe();
            return;
        }
        this.api.sendDataToTelnetSession(sessionId, data).subscribe();
    }

    openTerminalDialog(credentials: TelnetConnectionCredentials) {
        const DATA_RECEIVER = this.dataReceiversMap.get(credentials.sessionId);
        if(!DATA_RECEIVER) return;
        this.openTerminal(credentials,  DATA_RECEIVER);
    }

    private openTerminal(credentials: TelnetConnectionCredentials, dataReceiver: Observable<string>){
        if(this.openTerminalDialogs.has(credentials.sessionId)) return;
        const REF = this.dialogService.open(
            TerminalDialogComponent,
            {
                header: credentials.name + '・' + credentials.ip,
                contentStyle: {padding: '0'},
                resizable: true,
                draggable: true,
                modal: false,
                data: {
                    credentials,
                    dataReceiver,
                }
            });
        REF.onClose
            .pipe(first(), finalize(()=>console.log('Closed', credentials)))
            .subscribe(()=>this.openTerminalDialogs.delete(credentials.sessionId))
        this.openTerminalDialogs.set(credentials.sessionId, REF);
    }

    private appendSession(credentials: TelnetConnectionCredentials) {
        const exist = this.sessions.some(cr => cr.sessionId === credentials.sessionId);
        if (exist) return;
        this.sessions.push(credentials);
        const CLOSE_SIGNAL = new Subject();
        const DATA_RECEIVER = this.rt.remoteTelnetConnection(credentials.ip, credentials.sessionId)
            .pipe(
                takeUntil(CLOSE_SIGNAL),
                map(r => {
                    credentials.lastState = r.state;
                    return r.data;
                }),
                finalize(()=>this.removeSession(credentials.sessionId)),
                shareReplay(50),
            );
        this.closeStreamSignalMap.set(credentials.sessionId, CLOSE_SIGNAL);
        this.dataReceiversMap.set(credentials.sessionId, DATA_RECEIVER);
        this.openTerminal(credentials, DATA_RECEIVER);
    }

    removeSession(sessionId: string) {
        this.sessions = this.sessions.filter(s => s.sessionId !== sessionId);
        this.closeStreamSignalMap.get(sessionId)?.next(null);
        this.closeStreamSignalMap.delete(sessionId);
        this.dataReceiversMap.delete(sessionId);
        this.openTerminalDialogs.get(sessionId)?.close();
    }

    isDialogOpen(sessionId: string){
        return this.openTerminalDialogs.has(sessionId);
    }

    private setupDialogHeader(sessionId: string) {
        if(!this.openTerminalDialogs.has(sessionId)) return;
        const REF = this.openTerminalDialogs.get(sessionId);
    }

}
