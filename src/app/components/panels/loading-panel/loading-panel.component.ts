import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';

@Component({
    selector: 'app-loading-panel',
    templateUrl: './loading-panel.component.html',
    styleUrls: ['./loading-panel.component.scss']
})
export class LoadingPanelComponent implements OnInit, AfterViewInit {
    @Input() parentElement?: HTMLElement;
    @Input() position = 'bottom';
    @ViewChild("loaderWrapper") wrapper!: ElementRef<HTMLDivElement>;

    constructor() {
    }

    _isShow = false;

    get isShow(): boolean {
        return this._isShow;
    }

    @Input() set isShow(val: boolean) {
        this._isShow = val;
        setTimeout(() => {
            if (!this.parentElement || !this._isShow) return;
            let {width, height, top, left, x, y, right, bottom} = this.parentElement.getBoundingClientRect();
            this.wrapper.nativeElement.style.width = width + "px";
            this.wrapper.nativeElement.style.left = x + "px";
            this.wrapper.nativeElement.style.bottom = '0';
        })
    }

    ngOnInit(): void {

    }

    ngAfterViewInit(): void {

    }

}
