import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from "@angular/forms";
import {SubscriptionsHolder} from "../../../util";
import {debounceTime, distinctUntilChanged, fromEvent, map, of, switchMap, tap} from "rxjs";
import {ApiService} from "../../../services/api.service";
import {Address} from "../../../transport-interfaces";
import {Overlay} from "primeng/overlay";

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
export class AddressInputComponent implements OnInit, ControlValueAccessor, AfterViewInit, OnDestroy {
    @ViewChild('inputEl') inputEl?: ElementRef<HTMLInputElement>;
    @ViewChild('overlay') overlay?: Overlay;
    @ViewChild('list') list?: ElementRef<HTMLDivElement>;
    value?: Address | null = null;
    subscriptions: SubscriptionsHolder = new SubscriptionsHolder();
    suggestions: Address[] = [];
    showSuggestions = false;
    isLoading = false;
    isEmpty = false;
    selectedSuggestion = -1;
    inputedValue = '';
    disabled = false;
    placeholder = 'Маркса 33 35 п1 э9';

    constructor(readonly api: ApiService) {
    }

    onChange = (value: Address | null) => {
    };

    onTouched = () => {
    };

    ngOnInit(): void {
    }

    scrollToActiveSuggestion() {
        setTimeout(() => {
            if (!this.list) return;
            const active = this.list.nativeElement.querySelector('.selected');
            if (active) {
                active.scrollIntoView({behavior: 'auto', block: 'nearest'});
            }
        })
    }

    ngAfterViewInit(): void {
        if (this.inputEl?.nativeElement) {
            const inputSub = fromEvent(this.inputEl.nativeElement, 'input')
                .pipe(
                    map(e => (e.target as HTMLInputElement).value),
                    debounceTime(1000),
                    distinctUntilChanged((a, b) => a === b),
                    tap((query) => {
                        this.value = null;
                        this.onChange(null);
                        this.inputedValue = query;
                        this.showSuggestions = query.length > 1;
                        this.isLoading = true
                        this.isEmpty = false
                        this.reAlignOverlay();
                    }),
                    switchMap(query => {
                        if (query.length < 2) return of([])
                        return this.api.getAddressSuggestions(query)
                    })
                )
                .subscribe(this.applySuggestion.bind(this));
            const kdownSub = fromEvent(this.inputEl.nativeElement, 'keydown')
                .pipe(
                    map(e => e as KeyboardEvent),
                    tap(e => {
                        const keys = ['ArrowDown', 'ArrowUp', 'Enter'];
                        if (keys.includes(e.key)) e.preventDefault();
                    }),
                    tap(e => {
                        const key = e.key;
                        if (key === 'ArrowDown') {
                            this.selectedSuggestion++;
                            if (this.selectedSuggestion >= this.suggestions.length) {
                                this.selectedSuggestion = -1
                            }
                            this.setAddressAsInputValue();
                            this.scrollToActiveSuggestion();
                            this.selectLastPosOfInputValue();
                        } else if (key === 'ArrowUp') {
                            this.selectedSuggestion--;
                            if (this.selectedSuggestion < -1) {
                                this.selectedSuggestion = this.suggestions.length - 1
                            }
                            this.setAddressAsInputValue();
                            this.scrollToActiveSuggestion();
                            this.selectLastPosOfInputValue();
                        } else if (key === 'Enter') {
                            this.selectSuggestion();
                        }
                    }),
                )
                .subscribe()
            this.subscriptions.addSubscription('inpChg', inputSub);
            this.subscriptions.addSubscription('kdown', kdownSub);
        }
    }

    selectSuggestion() {
        if (this.selectedSuggestion >= 0) {
            this.value = this.suggestions[this.selectedSuggestion];
            this.onChange(this.suggestions[this.selectedSuggestion]);
            this.setAddressAsInputValue();
            this.selectLastPosOfInputValue();
            this.showSuggestions = false;
            this.selectedSuggestion = -1;
        }
    }

    selectLastPosOfInputValue() {
        setTimeout(() => {
            if (!this.inputEl?.nativeElement) return;
            this.inputEl.nativeElement.scrollLeft = this.inputEl.nativeElement.scrollWidth;
        })
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribeAll()
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    writeValue(obj: Address | null): void {
        this.value = obj;
        this.setAddressAsInputValue();
    }

    private setAddressAsInputValue() {
        if (!this.inputEl?.nativeElement) return;
        if (this.value) {
            this.inputEl.nativeElement.value = this.value.addressName ?? '';
            return;
        }
        if (this.selectedSuggestion === -1) {
            this.inputEl.nativeElement.value = this.inputedValue;
            return;
        }
        this.inputEl.nativeElement.value = this.suggestions[this.selectedSuggestion].addressName ?? '';
    }

    private applySuggestion(suggestions: Address[]) {
        this.suggestions = suggestions;
        this.isLoading = false;
        if (suggestions.length === 0) {
            this.isEmpty = true;
        }
        this.reAlignOverlay()
    }

    private reAlignOverlay() {
        setTimeout(() => {
            this.overlay?.alignOverlay();
        })
    }
}
