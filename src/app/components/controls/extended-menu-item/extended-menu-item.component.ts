import {
    AfterContentInit,
    AfterViewInit,
    Component,
    ContentChild,
    ElementRef,
    Input,
    OnInit,
    ViewChild
} from '@angular/core';

export type ExtendedMenuModel = {label: string, link: string}

@Component({
    selector: 'app-extended-menu-item',
    templateUrl: './extended-menu-item.component.html',
    styleUrls: ['./extended-menu-item.component.scss']
})
export class ExtendedMenuItemComponent implements OnInit, AfterViewInit {

    @ViewChild('titleElem') titleElem?: ElementRef<HTMLDivElement>;
    @ViewChild('wrapperElem') wrapperElem?: ElementRef<HTMLDivElement>;
    @ViewChild('childElem') childElem?: ContentChild;
    extended = false;
    @Input() icon = '';
    @Input() caption: string = '';
    @Input() elements: ExtendedMenuModel[] = [];
    @Input() link?:any;

    constructor() {
    }

    ngAfterViewInit(): void {
        this.doExtend();
    }

    ngOnInit(): void {
    }

    toggle() {
        if(!this.hasChild()) return;
        this.extended = !this.extended;
        this.doExtend();
    }

    private doExtend() {
        if (!this.wrapperElem || !this.titleElem) return;
        if (this.extended) {
            this.wrapperElem.nativeElement.style.height = this.wrapperElem.nativeElement.scrollHeight + 'px';
        } else {
            this.wrapperElem.nativeElement.style.height = this.titleElem.nativeElement.offsetHeight + 'px';
        }
    }

    hasChild(){
        return this.elements && this.elements.length > 0;
    }
}
