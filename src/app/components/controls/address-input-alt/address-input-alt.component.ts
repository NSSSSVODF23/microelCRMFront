import {Component, ElementRef, Inject, Injector, INJECTOR, Input, OnInit, ViewChild} from '@angular/core';
import {
    BehaviorSubject,
    combineLatest,
    debounceTime, delay,
    filter, first,
    lastValueFrom,
    map, merge, of, repeat, ReplaySubject,
    shareReplay, startWith,
    Subject,
    switchMap,
    takeWhile,
    tap
} from "rxjs";
import {ApiService} from "../../../services/api.service";
import {AcpHouse, Address, City, House, Street, StreetSuggestion} from "../../../types/transport-interfaces";
import {ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, NgControl, Validators} from "@angular/forms";
import {AutoComplete} from "primeng/autocomplete";
import {AutoUnsubscribe, OnChangeObservable} from "../../../decorators";
import {OverlayPanel} from "primeng/overlaypanel";
import {log} from "util";
import {ConfirmationService} from "primeng/api";
import {BlockUiService} from "../../../services/block-ui.service";

const houseNumRegexp = "^(?<houseNum>\\d{1,6})(\\/(?<fraction>\\d{1,3}))?(?<letter>[а-я]{1})?((_| ст?р?\\.?)(?<build>\\d{1,2}))?";
const apartmentRegexps = [
    "(( |-| кв.)(?<apartmentNum>\\d{1,3}))?( (п\\.?|под\\.?|подъезд) ?(?<entrance>\\d{1,3}))( (э\\.?|эт\\.?|этаж) ?(?<floor>\\d{1,3}))( \\((?<apartmentMod>[а-я]+)\\))?",
    "(( |-| кв.)(?<apartmentNum>\\d{1,3}))?( (э\\.?|эт\\.?|этаж) ?(?<floor>\\d{1,3}))( (п\.?|под\\.?|подъезд) ?(?<entrance>\\d{1,3}))( \\((?<apartmentMod>[а-я]+)\\))?",
    "(( |-| кв.)(?<apartmentNum>\\d{1,3}))?( (п\\.?|под\\.?|подъезд) ?(?<entrance>\\d{1,3}))( \\((?<apartmentMod>[а-я]+)\\))?",
    "(( |-| кв.)(?<apartmentNum>\\d{1,3}))?( (э\\.?|эт\\.?|этаж) ?(?<floor>\\d{1,3}))( \\((?<apartmentMod>[а-я]+)\\))?",
    "(( |-| кв.)(?<apartmentNum>\\d{1,3}))( \\((?<apartmentMod>[а-я]+)\\))?"
];

interface ParsedHouse {
    houseNum?: number;
    fraction?: number | null;
    letter?: string | null;
    build?: number | null;
    entrance?: number | null;
    floor?: number | null;
    apartmentNum?: number | null;
    apartmentMod?: string | null;
}

enum HouseErrorType {
    NotFound,
    NotApartment,
    NotParsed
}
interface HouseError {
    type: HouseErrorType,
    houseInput: string,
    houseId: number | null,
    foundAddresses: Address[] | null
}

function defaultAddress(street: StreetSuggestion) {
    return {
        city: {cityId: street.cityId},
        street: {streetId: street.streetId},
        houseNum: null,
        fraction: null,
        letter: null,
        build: null,
        entrance: null,
        floor: null,
        apartmentNum: null,
        apartmentMod: null
    } as Address
}

function isApartmentNotEquals(address: Address, parsedHouse: ParsedHouse) {
    const entEq = address.entrance == parsedHouse.entrance;
    const flEq = address.floor == parsedHouse.floor;
    const apartEq = address.apartmentNum == parsedHouse.apartmentNum;
    const apartModEq = address.apartmentMod == parsedHouse.apartmentMod;
    return !entEq || !flEq || !apartEq || !apartModEq;
}

function isHouseNumEquals(address: Address, parsedHouse: ParsedHouse) {
    return  address.houseNum == parsedHouse?.houseNum &&
    address.fraction == parsedHouse?.fraction &&
    address.letter == parsedHouse?.letter &&
    address.build == parsedHouse?.build
}

function parseHouse(query: string) {
    for (let apartRegexp of apartmentRegexps) {
        const regex = new RegExp(houseNumRegexp + apartRegexp);
        const matchFound: ParsedHouse | undefined = regex.exec(query)?.groups;
        if (matchFound) {
            return matchFound;
        }
    }
    const matchFound: ParsedHouse | undefined = new RegExp(houseNumRegexp).exec(query)?.groups;
    return matchFound;
}

@Component({
    selector: 'app-address-input-alt',
    templateUrl: './address-input-alt.component.html',
    styleUrls: ['./address-input-alt.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: AddressInputAltComponent,
            multi: true
        }
    ]
})
@AutoUnsubscribe()
export class AddressInputAltComponent implements OnInit, ControlValueAccessor {

    @Input() isAcpConnected: boolean | null = null;
    @Input() isHouseOnly: boolean = false;
    @Input() inputClasses: { [key: string]: boolean } = {};
    @OnChangeObservable('inputClasses') inputClassesChange = new ReplaySubject<{ [key: string]: boolean }>(1);

    @ViewChild('houseControl') houseControl!: ElementRef<HTMLInputElement>;
    @ViewChild('houseNotFoundPanel') houseNotFoundPanel!: OverlayPanel;
    @ViewChild('isApartmentHousePanel') isApartmentHousePanel!: OverlayPanel;

    selectedStreet: StreetSuggestion | null = null;
    selectedHouse: string = '';

    streetInputChange$ = new ReplaySubject<string>(1);
    streetSuggestions$ = this.streetInputChange$
        .pipe(
            switchMap(street => this.api.getStreetSuggestions(street)),
        )
    streetSelect$ = new ReplaySubject<StreetSuggestion | null>(1);

    focusHouseControlSub = this.streetSelect$
        .pipe(delay(100))
        .subscribe((street)=> {
            if(street){
                this.houseControl?.nativeElement.focus()
            }else{
                this.selectedStreet = null;
                this.selectedHouse = '';
            }
        })

    houseInputChange$ = new ReplaySubject<string>(1);
    isHouseControlFocused$ = new BehaviorSubject<boolean>(false);
    houseChangeDebounce$ = this.houseInputChange$.pipe(debounceTime(500));
    houseError$ = new ReplaySubject<HouseError | null>(1);
    houseInputClasses$ = combineLatest([this.inputClassesChange, this.houseError$])
        .pipe(
            map(([inputClasses, error]) => {
                return {...inputClasses, 'text-red-500': error !== null}
            }),
            startWith(this.inputClasses)
        )
    notFoundPanelSub = combineLatest([this.houseError$, this.isHouseControlFocused$])
        .pipe(
            debounceTime(100),
            tap(([error, focused]) => {
                if(error !== null) {
                    switch (error.type) {
                        case HouseErrorType.NotFound:
                            let resetValues = {
                                isApartmentHouse: false
                            }
                            let parsedHouseQuery = parseHouse(error.houseInput);
                            if(parsedHouseQuery) {
                                resetValues = {...parsedHouseQuery, isApartmentHouse: false}
                            }
                            this.createHouseForm.reset(resetValues);
                            break;
                    }
                }
            }),
        ).subscribe(([error, focus]) => {
            if (error && focus) {
                switch (error.type){
                    case HouseErrorType.NotFound:
                        this.houseNotFoundPanel.show(null, this.houseControl.nativeElement);
                        break;
                    case HouseErrorType.NotApartment:
                        this.isApartmentHousePanel.show(null, this.houseControl.nativeElement);
                        break;
                }
            } else {
                this.houseNotFoundPanel.hide();
                this.isApartmentHousePanel.hide();
            }
        });

    forcedAddress$ = new BehaviorSubject<Address | null>(null);

    address$ = new Subject<Address | null>();

    addressSub = this.address$.subscribe(address => {
        if(this.onChange)
            this.onChange(address)
    });

    inputAddressSub = combineLatest([this.streetSelect$, this.houseChangeDebounce$])
        .pipe(
            debounceTime(100),
            tap(() => {
                this.houseError$.next(null);
            }),
            switchMap(([selectedStreet, houseInput]) => {
                if (selectedStreet && houseInput) {
                    return this.api.getAddressSuggestionsAlt(selectedStreet.streetId, houseInput, this.isAcpConnected, this.isHouseOnly)
                        .pipe(
                            map(addresses => {

                                if (addresses.length === 0) {
                                    this.houseError$.next({
                                        type: HouseErrorType.NotFound,
                                        houseInput,
                                        houseId: null,
                                        foundAddresses: null
                                    });
                                    return defaultAddress(selectedStreet);

                                } else if (addresses.length === 1) {

                                    const parsedHouseInput = parseHouse(houseInput);
                                    if (!parsedHouseInput) {
                                        return defaultAddress(selectedStreet);
                                    }
                                    if (isApartmentNotEquals(addresses[0], parsedHouseInput)) {
                                        this.houseError$.next({
                                            type: HouseErrorType.NotApartment,
                                            houseInput,
                                            houseId: addresses[0].houseId ?? null,
                                            foundAddresses: addresses
                                        })
                                        return defaultAddress(selectedStreet);
                                    }
                                    return addresses[0]

                                } else {

                                    const parsedHouseInput = parseHouse(houseInput);
                                    if (!parsedHouseInput) {
                                        return defaultAddress(selectedStreet);
                                    }
                                    let foundAddress = addresses.find(address => {
                                        return isHouseNumEquals(address, parsedHouseInput);
                                    });

                                    if (foundAddress) {

                                        if (isApartmentNotEquals(foundAddress, parsedHouseInput)) {
                                            this.houseError$.next({
                                                type: HouseErrorType.NotApartment,
                                                houseInput,
                                                houseId: foundAddress.houseId ?? null,
                                                foundAddresses: addresses
                                            });
                                            return defaultAddress(selectedStreet);
                                        }
                                        return foundAddress

                                    } else {

                                        this.houseError$.next({
                                            type: HouseErrorType.NotFound,
                                            houseInput,
                                            houseId: null,
                                            foundAddresses: addresses
                                        });
                                        return defaultAddress(selectedStreet);

                                    }

                                }
                            })
                        )
                } else if (selectedStreet) {
                    return of(defaultAddress(selectedStreet))
                } else {
                    return of(null)
                }
            }),
        ).subscribe(this.address$);
    setAddressSub = this.forcedAddress$
        .pipe(
            tap(address => {
                this.houseError$.next(null);
                if(address && address.street && address.city){
                    console.log('Forced address', address);
                    this.selectedStreet = {
                        cityId: address.city.cityId,
                        streetId: address.street.streetId,
                        name: address.streetNamePart ?? "Плохо"
                    }
                    this.streetSelect$.next({
                        cityId: address.city.cityId,
                        streetId: address.street.streetId,
                        name: address.streetNamePart ?? "Плохо"
                    })
                    if(address.tailPart){
                        this.selectedHouse = address.tailPart;
                        this.houseInputChange$.next(address.tailPart);
                    }
                }
            })
        ).subscribe(this.address$);

    isDisabled = false;
    _ngControl?: NgControl;

    createHouseVisible = false;
    isHouseCreating = false;
    createHouseForm = new FormGroup({
        houseNum: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(999999)]),
        letter: new FormControl<string | null>(null, [Validators.maxLength(1)]),
        fraction: new FormControl<number | null>(null, [Validators.min(1), Validators.max(999)]),
        build: new FormControl<number | null>(null, [Validators.min(1), Validators.max(99)]),
        isApartmentHouse: new FormControl<boolean>(false),
        acpHouseBind: new FormControl<AcpHouse | null>(null),
    });
    createHouseResponseHandler = {
        next: (address: Address) => {
            this.createHouseVisible = false;
            this.isHouseCreating = false;
            this.houseInputChange$.next(this.selectedHouse);
        },
        error: () => {
            this.isHouseCreating = false;
        }
    }

    constructor(private api: ApiService, private confirmation: ConfirmationService, private blockService: BlockUiService) {
    }

    onChange = (value?: Address | null) => {
    };

    onTouched = () => {
    };

    writeValue(obj: any): void {
        this.forcedAddress$.next(obj);
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.isDisabled = isDisabled;
    }

    ngOnInit(): void {
    }

    showCreateHouseDialog() {

        // lastValueFrom(this.searchAddressChange$.pipe(first())).then(query => {
        //     const info: {houseNum?: string, fraction?: string, letter?: string, build?: string} | undefined = regex.exec(query)?.groups;
        //     if(info) {
        //         this.createHouseForm.setValue({
        //             houseNum: info.houseNum ? parseInt(info.houseNum) : null,
        //             letter: info.letter ?? null,
        //             fraction: info.fraction ? parseInt(info.fraction) : null,
        //             build: info.build ? parseInt(info.build) : null,
        //             isApartmentHouse: false,
        //             acpHouseBind: null,
        //         })
        //         return;
        //     }
        //     this.createHouseForm.setValue({
        //         houseNum: null,
        //         letter: null,
        //         fraction: null,
        //         build: null,
        //         isApartmentHouse: false,
        //         acpHouseBind: null,
        //     })
        // }).catch(()=>{
        //     this.createHouseForm.setValue({
        //         houseNum: null,
        //         letter: null,
        //         fraction: null,
        //         build: null,
        //         isApartmentHouse: false,
        //         acpHouseBind: null,
        //     })
        // })
        //
        this.createHouseVisible = true;
    }

    createHouse() {
        if (this.selectedStreet) {
            this.isHouseCreating = true;
            this.api.createHouse(this.selectedStreet.streetId, this.createHouseForm.value).subscribe(this.createHouseResponseHandler);
        }
    }

    confirmMakeTheHouseAnApartmentBuilding(error: HouseError) {
        this.confirmation.confirm({
            header: 'Подтвердите действие',
            message: 'Вы действительно хотите сделать дом многоквартирным?',
            accept: () => {
                if(!error.houseId) return;
                this.blockService.wait({message: 'Сохранение изменений...'})
                this.api.makeHouseAnApartmentsBuilding(error.houseId).subscribe({
                    next: () => {
                        this.blockService.unblock();
                        this.houseInputChange$.next(this.selectedHouse);
                    },
                    error: () => {
                        this.blockService.unblock();
                    }
                })
            }
        })
    }
}
