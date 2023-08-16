import {AfterViewInit, Component, ElementRef, HostListener, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';

@Component({
    selector: 'app-lazy-endless-page-list',
    templateUrl: './lazy-endless-page-list.component.html',
    styleUrls: ['./lazy-endless-page-list.component.scss']
})
export class LazyEndlessPageListComponent implements OnInit, AfterViewInit {

    viewItems: string[] = [];
    averageItemHeight: number = 19.5;
    topScrollPosition: number = 0;
    viewportHeight: number = 0;
    bottomScrollPosition: number = 0;
    @Input() itemTemplate: TemplateRef<any> | null = null;
    @ViewChild('dynamicTopPlaceholder') dynamicTopPlaceholder?: ElementRef<HTMLDivElement>;
    @ViewChild('dynamicBottomPlaceholder') dynamicBottomPlaceholder?: ElementRef<HTMLDivElement>;
    @ViewChild('endlessWrapper') endlessWrapper?: ElementRef<HTMLDivElement>;

    constructor() {
    }

    _items: string[] = [];

    @Input() set items(items: string[]) {
        this._items = items;
        this.viewItems = items.slice(0, 100);
    }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        this.updateScrollValues()
    }

    @HostListener('window:scroll', ['$event'])
    onScroll(event: Event): void {
        this.updateScrollValues()
    }

    private updateScrollValues(): void {
        if (this.endlessWrapper && this.endlessWrapper.nativeElement.getBoundingClientRect().y > 0)
            this.topScrollPosition = window.scrollY - this.endlessWrapper.nativeElement.getBoundingClientRect().top;
        else
            this.topScrollPosition = window.scrollY;
        this.bottomScrollPosition = window.scrollY + window.innerHeight;
        this.viewportHeight = this.bottomScrollPosition - this.topScrollPosition;
    }

}
