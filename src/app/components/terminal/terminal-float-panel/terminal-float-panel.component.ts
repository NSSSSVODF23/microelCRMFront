import {Component, OnInit} from '@angular/core';
import {AutoUnsubscribe, FromEvent} from "../../../decorators";
import {debounceTime, filter, map, merge, Observable, ReplaySubject} from "rxjs";
import {TelnetTerminalsService} from "../../../services/telnet-terminals.service";

@Component({
    selector: 'app-terminal-float-panel',
    templateUrl: './terminal-float-panel.component.html',
    styleUrls: ['./terminal-float-panel.component.scss'],
})
@AutoUnsubscribe()
export class TerminalFloatPanelComponent implements OnInit {

    @FromEvent('wrapper-panel', 'mouseenter')
    panelMouseEnter$ = new ReplaySubject<MouseEvent>(1);
    @FromEvent('wrapper-panel', 'mouseleave')
    panelMouseLeave$ = new ReplaySubject<MouseEvent>(1);

    panelPosition: Partial<CSSStyleDeclaration> = {
        transform: 'translate(-50%, 75%)',
        opacity: '0.5'
    }

    private panelSub = merge(
        this.panelMouseEnter$.pipe(map(() => true)),
        merge(
            this.panelMouseEnter$.pipe(map(() => true)),
            this.panelMouseLeave$.pipe(map(() => false))
        ).pipe(debounceTime(1000), filter(isShow => !isShow))
    ).pipe().subscribe((isShow: boolean) => {
        if (isShow) {
            this.panelPosition.transform = 'translate(-50%, 0%)';
            this.panelPosition.opacity = '1';
        } else {
            this.panelPosition.transform = 'translate(-50%, 75%)';
            this.panelPosition.opacity = '0.5';
        }
    });

    constructor(readonly service: TelnetTerminalsService) {
    }

    ngOnInit(): void {
    }

}
