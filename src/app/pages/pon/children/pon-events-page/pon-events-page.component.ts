import {Component, OnInit} from '@angular/core';
import {ApiService} from "../../../../services/api.service";
import {RealTimeUpdateService} from "../../../../services/real-time-update.service";
import {BehaviorSubject, combineLatest, debounceTime, filter, fromEvent, map, startWith, switchMap, tap} from "rxjs";
import {AutoUnsubscribe} from "../../../../decorators";
import {OntStatusChangeEvent} from "../../../../types/transport-interfaces";
import {fade, flowInChild, swipe, swipeChild} from "../../../../animations";

@Component({
    templateUrl: './pon-events-page.component.html',
    styleUrls: ['./pon-events-page.component.scss'],
    animations: [flowInChild]
})
@AutoUnsubscribe()
export class PonEventsPage implements OnInit {

    events: OntStatusChangeEvent[] = [];
    groupedEvents: { group: string, events: OntStatusChangeEvent[] }[] = [];

    isEventsLoading = true;
    totalEvents = 0;

    eventsLoader$ = new BehaviorSubject(0);

    scrollDownSub = fromEvent(window, 'scroll').pipe(
        debounceTime(200),
        startWith((document.body.scrollHeight - window.scrollY) - window.innerHeight),
        map(() => (document.body.scrollHeight - window.scrollY) - window.innerHeight),
        filter(scrollPos => scrollPos < 50 && this.events.length < this.totalEvents && !this.isEventsLoading),
        map(() => this.events.length),
        tap(console.log)
    ).subscribe(this.eventsLoader$)

    eventLoadingSub = combineLatest([this.eventsLoader$])
        .pipe(
            tap(() => this.isEventsLoading = true),
            switchMap(([offset]) => this.api.getOntStatusChangeEvents(offset, null, null))
        ).subscribe(page => {
            this.isEventsLoading = false;
            this.events = [...this.events, ...page.content];
            for (const event of page.content) {
                const groupedEvent = this.groupedEvents.find(ge => ge.group === event.groupId);
                if (groupedEvent) {
                    groupedEvent.events.push(event);
                } else {
                    this.groupedEvents.push({group: event.groupId, events: [event]})
                }
                this.groupedEvents = [...this.groupedEvents];
            }
            this.totalEvents = page.totalElements;
        })

    updateSub = this.rt.receiveNewOntStatusChangeEvents().subscribe(events => {
        this.events = [...events, ...this.events];
        this.totalEvents += events.length;
        for (const event of events) {
            const groupedEvent = this.groupedEvents.find(ge => ge.group === event.groupId);
            if (groupedEvent) {
                groupedEvent.events.push(event);
            } else {
                this.groupedEvents.unshift({group: event.groupId, events: [event]})
            }
            this.groupedEvents = [...this.groupedEvents];
        }
    })

    constructor(private api: ApiService, private rt: RealTimeUpdateService) {
    }

    ngOnInit(): void {
    }

    eventClass(event: OntStatusChangeEvent) {
        if(event.isOnline)
            return ['bg-green-50', 'text-green-500'];
        return ['bg-red-50', 'text-red-500'];
    }

    eventMessage(isOnline: boolean, count: number) {
        if(count === 1){
            if(isOnline) return 'Терминал онлайн';
            return 'Терминал офлайн';
        }
        if(isOnline) return count + ' x Терминалы онлайн';
        return  count + ' x Терминалы офлайн';
    }
}
