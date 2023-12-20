import {Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {
    AbstractControl,
    ControlValueAccessor,
    FormArray,
    FormControl,
    FormGroup,
    NG_VALUE_ACCESSOR
} from "@angular/forms";
import {ClientEquipment, ClientEquipmentRealization, LoadingState} from "../../../../transport-interfaces";
import {ApiService} from "../../../../services/api.service";
import {
    BehaviorSubject,
    debounceTime,
    distinctUntilChanged,
    filter,
    first,
    fromEvent,
    map,
    merge, mergeMap,
    repeat,
    shareReplay,
    skipUntil,
    Subject,
    switchMap,
    takeUntil,
    tap
} from "rxjs";
import {SubscriptionsHolder} from "../../../../util";
import {OverlayPanel} from "primeng/overlaypanel";

@Component({
    selector: 'app-client-equipment-list-input',
    templateUrl: './client-equipment-list-input.component.html',
    styleUrls: ['./client-equipment-list-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ClientEquipmentListInputComponent),
            multi: true
        }
    ]
})
export class ClientEquipmentListInputComponent implements OnInit, OnDestroy, ControlValueAccessor {

    @ViewChild('overlayPanel') overlayPanel?: OverlayPanel;

    equipmentsList = new FormArray<FormGroup<{ equipment: FormControl<ClientEquipment | null>, count: FormControl<number | null> }>>([]);

    availableEquipmentsLoadingState = LoadingState.LOADING;

    queryFilterControl = new FormControl('');

    openAvailableEquipmentsView = new Subject<string | null>();

    openAvailableEquipmentsView$ = this.openAvailableEquipmentsView.pipe(
        tap(() => {
            this.availableEquipmentsLoadingState = LoadingState.LOADING;
            this.selectedAvailableEquipmentsIndex.next(-1);
        }),
    );
    closeAvailableEquipmentsView$ = new Subject();
    filterChange$ = this.queryFilterControl.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => this.availableEquipmentsLoadingState = LoadingState.LOADING),
    )

    equipments$ = merge(this.openAvailableEquipmentsView$, this.filterChange$).pipe(
        switchMap(() => this.api.getClientEquipments(this.queryFilterControl.value, false).pipe(
            map(response=>response.filter(eq=>this.equipmentsList.value.map(v=>v.equipment).every(exeq=>exeq?.clientEquipmentId!==eq.clientEquipmentId))),
        )),
        tap({
            next: (value) => this.availableEquipmentsLoadingState = value.length > 0 ? LoadingState.READY : LoadingState.EMPTY,
            error: () => this.availableEquipmentsLoadingState = LoadingState.ERROR
        }),
        shareReplay(1),
    )

    keysControl$ = fromEvent(document.body, 'keydown').pipe(
        skipUntil(this.openAvailableEquipmentsView$),
        filter(event => ['ArrowDown', 'ArrowUp', 'Enter'].includes((event as KeyboardEvent).key)),
        map((event) => {
            event.preventDefault();
            event.stopPropagation();
            return (event as KeyboardEvent).key;
        }),
        takeUntil(this.closeAvailableEquipmentsView$),
        repeat()
    );

    selectedAvailableEquipmentsIndex = new BehaviorSubject(-1);
    selectedAvailableEquipments$ = this.selectedAvailableEquipmentsIndex.pipe(
        switchMap(index => this.equipments$.pipe(map(equipments => {
            if (index === -2) return equipments.length - 1;
            if (index > equipments.length - 1) return -1;
            return Math.min(equipments.length - 1, Math.max(-1, index));
        }))),
        shareReplay(1)
    )
    selectAvailableEquipment = new Subject<number>();
    selectAvailableEquipment$ = this.selectAvailableEquipment.pipe(
        switchMap(index => this.equipments$.pipe(first(), map(equipments => {
            if (index === -1) return null;
            return equipments[index];
        }))),
        filter(equipment => equipment !== null),
        map(equipment => new FormGroup({equipment: new FormControl(equipment), count: new FormControl(1)})),
        tap(()=>this.overlayPanel?.hide())
    )

    subscriptions = new SubscriptionsHolder();

    constructor(private api: ApiService) {
    }

    onChange = (value: ClientEquipmentRealization[]) => {
    }
    onTouch = () => {
    }
    isDisabled = false;
    @Input() inputClasses: {[key:string]:boolean} = {};
    @Output() onBlur = new EventEmitter();

    ngOnInit(): void {
        this.subscriptions.addSubscription('kctrl',this.keysControl$
            .pipe(
                switchMap(key => {
                    return this.selectedAvailableEquipments$.pipe(first(), map(i => ({key, index: i})))
                }),
            )
            .subscribe(({key, index}) => {
                switch (key) {
                    case 'ArrowDown':
                        this.selectedAvailableEquipmentsIndex.next(index + 1);
                        break;
                    case 'ArrowUp':
                        this.selectedAvailableEquipmentsIndex.next(index - 1);
                        break;
                    case 'Enter':
                        this.selectAvailableEquipment.next(index)
                        break;
                }
            }))
        this.subscriptions.addSubscription('slctrl',this.selectAvailableEquipment$.subscribe((control:any) => this.equipmentsList.push(control)))
        this.subscriptions.addSubscription('chng', this.equipmentsList.valueChanges.subscribe(value => this.onChange(value as ClientEquipmentRealization[])))
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll()
    }

    registerOnChange(fn: any): void {
        this.onChange = fn
    }

    registerOnTouched(fn: any): void {
        this.onTouch = fn
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled = isDisabled
        if(isDisabled) {
            this.equipmentsList.disable({emitEvent: false});
        } else {
            this.equipmentsList.enable({emitEvent: false});
        }
    }

    writeValue(obj: ClientEquipmentRealization[]): void {
        if(obj === undefined || obj === null) {
            this.equipmentsList.clear();
            return;
        }
        for (let v of obj) {
            if(v.equipment === null || v.count === null) continue
            this.equipmentsList.push(new FormGroup({equipment: new FormControl(v.equipment), count: new FormControl(v.count)}))
        }
    }

}
