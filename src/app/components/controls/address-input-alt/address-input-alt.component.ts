import {Component, Inject, Injector, INJECTOR, Input, OnInit, ViewChild} from '@angular/core';
import {
    combineLatest,
    debounceTime,
    filter, first,
    lastValueFrom,
    map,
    shareReplay,
    Subject,
    switchMap,
    takeWhile,
    tap
} from "rxjs";
import {ApiService} from "../../../services/api.service";
import {AcpHouse, Address, House, StreetSuggestion} from "../../../types/transport-interfaces";
import {ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, NgControl, Validators} from "@angular/forms";
import {AutoComplete} from "primeng/autocomplete";

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
export class AddressInputAltComponent implements OnInit, ControlValueAccessor {

    @Input() isAcpConnected: boolean | null = null;
    @Input() isHouseOnly: boolean = false;
    @Input() inputClasses: {[key:string]:boolean} = {};

    @ViewChild('houseControl') houseControl!: AutoComplete;

    searchStreetSubject = new Subject<string>();
    searchStreetChange$ = this.searchStreetSubject.pipe(debounceTime(500));
    streetSuggestions$ = this.searchStreetChange$.pipe(switchMap(query => this.api.getStreetSuggestions(query)));
    selectedStreet: StreetSuggestion | null = null;

    searchAddressSubject = new Subject<string>();
    searchAddressChange$ = this.searchAddressSubject.pipe(debounceTime(500), shareReplay(1));
    addressSuggestions$ = this.searchAddressChange$
        .pipe(
            takeWhile(() => !!this.selectedStreet),
            switchMap(query => this.api.getAddressSuggestionsAlt(this.selectedStreet!.streetId, query, this.isAcpConnected, this.isHouseOnly))
        );
    isEmptyAddressSuggestions$ = combineLatest([this.addressSuggestions$, this.searchAddressChange$])
        .pipe(
            map(([res, query]) => res.length === 0 && query.length > 0 && !this.selectedAddress),
        );
    selectedAddress?: Address | null = null;
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
        acpHouseBind: new FormControl<AcpHouse|null>(null),
    });

    constructor(private api: ApiService) {
    }
    onChange = (value?: Address | null) => {
    };
    onTouched = () => {
    };

    writeValue(obj: any): void {
        if (obj && 'city' in obj && 'street' in obj && 'houseNum' in obj) {
            this.selectedAddress = obj;
            this.selectedStreet = {streetId: obj.street.streetId, name: obj.streetNamePart, cityId: obj.city.cityId};
            return;
        }
        this.selectedStreet = null;
        this.selectedAddress = null;
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

    streetSearch(query: string) {
        this.searchStreetSubject.next(query);
    }

    addressSearch(query: string) {
        this.searchAddressSubject.next(query);
    }

    streetChange() {
        this.selectedAddress = null;
        this.onChange(null);
    }

    focusHouseControl() {
        return new Promise<AutoComplete>(resolve => {
            setTimeout(() => {
                this.houseControl.focusInput();
                resolve(this.houseControl);
            })
        })
    }

    showCreateHouseDialog(){
        const regex = /^(?<houseNum>\d{1,6})(\/(?<fraction>\d{1,3}))?(?<letter>[а-я]{1})?((_| ст?р?\.?)(?<build>\d{1,2}))?/;
        lastValueFrom(this.searchAddressChange$.pipe(first())).then(query => {
            const info: {houseNum?: string, fraction?: string, letter?: string, build?: string} | undefined = regex.exec(query)?.groups;
            if(info) {
                this.createHouseForm.setValue({
                    houseNum: info.houseNum ? parseInt(info.houseNum) : null,
                    letter: info.letter ?? null,
                    fraction: info.fraction ? parseInt(info.fraction) : null,
                    build: info.build ? parseInt(info.build) : null,
                    isApartmentHouse: false,
                    acpHouseBind: null,
                })
                return;
            }
            this.createHouseForm.setValue({
                houseNum: null,
                letter: null,
                fraction: null,
                build: null,
                isApartmentHouse: false,
                acpHouseBind: null,
            })
        }).catch(()=>{
            this.createHouseForm.setValue({
                houseNum: null,
                letter: null,
                fraction: null,
                build: null,
                isApartmentHouse: false,
                acpHouseBind: null,
            })
        })

        this.createHouseVisible = true;
    }

    createHouseResponseHandler = {
        next: (address: Address) => {
            this.createHouseVisible = false;
            this.isHouseCreating = false;
            this.searchAddressSubject.next('');
            this.selectedAddress = address;
        },
        error: () => {
            this.isHouseCreating = false;
        }
    }

    createHouse() {
        if (this.selectedStreet) {
            this.isHouseCreating = true;
            this.api.createHouse(this.selectedStreet.streetId, this.createHouseForm.value).subscribe(this.createHouseResponseHandler);
        }
    }
}
