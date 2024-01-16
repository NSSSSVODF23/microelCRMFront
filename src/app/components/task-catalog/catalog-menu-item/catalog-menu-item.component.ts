import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    TemplateRef,
    ViewChild
} from '@angular/core';
import {fromEvent, Observable, Subscription} from "rxjs";
import {Router} from "@angular/router";


@Component({
    selector: 'app-catalog-menu-item',
    templateUrl: './catalog-menu-item.component.html',
    styleUrls: ['./catalog-menu-item.component.scss']
})
export class CatalogMenuItemComponent implements OnInit, OnDestroy {

    @Input() expand = false;
    @Output() expandChange = new EventEmitter<boolean>(true);
    @Input() autoExpand = true;
    @Input() link: string = "";
    @Input() label: string = "";
    @Input() counter?: Observable<string>;
    @Input() isEmpty = true;
    @Input() contentTemplate?: TemplateRef<any>;
    @Input() contentTemplateData?: any;
    @Input() droppable?:string;
    @Input() isCounterLoading = false;
    @Output() onDrop = new EventEmitter<any>();
    @Output() onClick = new EventEmitter<any>();

    @ViewChild('dropEl') dropEl?: ElementRef;

    clearClassesOnDropSub?: Subscription;

    constructor(private router: Router) {
    }

    ngOnInit(): void {
        if(this.link && this.router.isActive(this.link, false) && this.autoExpand)
            this.setExpand(true);

        this.clearClassesOnDropSub = fromEvent(window, 'dragend').subscribe((event) => {
            if(this.dropEl && this.dropEl.nativeElement)
                this.dropEl.nativeElement.classList.remove('p-draggable-enter');
        });
    }

    ngOnDestroy(): void {
        this.clearClassesOnDropSub?.unsubscribe();
    }

    toggleExpand() {
        this.setExpand(!this.expand)
    }

    setExpand(value: boolean) {
        if(this.expand === value)
            return;
        this.expand = value;
        this.expandChange.emit(this.expand);
    }
}
