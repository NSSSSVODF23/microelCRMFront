import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    HostBinding, OnDestroy,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import {ApiService} from "../../../services/api.service";
import {Address, City, Street} from "../../../transport-interfaces";
import {ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR} from "@angular/forms";
import {map, Subscription} from "rxjs";

type InputType =
    'city'
    | 'street'
    | 'houseNum'
    | 'fraction'
    | 'letter'
    | 'build'
    | 'entrance'
    | 'floor'
    | 'apartmentNum'
    | 'apartmentMod';

@Component({
    selector: 'app-address-input',
    templateUrl: './address-input.component.html',
    styleUrls: ['./address-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: AddressInputComponent,
            multi: true
        }
    ]
})
export class AddressInputComponent implements OnInit, ControlValueAccessor, OnDestroy {
    @HostBinding('attr.tabindex') tabIndex = '0';

    cities: City[] = [] as City[];
    streets: Street[] = [] as Street[];

    filteredCities: City[] = [] as City[];
    filteredStreets: Street[] = [] as Street[];

    selectedCityIndex = -1;
    selectedStreetIndex = -1;

    @ViewChild('cityEl') cityEl?: ElementRef<HTMLInputElement>;
    @ViewChild('streetEl') streetEl?: ElementRef<HTMLInputElement>;
    @ViewChild('houseNumEl') houseNumEl?: ElementRef<HTMLInputElement>;
    @ViewChild('fractionEl') fractionEl?: ElementRef<HTMLInputElement>;
    @ViewChild('letterEl') letterEl?: ElementRef<HTMLInputElement>;
    @ViewChild('buildEl') buildEl?: ElementRef<HTMLInputElement>;
    @ViewChild('entranceEl') entranceEl?: ElementRef<HTMLInputElement>;
    @ViewChild('floorEl') floorEl?: ElementRef<HTMLInputElement>;
    @ViewChild('apartmentNumEl') apartmentNumEl?: ElementRef<HTMLInputElement>;
    @ViewChild('apartmentModEl') apartmentModEl?: ElementRef<HTMLInputElement>;

    @ViewChild('cityListEl') cityListEl?: ElementRef<HTMLDivElement>;
    @ViewChild('streetListEl') streetListEl?: ElementRef<HTMLDivElement>;

    @Output() onBlur = new EventEmitter();

    inputs = [
        {name: 'city', ph: 'Город', defPh: 'Город', el: () => this.cityEl, oldValue: {}},
        {name: 'street', ph: 'Улица', defPh: 'Улица', el: () => this.streetEl, oldValue: {}},
        {name: 'houseNum', ph: 'Дом', defPh: 'Дом', el: () => this.houseNumEl, oldValue: '', limiter: this.houseNumLimiter.bind(this)},
        {name: 'fraction', ph: 'дробь', defPh: 'дробь', el: () => this.fractionEl, oldValue: '', limiter: this.fractionNumLimiter.bind(this)},
        {name: 'letter', ph: 'литера', defPh: 'литера', el: () => this.letterEl, oldValue: '', limiter: this.letterLimiter.bind(this)},
        {name: 'build', ph: 'стр.', defPh: 'стр.', el: () => this.buildEl, oldValue: '', limiter: this.buildNumLimiter.bind(this)},
        {name: 'entrance', ph: 'под.', defPh: 'под.', el: () => this.entranceEl, oldValue: '', limiter: this.entranceNumLimiter.bind(this)},
        {name: 'floor', ph: 'эт.', defPh: 'эт.', el: () => this.floorEl, oldValue: '', limiter: this.floorNumLimiter.bind(this)},
        {name: 'apartmentNum', ph: 'кв.', defPh: 'кв.', el: () => this.apartmentNumEl, oldValue: '', limiter: this.apartmentNumLimiter.bind(this)},
        {name: 'apartmentMod', ph: 'мод.', defPh: 'мод.', el: () => this.apartmentModEl, oldValue: ''}
    ]

    inputForm = new FormGroup({
        city: new FormControl({} as City),
        street: new FormControl({} as Street),
        houseNum: new FormControl(''),
        fraction: new FormControl(''),
        letter: new FormControl(''),
        build: new FormControl(''),
        entrance: new FormControl(''),
        floor: new FormControl(''),
        apartmentNum: new FormControl(''),
        apartmentMod: new FormControl('')
    })
    focus = false;
    isShowCityAC = false;
    isShowStreetAC = false;
    cityInputValue = '';
    cityOldValue = '';
    streetInputValue = '';
    streetOldValue = '';
    subscription?: Subscription;

    constructor(readonly api: ApiService) {
    }

    get cityPrepareValue() {
        return this.inputs.filter(input => input.name === 'city')[0].ph
    };

    set cityPrepareValue(value) {
        this.inputs.filter(input => input.name === 'city')[0].ph = value;
    }

    get streetPrepareValue() {
        return this.inputs.filter(input => input.name === 'street')[0].ph
    }

    set streetPrepareValue(value) {
        this.inputs.filter(input => input.name === 'street')[0].ph = value;
    }

    get houseNumPh() {
        return this.inputs.filter(input => input.name === 'houseNum')[0].ph
    }

    get fractionPh() {
        return this.inputs.filter(input => input.name === 'fraction')[0].ph
    }

    get letterPh() {
        return this.inputs.filter(input => input.name === 'letter')[0].ph
    }

    get buildPh() {
        return this.inputs.filter(input => input.name === 'build')[0].ph
    }

    get entrancePh() {
        return this.inputs.filter(input => input.name === 'entrance')[0].ph
    }

    get floorPh() {
        return this.inputs.filter(input => input.name === 'floor')[0].ph
    }

    get apartmentNumPh() {
        return this.inputs.filter(input => input.name === 'apartmentNum')[0].ph
    }

    get apartmentModPh() {
        return this.inputs.filter(input => input.name === 'apartmentMod')[0].ph
    }

    get isHouseSelected() {
        return this.inputForm.value.city?.cityId && this.inputForm.value.street?.streetId && this.inputForm.value.houseNum;
    }

    onChange = (value: Address) => {
    };

    onTouched = () => {
    };

    ngOnInit(): void {
        this.api.getCities().subscribe(cities => this.cities = cities);
        this.subscription = this.inputForm.valueChanges
            .pipe(map(
                (value) => {
                    return {
                        city: value.city?.cityId ? value.city: null,
                        street: value.street?.streetId ? value.street : null,
                        houseNum: value.houseNum ? parseInt(value.houseNum) : null,
                        fraction: value.fraction ? parseInt(value.fraction) : null,
                        letter: value.letter ? value.letter  : null,
                        build: value.build ? parseInt(value.build) : null,
                        entrance: value.entrance ? parseInt(value.entrance) : null,
                        floor: value.floor ? parseInt(value.floor) : null,
                        apartmentNum: value.apartmentNum ? parseInt(value.apartmentNum) : null,
                        apartmentMod: value.apartmentMod ? value.apartmentMod : null,
                    } as Address;
                }
            ))
            .subscribe((value) => {
                this.onChange(value);
            });
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    writeValue(obj: Address | null | undefined): void {
        if(obj) {
            this.inputForm.setValue(obj as any);
        }
    }

    focused(event: FocusEvent, type: InputType) {
        this.focus = true;
        const target = (event.target as HTMLInputElement);
        target.setSelectionRange(0, target.value.length);
        switch (type) {
            case 'city':
                break;
            case 'street':
                // this.isShowStreetAC = true;
                break;
            case "houseNum":
                break;
            case "fraction":
                break;
            case "letter":
                break;
            case "build":
                break;
            case "entrance":
                break;
            case "floor":
                break;
            case "apartmentNum":
                break;
            case "apartmentMod":
                break;
        }
        this.changeVisibilityOfAdditionalInputs(type);
    }

    blured(event: FocusEvent, type: InputType) {
        this.focus = false;
        this.isShowCityAC = false;
        this.isShowStreetAC = false;
        this.selectedCityIndex = -1;
        this.selectedStreetIndex = -1;


        switch (type) {
            case "city":
                if (!this.inputForm.value.city?.cityId && (this.cityInputValue || this.cityPrepareValue !== 'Город')) {
                    this.cityInputValue = '';
                    this.cityOldValue = '';
                    this.cityPrepareValue = 'Город';
                }
                break;
            case "street":
                if (!this.inputForm.value.street?.streetId && (this.streetInputValue || this.streetPrepareValue !== 'Улица')) {
                    this.streetInputValue = '';
                    this.streetOldValue = '';
                    this.streetPrepareValue = 'Улица';
                }
                break;
        }

        this.changeVisibilityOfAdditionalInputs(null, true)
        this.onTouched();
        this.onBlur.emit();
    }

    doInput(event: Event, type: InputType) {
        const target = (event.target as HTMLInputElement);
        switch (type) {
            case 'city':
                this.selectedCityIndex = -1;
                if (this.inputForm.value.city?.cityId) {
                    this.inputForm.controls.city.setValue({});
                    this.inputForm.controls.street.setValue({});
                }
                this.cityOldValue = target.value;
                if (target.value.length > 0) {
                    this.cityInputValue = target.value;
                    this.isShowCityAC = true;
                    this.filteredCities = this.cities.filter(city => city.name ? city.name.toLowerCase().includes(target.value.toLowerCase()) : false);
                } else {
                    this.isShowCityAC = false;
                    this.selectedCityIndex = -1;
                    this.cityPrepareValue = 'Город';
                }
                break;
            case 'street':
                this.selectedStreetIndex = -1;
                if (this.inputForm.value.street?.streetId) {
                    this.inputForm.controls.street.setValue({});
                }
                this.streetOldValue = target.value;
                if (target.value.length > 0) {
                    this.streetInputValue = target.value;
                    this.isShowStreetAC = true;
                    this.filteredStreets = this.streets.filter(street => street.name ? street.name.toLowerCase().includes(target.value.toLowerCase()) : false);
                } else {
                    this.isShowStreetAC = false;
                    this.selectedStreetIndex = -1;
                    this.streetPrepareValue = 'Улица';
                }
                break;
        }
        this.changeVisibilityOfAdditionalInputs(type);
    }

    changeVisibilityOfAdditionalInputs(focused: InputType | null, hide = false) {
        const values: any = this.inputForm.getRawValue();
        this.inputs.forEach((input, index) => {
            if (!hide) {
                const nextInputs = this.inputs.slice(index + 1);
                const hasNextValue = Object.entries(values)
                    .filter(([key, value]) => nextInputs.find(inp => inp.name === key))
                    .some(([key, value]) => value);
                if (hasNextValue && input.name !== focused && !values[input.name]) {
                    input.ph = '';
                } else {
                    input.ph = input.defPh;
                }
            } else {
                if (!input.el()?.nativeElement.value && input.name !== 'city' && input.name !== 'street') {
                    input.ph = '';
                }
            }
        })
    }

    keyDown(event: KeyboardEvent, type: InputType) {
        const target = (event.target as HTMLInputElement);
        switch (type) {
            case 'city':
                if(event.key === 'ArrowDown') {
                    if (!this.isShowCityAC) return;
                    this.selectedCityIndex++;
                    if (this.selectedCityIndex > this.filteredCities.length - 1) {
                        this.selectedCityIndex = -1;
                    }
                }else if(event.key === 'ArrowUp'){
                    if(!this.isShowCityAC) return;
                    this.selectedCityIndex--;
                    if (this.selectedCityIndex < -1) {
                        this.selectedCityIndex = this.filteredCities.length - 1;
                    }
                }
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    if (this.selectedCityIndex == -1) {
                        this.cityInputValue = this.cityOldValue;
                        setTimeout(() => {
                            target.setSelectionRange(this.cityInputValue.length, this.cityInputValue.length)
                        })
                    } else {
                        this.cityInputValue = '';
                        this.cityPrepareValue = this.filteredCities[this.selectedCityIndex].name ?? '';
                        if(this.cityListEl?.nativeElement){
                            this.cityListEl.nativeElement.children.item(this.selectedCityIndex)?.scrollIntoView({behavior: 'auto', block: 'nearest'});
                        }
                    }
                } else if (event.key === 'Enter') {
                    this.changeSelection(this.selectedCityIndex, type)
                }
                break;
            case 'street':
                if(event.key === 'ArrowDown'){
                    if (!this.isShowStreetAC) return;
                    this.selectedStreetIndex++;
                    if (this.selectedStreetIndex > this.filteredStreets.length - 1) {
                        this.selectedStreetIndex = -1;
                    }
                }else if(event.key === 'ArrowUp'){
                    if(!this.isShowStreetAC) return;
                    this.selectedStreetIndex--;
                    if (this.selectedStreetIndex < -1) {
                        this.selectedStreetIndex = this.filteredStreets.length - 1;
                    }
                }
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    if (this.selectedStreetIndex == -1) {
                        this.streetInputValue = this.streetOldValue;
                        setTimeout(() => {
                            target.setSelectionRange(this.streetInputValue.length, this.streetInputValue.length)
                        })
                    } else {
                        this.streetInputValue = '';
                        this.streetPrepareValue = this.filteredStreets[this.selectedStreetIndex].name ?? '';
                        if(this.streetListEl?.nativeElement){
                            this.streetListEl.nativeElement.children.item(this.selectedStreetIndex)?.scrollIntoView({behavior: 'auto', block: 'nearest'});
                        }
                    }
                } else if (event.key === 'Enter') {
                    this.changeSelection(this.selectedStreetIndex, type);
                }
                break;
        }

        if(event.key.length === 1){
            let resultValue = '';
            const selectStartPosition = target.selectionStart;
            const selectEndPosition = target.selectionEnd;
            if(selectStartPosition === null){
                return;
            }
            if(selectStartPosition === selectEndPosition){
                resultValue = target.value.slice(0, selectStartPosition) + event.key + target.value.slice(selectStartPosition);
            }else if(selectEndPosition){
                resultValue = target.value.slice(0, selectStartPosition) + event.key + target.value.slice(selectEndPosition);
            }
            const input = this.inputs.find(input => input.name === type);
            if(input && input.limiter && !input.limiter(resultValue)){
                event.preventDefault();
            }
        }

        const currentInputIndex = this.inputs.findIndex(input => input.name === type);
        const currentInput = this.inputs[currentInputIndex];
        let cursorPosition: 'first' | 'last' | 'between' | 'zero' = 'between';
        if (currentInput.el()?.nativeElement.value.length === 0) {
            cursorPosition = 'zero';
        } else if (currentInput.el()?.nativeElement.selectionStart === 0) {
            cursorPosition = 'first';
        } else if (currentInput.el()?.nativeElement.selectionStart === currentInput.el()?.nativeElement.value.length) {
            cursorPosition = 'last';
        }

        switch (event.key) {
            case 'ArrowRight':
                if (!(cursorPosition === 'last' || cursorPosition === 'zero')) break;
                const nextInput = this.inputs[currentInputIndex + 1];
                if (nextInput) {
                    nextInput.el()?.nativeElement.focus();
                } else {
                    const firstInput = this.inputs[0];
                    firstInput.el()?.nativeElement.focus();
                }
                break;
            case 'ArrowLeft':
                if (!(cursorPosition === 'first' || cursorPosition === 'zero')) break;
                const prevInput = this.inputs[currentInputIndex - 1];
                if (prevInput) {
                    event.preventDefault()
                    prevInput.el()?.nativeElement.focus();
                } else {
                    const lastInput = this.inputs[this.inputs.length - 1];
                    event.preventDefault()
                    lastInput.el()?.nativeElement.focus();
                }
                break;
        }
    }

    listItemMouseEnter(i: number, type: InputType) {
        switch (type) {
            case 'city':
                this.selectedCityIndex = i;
                this.cityInputValue = '';
                this.cityPrepareValue = this.filteredCities[i].name ?? '';
                break;
            case 'street':
                this.selectedStreetIndex = i;
                this.streetInputValue = '';
                this.streetPrepareValue = this.filteredStreets[i].name ?? '';
                break;
        }
    }

    private houseNumLimiter(value: any){
        return /^\d{0,4}$/.test(String(value));
    }

    private fractionNumLimiter(value: any){
        return /^\d{0,3}$/.test(String(value));
    }

    private letterLimiter(value: any){
        return /^[а-я]?$/.test(String(value));
    }

    private buildNumLimiter(value: any){
        return /^\d?$/.test(String(value));
    }

    private entranceNumLimiter(value: any){
        return /^\d{0,2}$/.test(String(value));
    }

    private floorNumLimiter(value: any){
        return /^\d{0,2}$/.test(String(value));
    }

    private apartmentNumLimiter(value: any){
        return /^\d{0,3}$/.test(String(value));
    }

    listItemMouseLeave(i: number, type: InputType) {
        switch (type) {
            case 'city':
                this.selectedCityIndex = -1;
                this.cityInputValue = this.cityOldValue;
                break;
            case 'street':
                this.selectedStreetIndex = -1;
                this.streetInputValue = this.streetOldValue;
                break;
        }
    }

    changeSelection(i: number, type: InputType) {
        switch (type) {
            case 'city':
                const targetCity = this.filteredCities[i];
                if(!targetCity?.cityId) return;
                this.api.getStreets(targetCity.cityId).subscribe(streets => this.streets = streets);
                this.inputForm.patchValue({
                    city: targetCity,
                    street: {},
                })
                this.streetInputValue = '';
                this.streetPrepareValue = 'Улица';
                this.streetOldValue = '';
                this.cityInputValue = targetCity.name ?? '';
                this.cityOldValue = targetCity.name ?? '';
                this.isShowCityAC = false;
                setTimeout(() => {
                    if (this.streetEl?.nativeElement) this.streetEl.nativeElement.focus();
                })
                break;
            case 'street':
                const targetStreet = this.filteredStreets[i];
                if(!targetStreet?.streetId) return;
                this.inputForm.controls.street.setValue(targetStreet);
                this.streetInputValue = targetStreet.name ?? '';
                this.cityOldValue = targetStreet.name ?? '';
                this.isShowStreetAC = false;
                setTimeout(() => {
                    if (this.houseNumEl?.nativeElement) this.houseNumEl.nativeElement.focus();
                })
                break;
        }
    }
}
