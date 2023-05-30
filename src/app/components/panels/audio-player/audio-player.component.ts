import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SubscriptionsHolder} from "../../../util";
import {fromEvent, repeat, skipUntil, takeUntil, tap} from "rxjs";
import {Overlay} from "primeng/overlay";

enum PlayerState {
    Paused = 'Paused',
    Playing = 'Playing',
    Loading = 'Loading',
    Error = 'Error'
}

@Component({
    selector: 'app-audio-player',
    templateUrl: './audio-player.component.html',
    styleUrls: ['./audio-player.component.scss']
})
export class AudioPlayerComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('player') player?: ElementRef<HTMLAudioElement>;
    @ViewChild('volumeOverlay') volumeOverlay?: ElementRef<HTMLDivElement>;
    @ViewChild('durationControl') durationControl?: ElementRef<HTMLDivElement>;
    @ViewChild('timeOverlay') timeOverlay?: Overlay;
    @Input() url?: string;
    playerState = PlayerState.Loading;
    currentTime = 0.0;
    totalTime = 0.0;
    subscriptions = new SubscriptionsHolder();
    showVolumeLevel = false;
    showTimeMarker = false;

    constructor() {
    }

    get markerPosition(): number {
        if (!this.totalTime) return 0;
        if (this.durationControl) {
            const element = this.durationControl.nativeElement;
            return (this.currentTime / this.totalTime) * element.clientWidth;
        }else{
            return 0;
        }
    }

    get totalMinutes(): string {
        return Math.floor(this.totalTime / 60).toString().padStart(2, '0');
    }

    get totalSeconds(): string {
        return Math.floor(this.totalTime % 60).toString().padStart(2, '0');
    }

    get currentMinutes(): string {
        return Math.floor(this.currentTime / 60).toString().padStart(2, '0');
    }

    get currentSeconds(): string {
        return Math.floor(this.currentTime % 60).toString().padStart(2, '0');
    }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        if (this.player) {
            const element = this.player.nativeElement;
            this.subscriptions.addSubscription("onLoad", fromEvent(element, 'loadeddata', {capture: true}).subscribe(() => {
                this.playerState = PlayerState.Paused;
            }));
            this.subscriptions.addSubscription("onPlay", fromEvent(element, 'play', {capture: true}).subscribe(() => {
                this.playerState = PlayerState.Playing;
            }));
            this.subscriptions.addSubscription("onPause", fromEvent(element, 'pause', {capture: true}).subscribe(() => {
                this.playerState = PlayerState.Paused;
            }));
            this.subscriptions.addSubscription("onAbort", fromEvent(element, 'abort', {capture: true}).subscribe(() => {
                this.playerState = PlayerState.Error;
            }));
            this.subscriptions.addSubscription("onError", fromEvent(element, 'error', {capture: true}).subscribe(() => {
                this.playerState = PlayerState.Error;
            }));
            this.subscriptions.addSubscription("onEmptied", fromEvent(element, 'emptied', {capture: true}).subscribe(() => {
                this.playerState = PlayerState.Error;
            }));
            this.subscriptions.addSubscription("onTimeupdate", fromEvent(element, 'timeupdate', {capture: true}).subscribe(() => {
                this.currentTime = element.currentTime;
            }));
            this.subscriptions.addSubscription("onDurationchange", fromEvent(element, 'durationchange', {capture: true}).subscribe(() => {
                this.totalTime = element.duration;
            }));
        }
        if (this.player && this.durationControl) {
            const playerElement = this.player.nativeElement;
            const element = this.durationControl.nativeElement;
            const move$ = fromEvent(document, 'mousemove');
            const down$ = fromEvent(element, 'mousedown').pipe(tap(() => {
                playerElement.pause()
                this.showTimeMarker = true;
            }));
            const up$ = fromEvent(document, 'mouseup').pipe(
                skipUntil(down$),
                tap(this.calculateTime.bind(this)),
                tap(()=>{this.playerState = PlayerState.Loading}),
                tap(this.changeTime.bind(this))
            );
            const mouseMoveSub = move$.pipe(
                skipUntil(down$),
                takeUntil(up$),
                repeat()
            ).subscribe(this.calculateTime.bind(this));
            this.subscriptions.addSubscription("mouseMove", mouseMoveSub);
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll();
    }

    calculateTime(event: Event) {
        if (this.player && this.durationControl) {
            const mouseEvent = event as MouseEvent;
            const element = this.durationControl.nativeElement;
            const playerElement = this.player.nativeElement;
            const x = mouseEvent.clientX - element.getBoundingClientRect().left;
            const width = element.clientWidth;
            let percent = x / width;
            if(percent < 0){
               percent = 0;
            }else if(percent > 1){
                percent = 1;
            }
            this.currentTime = percent * playerElement.duration;
            this.timeOverlay?.alignOverlay();
        }
    }

    changeTime(event: Event) {
        this.showTimeMarker = false;
        if (this.player) {
            const playerElement = this.player.nativeElement;
            playerElement.currentTime = this.currentTime;
            playerElement.play()
        }
    }

    playerButtonClick() {
        switch (this.playerState) {
            case PlayerState.Playing:
                this.player?.nativeElement.pause();
                break;
            case PlayerState.Paused:
                this.player?.nativeElement.play();
                break;
        }
    }

    changeVolume(event: any) {
        if (this.player) {
            this.player.nativeElement.volume = event.value;
        }
    }

    openVolumeOverlay() {
        this.showVolumeLevel = true;
    }
}
