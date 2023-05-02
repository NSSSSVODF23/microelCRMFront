import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ExtendedMenuModel} from "../extended-menu-item/extended-menu-item.component";
import {map} from "rxjs";

@Component({
    selector: 'app-sub-extended-menu-item',
    templateUrl: './sub-extended-menu-item.component.html',
    styleUrls: ['./sub-extended-menu-item.component.scss']
})
export class SubExtendedMenuItemComponent implements OnInit, AfterViewInit {

    @Input() caption: string = "";
    @Input() link?: string[];
    @Input() children?: ExtendedMenuModel[];
    @Input() nLevel?: number;
    @ViewChild('parentWrapper') parentWrapper!: ElementRef<HTMLDivElement>;
    @ViewChild('titleElement') titleElement!: ElementRef<HTMLDivElement>;
    // parentWrapperHeight: string = "auto";
    animationTimer: any;
    _isExtended = false;
    @Input() set isExtended(value: boolean) {
        this._isExtended = value;
        this.extending();
    }

    constructor(readonly route: ActivatedRoute) {
    }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        if (!this.hasElements()) return;
        this.extending();
    }

    toggleExtend() {
        if (!this.hasElements()) return;
        this.isExtended = !this._isExtended;
    }

    private extending() {
        if(!this.parentWrapper?.nativeElement) return;
        if (this._isExtended) {
            this.parentWrapper.nativeElement.style.height = this.parentWrapper.nativeElement.scrollHeight + 'px';
            this.animationTimer = setTimeout(() => {
                if (this._isExtended) this.parentWrapper.nativeElement.style.height = 'auto';
                this.animationTimer = undefined;
            }, 200)
        } else {
            if (this.animationTimer) clearTimeout(this.animationTimer);
            this.parentWrapper.nativeElement.style.height = this.parentWrapper.nativeElement.scrollHeight + 'px';
            setTimeout(() => {
                this.parentWrapper.nativeElement.style.height = this.titleElement.nativeElement.offsetHeight + 'px'
            });
        }
    }

    private hasElements() {
        return this.parentWrapper && this.titleElement;
    }
}
