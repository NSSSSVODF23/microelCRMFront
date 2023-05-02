import {
    AfterViewInit,
    Component,
    ElementRef, EventEmitter,
    HostListener,
    Input,
    OnInit,
    Output,
    TemplateRef,
    ViewChild
} from '@angular/core';

@Component({
    selector: 'app-list-panel',
    templateUrl: './list-panel.component.html',
    styleUrls: ['./list-panel.component.scss']
})
export class ListPanelComponent implements OnInit, AfterViewInit {
    _items: any[] = [];
    @Input() set items(arr: any[]) {
        this._items = arr;
    }
    get items(): any[] {
        return this._items;
    }
    @Input() header: string = '';
    @Input() headerTemplate: TemplateRef<any>|null = null;
    @Input() itemTemplate: TemplateRef<any>|null = null;
    @ViewChild("headerItm") headerItm!: ElementRef<HTMLDivElement>;
    @ViewChild("contentItm") contentItm!: ElementRef<HTMLDivElement>;
    @Output() onScrollDown: EventEmitter<void> = new EventEmitter();

    constructor(private host: ElementRef) {
    }

    @HostListener('window:resize')
    onResize() {
        const hostElem = this.host.nativeElement;
        const parentElem = this.host.nativeElement.parentElement;
        const style = getComputedStyle(parentElem);

        // Get and parse float top and bottom sum of paddings from style
        const paddingTop = parseFloat(style.getPropertyValue('padding-top'));
        const paddingBottom = parseFloat(style.getPropertyValue('padding-bottom'));
        const padding = paddingTop + paddingBottom;

        hostElem.style.maxHeight = (parentElem.clientHeight-padding) + 'px';
    }

    ngOnInit(): void {

    }

    ngAfterViewInit(): void {
        setTimeout(()=> this.onResize())
        this.contentItm.nativeElement.onwheel = (event: Event)=>{
            const target = <HTMLDivElement> event.target;
            const scrollPos = target.offsetHeight + target.scrollTop;
            const delta = target.scrollHeight - scrollPos;
            if(delta === 0) this.onScrollDown.emit();
        }
    }
}
