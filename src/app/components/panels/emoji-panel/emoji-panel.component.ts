import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {SubscriptionsHolder} from "../../../util";
import {fromEvent, map, tap} from "rxjs";

interface Emoji {
    name: string;
    code: string;
}

interface EmojiRange {
    start: number;
    end: number;
}

interface EmojiCategory {
    titleEmoji: string;
    name: string;
    emojiRanges: EmojiRange[];
}

@Component({
    selector: 'app-emoji-panel',
    templateUrl: './emoji-panel.component.html',
    styleUrls: ['./emoji-panel.component.scss']
})
export class EmojiPanelComponent implements OnInit, OnDestroy {

    activeCategory: number = 0;
    emojis = [] as Emoji[];
    categories: EmojiCategory[] = [
        {
            titleEmoji: String.fromCodePoint(0x1F600), name: 'Смайлы', emojiRanges: [
                {start: 0x1F600, end: 0x1F64F},
                {start: 0x2639, end: 0x263a},
                {start: 0x270a, end: 0x270d},
                {start: 0x1F440, end: 0x1F44F},
                {start: 0x1F466, end: 0x1F47F},
                {start: 0x1F910, end: 0x1F92F}
            ]
        }, {
            titleEmoji: String.fromCodePoint(0x1F436), name: 'Природа', emojiRanges: [
                {start: 0x1F400, end: 0x1F43F},
                {start: 0x1F300, end: 0x1F321},
                {start: 0x1F324, end: 0x1F32C},
                {start: 0x1F330, end: 0x1F344}
            ]
        }, {
            titleEmoji: String.fromCodePoint(0x1F32D), name: 'Еда', emojiRanges: [
                {start: 0x1F32D, end: 0x1F32F},
                {start: 0x1F345, end: 0x1F37F},
                {start: 0x1F950, end: 0x1F96F}
            ]
        }
    ];
    choosingEventEmitter = new EventEmitter<Emoji>();
    @Output() onChoosing = this.choosingEventEmitter.pipe(tap(()=>{
        this.showPanel = false;
    }),map(em=>em.code))
    showPanel = false;
    subscriptions = new SubscriptionsHolder();

    constructor() {
    }

    get activeEmojis(): Emoji[] {
        return this.categories[this.activeCategory].emojiRanges.map(range => {
            const tempEmojis = [];
            for (let i = range.start; i <= range.end; i++) {
                tempEmojis.push(this.fromCodePoint(i));
            }
            return tempEmojis;
        }).flat();
    }

    ngOnInit(): void {
        const windowScroll$ = fromEvent(document, 'scroll');
        this.subscriptions.addSubscription('wscr',windowScroll$.subscribe(() => {
            this.showPanel = false;
        }));
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribeAll();
    }

    fromCodePoint(...codePoint: number[]): Emoji {
        return {
            name: codePoint.map(p => p.toString(16)).join(),
            code: String.fromCodePoint(...codePoint)
        }
    }

    emojiTrack(index: number, emoji: Emoji): string {
        return emoji.name;
    }
}
