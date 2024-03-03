import {AfterViewInit, Component, ContentChild, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {MenuItem} from "primeng/api";
import {OnChange} from "../../../decorators";

export type ExtendedMenuModel = { label: string, link: string[], children?: ExtendedMenuModel[], nestingLevel?: number, extended: boolean };

@Component({
    selector: 'app-extended-menu-item',
    templateUrl: './extended-menu-item.component.html',
    styleUrls: ['./extended-menu-item.component.scss']
})
export class ExtendedMenuItemComponent implements OnInit, AfterViewInit {

    @ViewChild('titleElem') titleElem!: ElementRef<HTMLDivElement>;
    @ViewChild('wrapperElem') wrapperElem!: ElementRef<HTMLDivElement>;
    @ViewChild('childElem') childElem?: ContentChild;
    @Input() extendable = false;
    @Input() icon = '';
    @Input() caption: string = '';
    @Input() elements: ExtendedMenuModel[] = [];
    @Input() link?: string[];
    @Input() badge?: string;
    @Input() exact = false;
    @Input() onlyIcon = false;
    animationTimer?: any;

    constructor(readonly route: ActivatedRoute) {
    }

    _isExtended = false;
    contextOptions: MenuItem[] = [];

    @Input() set isExtended(value: boolean) {
        if (this.extendable) {
            this._isExtended = value;
            this.extending();
        }
    }

    @OnChange('link')
    linkChanged(link?: string[]) {
        if(link && link.length > 0)
            this.contextOptions = [
                {
                    label: 'Открыть в новой вкладке',
                    icon: 'mdi-open_in_new',
                    command: () => window.open(link.join("/"), '_blank')
                },
                {
                    label: 'Открыть в новом окне',
                    icon: 'mdi-web_asset',
                    command: () => window.open(link.join("/"), '_blank', 'popup')
                }
        ];
        else
            this.contextOptions = [];
    }

    ngAfterViewInit(): void {
        if (this.extendable)
            this.extending();
    }

    ngOnInit(): void {
        // this.route.url.pipe(map(url => url.map(u => u.breadcrumb))).subscribe(breadcrumb => {
        //     console.log(this.caption)
        //     setTimeout(() => {
        //         this.elements.forEach(elm => {
        //             if (elm.link[1].replace(/\W/g, '') === breadcrumb[1].replace(/\W/g, '')) {
        //                 this.isExtended = true;
        //             }
        //             this.extending();
        //         })
        //     }, 500);
        // })
    }

    toggle() {
        if (!this.hasChild()) return;
        this.isExtended = !this._isExtended;
    }

    hasChild() {
        return this.elements && this.elements.length > 0;
    }

    private extending() {
        if (!this.wrapperElem || !this.titleElem) return;
        if (this._isExtended) {
            this.wrapperElem.nativeElement.style.height = this.wrapperElem.nativeElement.scrollHeight + 'px';
            this.animationTimer = setTimeout(() => {
                if (this._isExtended) {
                    this.wrapperElem.nativeElement.style.height = 'auto';
                }
                this.animationTimer = undefined;
            }, 200)
        } else {
            if (this.animationTimer) clearTimeout(this.animationTimer);
            this.wrapperElem.nativeElement.style.height = this.wrapperElem.nativeElement.scrollHeight + 'px';
            setTimeout(() => {
                this.wrapperElem.nativeElement.style.height = this.titleElem.nativeElement.offsetHeight + 'px'
            })
        }
    }
}
