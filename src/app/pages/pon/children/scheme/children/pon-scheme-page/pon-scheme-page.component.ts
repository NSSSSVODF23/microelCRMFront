import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {PonElements} from "../../../../../../pon/scheme/elements";
import {MenuItem, TreeNode} from "primeng/api";
import {AutoUnsubscribe, RouteParam} from "../../../../../../decorators";
import {
    combineLatest,
    debounceTime,
    distinctUntilChanged,
    filter,
    first,
    fromEvent,
    interval,
    lastValueFrom,
    map,
    merge,
    Observable,
    ReplaySubject,
    shareReplay,
    startWith,
    Subscription,
    switchMap
} from "rxjs";
import {Menubar} from "primeng/menubar";
import {ActivatedRoute} from "@angular/router";
import {CustomNavigationService} from "../../../../../../services/custom-navigation.service";
import {ApiService} from "../../../../../../services/api.service";
import {PonEditor} from "../../../../../../pon/scheme/editor";
import ToolMode = PonEditor.ToolMode;


@Component({
    templateUrl: './pon-scheme-page.component.html',
    styleUrls: ['./pon-scheme-page.component.scss']
})
@AutoUnsubscribe()
export class PonSchemePage implements OnInit, OnDestroy, AfterViewInit {

    @RouteParam() id = new ReplaySubject<number>(1);
    mode$: Observable<'view' | 'edit'> = this.route.queryParams
        .pipe(
            filter(params => !!params['mode']),
            map(params => params['mode']),
            distinctUntilChanged(),
            shareReplay(1)
        );
    isEditMode$: Observable<boolean> = this.mode$.pipe(map(mode => mode === 'edit'), shareReplay(1));
    scheme$ = this.id.pipe(switchMap(id => this.api.getPonScheme(id)), shareReplay(1));
    schemeName$ = combineLatest([this.mode$, this.scheme$]).pipe(map(([mode, scheme]) => {
        if (mode === 'edit') {
            return `Редактирование схемы ${scheme.name}`;
        } else {
            return `Просмотр схемы ${scheme.name}`;
        }
    }));

    stage?: PonEditor.Stage;
    menuBarOptions: MenuItem[] = [];
    updateMenuSub?: Subscription;

    objectsMenu: TreeNode[] = [
        {
            label: 'Оборудование',
            children: [
                {
                    label: 'Коммутатор',
                },
                {
                    label: 'Опт. терминал'
                }
            ]
        },
        {
            label: 'Коммутация',
            children: [
                {
                    label: 'Опт. ящик',
                    data: PonElements.Box
                },
                {
                    label: 'Опт. кросс'
                },
                {
                    label: 'Опт. муфта'
                }
            ]
        },
        {
            label: 'Кабель',
            data: PonElements.Cable,
        }
    ];
    selectedObject?: TreeNode;

    elemSub?: Subscription;

    @ViewChild('menubarElement') menubarElement?: Menubar;
    @ViewChild('sidebarElement') sidebarElement?: ElementRef<HTMLDivElement>;
    @ViewChild('mainViewElement') mainViewElement?: ElementRef<HTMLDivElement>;

    windowResize$ = merge(interval(1000), fromEvent(window, 'resize'))
        .pipe(
            startWith(null),
            debounceTime(100),
            map(() => {
                if (this.mainViewElement) {
                    const mainViewWidth = this.mainViewElement.nativeElement.offsetWidth;
                    const mainViewHeight = this.mainViewElement.nativeElement.offsetHeight;
                    return {width: mainViewWidth, height: mainViewHeight};
                }
                return {width: window.innerWidth - 200, height: window.innerHeight};
            })
        );

    constructor(private route: ActivatedRoute, readonly nav: CustomNavigationService, private api: ApiService) {
    }

    ngAfterViewInit(): void {
        this.stage = new PonEditor.Stage("container", this.windowResize$)
        this.elemSub = this.id.pipe(switchMap(id => this.api.getPonSchemeElements(id))).subscribe(elements => {
            this.stage?.loadNodes(elements);
        });
        // this.stage.appendElement(PonElements.Box.create(10, 10, 8));
        // this.stage.appendElement(PonElements.Box.create(410, 10, 24));
        this.updateMenuSub = this.stage.onChangeToolMode.pipe(startWith(null)).subscribe(this.menuConstructor.bind(this));
    }

    ngOnInit(): void {
    }

    ngOnDestroy() {
        this.stage?.destroy();
    }

    saveEditScheme() {
        const id$ = this.id.pipe(first());
        lastValueFrom(id$).then(id => {
            this.api.editPonScheme(id, this.stage?.getElementsData()).subscribe();
        })
    }

    private menuConstructor(mode: ToolMode | null) {
        this.menuBarOptions = [
            {
                label: "Переместить",
                command: () => {
                    this.stage?.setToolMode(ToolMode.Move);
                },
                styleClass: mode === ToolMode.Move ? 'active-button' : '',
            },
            {
                label: "Соединить",
                command: () => {
                    this.stage?.setToolMode(ToolMode.Connect);
                },
                styleClass: mode === ToolMode.Connect ? 'active-button' : '',
            },
            {
                label: "Сохранить",
                command: () => {
                    this.saveEditScheme();
                }
            }
        ]
    }
}
