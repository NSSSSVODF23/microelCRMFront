import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {
    BehaviorSubject,
    debounceTime,
    delayWhen,
    distinctUntilChanged,
    filter,
    fromEvent,
    map,
    merge,
    mergeMap,
    of, retry,
    Subject,
    switchMap,
    tap
} from "rxjs";
import {AcpHouse, City, House, LoadingState, Place, Street} from "../../transport-interfaces";
import {ConfirmationService, MessageService} from "primeng/api";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {SubscriptionsHolder} from "../../util";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {swipe} from "../../animations";
import {YaEvent} from "angular8-yandex-maps";
import IMapOptions = ymaps.IMapOptions;

@Component({
    templateUrl: './addresses-list-page.component.html',
    styleUrls: ['./addresses-list-page.component.scss'],
    animations: [swipe]
})
export class AddressesListPageComponent implements OnInit, OnDestroy {

    cities = [] as City[];
    selectedCity?: City;
    streets = [] as Street[];
    selectedStreet?: Street;
    houses = [] as House[];
    selectedHouse?: House;

    streetFiltering = false;

    viewMode: 'city' | 'street' | 'house' | 'houseView' = 'city';
    loadingState = LoadingState.LOADING;

    filterControl = new FormControl('');
    filterChanged$ = this.filterControl.valueChanges.pipe(
        debounceTime(1000),
        distinctUntilChanged(),
    )
    cityEditingForm = new FormGroup({
        name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    });
    streetEditingForm = new FormGroup({
        prefix: new FormControl('', [Validators.required]),
        name: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(48)]),
        altNames: new FormControl([] as string[]),
        billingAlias: new FormControl(''),
    });
    houseEditingForm = new FormGroup({
        houseNum: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(999)]),
        letter: new FormControl<string | null>(null),
        fraction: new FormControl<number | null>(null),
        build: new FormControl<number | null>(null),
        isApartmentHouse: new FormControl<boolean>(false),
        acpHouseBind: new FormControl<AcpHouse|null>(null),
    });
    subscriptions = new SubscriptionsHolder();
    cityLoad$ = of(null).pipe(
        switchMap(() => this.api.getCities()),
        tap(cities => this.cities = cities),
        tap(() => {
            this.subscriptions.unsubscribe('cityCr')
            this.subscriptions.unsubscribe('cityUpd')
            this.subscriptions.unsubscribe('cityDel')
            this.subscriptions.unsubscribe('streetCr')
            this.subscriptions.unsubscribe('streetUpd')
            this.subscriptions.unsubscribe('streetDel')
            this.subscriptions.unsubscribe('houseCr')
            this.subscriptions.unsubscribe('houseUpd')
            this.subscriptions.unsubscribe('houseDel')
            this.subscriptions.addSubscription('cityCr', this.rt.cityCreated().subscribe((city) => {
                this.cities = [...this.cities, city];
            }))
            this.subscriptions.addSubscription('cityUpd', this.rt.cityUpdated().subscribe((city) => {
                this.cities = this.cities.map(c => c.cityId === city.cityId ? city : c);
                if (this.selectedCity?.cityId === city.cityId) {
                    this.selectCity(city)
                }
            }))
            this.subscriptions.addSubscription('cityDel', this.rt.cityDeleted().subscribe((city) => {
                this.cities = this.cities.filter(c => c.cityId !== city.cityId);
                if (this.selectedCity?.cityId === city.cityId) {
                    this.viewMode = 'city';
                }
            }))
            this.subscriptions.addSubscription('streetCr', this.rt.streetCreated().subscribe((street) => {
                if (street.city.cityId === this.selectedCity?.cityId)
                    this.streets = [...this.streets, street].sort(this.streetSort);
            }))
            this.subscriptions.addSubscription('streetUpd', this.rt.streetUpdated().subscribe((street) => {
                this.streets = this.streets.map(s => s.streetId === street.streetId ? street : s).sort(this.streetSort);
                if (this.selectedStreet?.streetId === street.streetId) {
                    this.selectStreet(street)
                }
            }))
            this.subscriptions.addSubscription('streetDel', this.rt.streetDeleted().subscribe((street) => {
                this.streets = this.streets.filter(s => s.streetId !== street.streetId);
                if (this.selectedStreet?.streetId === street.streetId) {
                    this.viewMode = 'street';
                }
            }))
            this.subscriptions.addSubscription('houseCr', this.rt.houseCreated().subscribe((house) => {
                if (house.streetId === this.selectedStreet?.streetId)
                    this.houses = [...this.houses, house].sort(this.houseSort);
            }))
            this.subscriptions.addSubscription('houseUpd', this.rt.houseUpdated().subscribe((house) => {
                this.houses = this.houses.map(h => h.houseId === house.houseId ? house : h).sort(this.houseSort);
                if (this.selectedHouse?.houseId === house.houseId) {
                    this.selectHouse(house)
                }
            }))
            this.subscriptions.addSubscription('houseDel', this.rt.houseDeleted().subscribe((house) => {
                this.houses = this.houses.filter(h => h.houseId !== house.houseId);
                if (this.selectedHouse?.houseId === house.houseId) {
                    this.viewMode = 'house';
                }
            }))
        })
    );
    streetPrefixes = [
        {label: 'Улица', value: 'ул'},
        {label: 'Аллея', value: 'аллея'},
        {label: 'Бульвар', value: 'б-р'},
        {label: 'Переулок', value: 'пер'},
        {label: 'Площадь', value: 'пл'},
        {label: 'Проезд', value: 'пр-д'},
        {label: 'Проспект', value: 'пр-кт'},
        {label: 'Шоссе', value: 'ш'},
    ];
    loadingStateHandler = {
        next: () => {
            this.loadingState = LoadingState.READY
        },
        error: () => {
            this.loadingState = LoadingState.ERROR
        }
    }

    createCityVisible = false;
    createCityForm = new FormGroup({
        name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    });

    createStreetVisible = false;
    createStreetForm = new FormGroup({
        prefix: new FormControl('', [Validators.required]),
        name: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(48)]),
        altNames: new FormControl([] as string[]),
        billingAlias: new FormControl(''),
    })

    createHouseVisible = false;
    createHouseForm = new FormGroup({
        houseNum: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(999)]),
        letter: new FormControl<string | null>(null, [Validators.maxLength(1)]),
        fraction: new FormControl<number | null>(null, [Validators.min(1), Validators.max(999)]),
        build: new FormControl<number | null>(null, [Validators.min(1), Validators.max(99)]),
    })

    beginRequest$ = new BehaviorSubject(false);

    houseNavigation$ = fromEvent<KeyboardEvent>(window, 'keyup')
        .pipe(
            filter((event) => (event.altKey && !!this.selectedHouse)),
            map((event) => {
                switch (event.key) {
                    case 'n':
                        return 1;
                    case 'b':
                        return -1;
                }
                return 0;
            })
        )
    manualHouseNavigation$ = new Subject<number>();
    animationEnd$ = new Subject();
    houseBeginningNavigate = false;
    requestStatusHandler = {
        next: () => {
            this.beginRequest$.next(false)
        },
        error: () => {
            this.beginRequest$.next(false)
        }
    }

    mapOptions: IMapOptions = {
        avoidFractionalZoom: true,
    };
    housePlace?: Place;

    centerOfMap = [47.519624, 42.206329];
    zoom = 12;

    updateCenterOfMap() {
        if(this.housePlace) {
            this.centerOfMap = [this.housePlace.latitude, this.housePlace.longitude];
            this.zoom = 17
            return;
        }
        this.centerOfMap = [47.519624, 42.206329];
        this.zoom = 12
    }

    private _houseViewAnimation = new BehaviorSubject([0, 0]);
    animationState$ = this._houseViewAnimation.pipe(
        switchMap(value => {
            return of(...value)
        }),
        map(value => {
            if (value > 0) {
                return 'right';
            }
            if (value < 0) {
                return 'left';
            }
            return 'default';
        }),
    )

    constructor(readonly api: ApiService, readonly rt: RealTimeUpdateService, readonly toast: MessageService, private confirmationService: ConfirmationService) {
    }

    trackByHouse(index: number, house: House) {
        return house.houseId + house.addressName;
    };

    trackByStreet(index: number, street: Street) {
        return street.streetId + street.nameWithPrefix;
    };

    trackByCity(index: number, city: City) {
        return city.cityId + city.name;
    };

    streetSort(a: Street, b: Street) {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    }

    houseSort(a: House, b: House) {
        return a.houseNum - b.houseNum || a.letter?.localeCompare(b.letter ?? "") || (a.fraction ?? 0) - (b.fraction ?? 0) || (a.build ?? 0) - (b.build ?? 0);
    }

    onMapClick(yaEvent: YaEvent) {
        const {target, event} = yaEvent;
        const [latitude, longitude] = event.get('coords');
        this.housePlace = {placeId: 0 ,latitude, longitude};
    }

    ngOnInit(): void {
        this.cityLoad$.subscribe(this.loadingStateHandler);
        this.subscriptions.addSubscription("hsnav", merge(this.houseNavigation$, this.manualHouseNavigation$.asObservable())
            .pipe(
                filter(() => !this.houseBeginningNavigate),
                tap(num => {
                    this.houseBeginningNavigate = true
                    this._houseViewAnimation.next([0, num])
                }),
                delayWhen(() => this.animationEnd$),
                tap(num => this._houseViewAnimation.next([num, -num])),
                delayWhen(() => this.animationEnd$),
                tap(num => {
                    if (num === -1) {
                        this.previousHouse();
                    } else if (num === 1) {
                        this.nextHouse();
                    }
                    this._houseViewAnimation.next([num, 0]);
                }),
                delayWhen(() => this.animationEnd$),
                retry()
            )
            .subscribe({
                next: (direction) => {
                    this.houseBeginningNavigate = false
                },
                error: () => {
                    this.houseBeginningNavigate = false
                },
            })
        );

        this.subscriptions.addSubscription("bgreq", this.beginRequest$.subscribe(
            (status) => {
                if (status) {
                    this.createCityForm.disable()
                    this.cityEditingForm.disable()
                    this.streetEditingForm.disable()
                    this.createStreetForm.disable()
                    this.houseEditingForm.disable()
                    this.createHouseForm.disable()
                } else {
                    this.createCityForm.enable()
                    this.cityEditingForm.enable()
                    this.streetEditingForm.enable()
                    this.createStreetForm.enable()
                    this.houseEditingForm.enable()
                    this.createHouseForm.enable()
                }
            }
        ));
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribeAll();
    }

    loadStreets$(id: number, value?: string | null) {
        return this.api.getStreets(id, value ?? undefined).pipe(
            tap(streets => this.streets = streets),
            tap(() => this.viewMode = 'street'),
            tap(() => this.streetFiltering = false)
        )
    }

    selectCity(city: City) {
        let {cityId} = city;
        if (!cityId) {
            this.toast.add({
                severity: 'error',
                summary: 'Ошибка выбора населенного пункта',
                detail: 'Идентификатор населенного пункта не указан'
            });
            return;
        }
        this.loadingState = LoadingState.LOADING;
        this.selectedCity = city;
        this.filterControl.reset();
        this.cityEditingForm.setValue({name: city.name});
        this.subscriptions.unsubscribe('cityLoad');
        this.subscriptions.addSubscription('cityLoad', merge(
            this.loadStreets$(cityId),
            this.filterChanged$.pipe(
                tap(() => this.streetFiltering = true),
                mergeMap((value) => this.loadStreets$(cityId, value))
            )
        ).subscribe(this.loadingStateHandler));
    }

    selectStreet(street: Street) {
        if (!street.streetId) {
            this.toast.add({
                severity: 'error',
                summary: 'Ошибка выбора улицы',
                detail: 'Идентификатор улицы не указан'
            });
            return;
        }
        this.loadingState = LoadingState.LOADING;
        this.selectedStreet = street;
        this.streetEditingForm.setValue({
            prefix: street.prefix ?? null,
            name: street.name ?? '',
            altNames: street.altNames ? street.altNames.split(',') : [] as string[],
            billingAlias: street.billingAlias ?? ''
        });
        this.api.getHouses(street.streetId).pipe(
            tap(houses => this.houses = houses.sort(this.houseSort)),
            tap(() => this.viewMode = 'house')
        ).subscribe(this.loadingStateHandler)
    }

    selectHouse(house: House) {
        this.viewMode = 'houseView';
        this.selectedHouse = house;
        if(house.place){
            this.housePlace = house.place;
            this.updateCenterOfMap()
        }else{
            this.housePlace = undefined;
            this.updateCenterOfMap()
        }
        this.houseEditingForm.setValue({
            houseNum: house.houseNum,
            letter: house.letter ?? null,
            fraction: house.fraction ?? null,
            build: house.build ?? null,
            isApartmentHouse: house.isApartmentHouse,
            acpHouseBind: house.acpHouseBind
        })
    }

    createCity() {
        this.beginRequest$.next(true);
        this.api.createCity(this.createCityForm.value).pipe(tap(this.requestStatusHandler)).subscribe(() => this.createCityVisible = false);
    }

    deleteCity() {
        this.confirmationService.confirm({
            header: 'Подтверждение',
            message: 'Вы действительно хотите удалить населенный пункт?',
            accept: () => {
                if (this.selectedCity) {
                    this.beginRequest$.next(true);
                    this.api.deleteCity(this.selectedCity.cityId).pipe(tap(this.requestStatusHandler)).subscribe(() => this.viewMode = 'city');
                } else {
                    this.toast.add({
                        severity: 'error',
                        summary: 'Ошибка',
                        detail: 'Выберите населённый пункт'
                    })
                }
            }
        })
    }

    saveCity() {
        this.confirmationService.confirm({
            header: 'Подтверждение',
            message: 'Вы действительно хотите сохранить изменения?',
            accept: () => {
                if (this.selectedCity) {
                    this.beginRequest$.next(true);
                    this.api.editCity(this.selectedCity.cityId, this.cityEditingForm.value).pipe(tap(this.requestStatusHandler)).subscribe();
                } else {
                    this.toast.add({
                        severity: 'error',
                        summary: 'Ошибка',
                        detail: 'Выберите населённый пункт'
                    })
                }
            }
        })
    }

    createStreet() {
        if (this.selectedCity) {
            this.beginRequest$.next(true);
            this.api.createStreet(this.selectedCity.cityId, this.createStreetForm.value).pipe(tap(this.requestStatusHandler)).subscribe(() => this.createStreetVisible = false);
        } else
            this.toast.add({
                severity: 'error',
                summary: 'Ошибка',
                detail: 'Выберите населенный пункт'
            })
    }

    deleteStreet() {
        this.confirmationService.confirm({
            header: 'Подтверждение',
            message: 'Вы действительно хотите удалить улицу?',
            accept: () => {
                if (this.selectedStreet?.streetId) {
                    this.beginRequest$.next(true);
                    this.api.deleteStreet(this.selectedStreet.streetId).pipe(tap(this.requestStatusHandler)).subscribe(() => this.viewMode = 'street');
                } else {
                    this.toast.add({
                        severity: 'error',
                        summary: 'Ошибка',
                        detail: 'Выберите улицу'
                    })
                }
            }
        })
    }

    saveStreet() {
        this.confirmationService.confirm({
            header: 'Подтверждение',
            message: 'Вы действительно хотите сохранить изменения?',
            accept: () => {
                if (this.selectedStreet?.streetId) {
                    this.beginRequest$.next(true);
                    this.api.editStreet(this.selectedStreet.streetId, this.streetEditingForm.value).pipe(tap(this.requestStatusHandler)).subscribe();
                } else {
                    this.toast.add({
                        severity: 'error',
                        summary: 'Ошибка',
                        detail: 'Выберите улицу'
                    })
                }
            }
        })
    }

    createHouse() {
        if (this.selectedStreet) {
            this.beginRequest$.next(true);
            this.api.createHouse(this.selectedStreet.streetId, this.createHouseForm.value).pipe(tap(this.requestStatusHandler)).subscribe(() => this.createHouseVisible = false);
        } else {
            this.toast.add({
                severity: 'error',
                summary: 'Ошибка',
                detail: 'Выберите улицу'
            })
        }
    }

    deleteHouse() {
        this.confirmationService.confirm({
            header: 'Подтверждение',
            message: 'Вы действительно хотите удалить дом?',
            accept: () => {
                if (this.selectedHouse?.houseId) {
                    this.beginRequest$.next(true);
                    this.api.deleteHouse(this.selectedHouse.houseId).pipe(tap(this.requestStatusHandler)).subscribe(() => this.viewMode = 'house');
                } else {
                    this.toast.add({
                        severity: 'error',
                        summary: 'Ошибка',
                        detail: 'Выберите дом'
                    })
                }
            }
        })
    }

    saveHouse() {
        this.confirmationService.confirm({
            header: 'Подтверждение',
            message: 'Вы действительно хотите сохранить изменения?',
            accept: () => {
                if (this.selectedHouse?.houseId) {
                    this.beginRequest$.next(true);
                    const form: any = this.houseEditingForm.value;
                    if(this.housePlace)
                        form.place = this.housePlace;
                    this.api.editHouse(this.selectedHouse.houseId, form).pipe(tap(this.requestStatusHandler)).subscribe();
                } else {
                    this.toast.add({
                        severity: 'error',
                        summary: 'Ошибка',
                        detail: 'Выберите дом'
                    })
                }
            }
        })
    }

    back() {
        if (this.viewMode === 'houseView') {
            this.viewMode = 'house';
            this.selectedHouse = undefined;
        } else if (this.viewMode === 'house') {
            this.viewMode = 'street'
            this.selectedStreet = undefined;
        } else if (this.viewMode === 'street') {
            this.viewMode = 'city'
            this.selectedCity = undefined;
        }
    }

    openDialogCreateHouse() {
        this.createHouseForm.reset();
        this.createHouseVisible = true;
    }

    openDialogCreateStreet() {
        this.createStreetForm.reset();
        this.createStreetVisible = true;
    }

    openDialogCreateCity() {
        this.createCityForm.reset();
        this.createCityVisible = true;
    }

    reload() {
        this.cities = [];
        this.streets = [];
        this.houses = [];
        this.selectedCity = undefined;
        this.selectedStreet = undefined;
        this.selectedHouse = undefined;
        this.viewMode = 'city';
        this.streetFiltering = false;
        this.loadingState = LoadingState.LOADING;
        this.filterControl.reset();
        this.cityLoad$.subscribe(this.loadingStateHandler);
    }

    houseNavigationHandler(direction: number) {
        if (direction === -1) {
            this.previousHouse();
        } else if (direction === 1) {
            this.nextHouse();
        }
    }

    previousHouse() {
        if (this.selectedHouse) {
            const currentIndex = this.houses.indexOf(this.selectedHouse);
            if (currentIndex > 0) {
                this.selectHouse(this.houses[currentIndex - 1]);
            } else {
                this.selectHouse(this.houses[this.houses.length - 1]);
            }
        }
    }

    nextHouse() {
        if (this.selectedHouse) {
            const currentIndex = this.houses.indexOf(this.selectedHouse);
            if (currentIndex < this.houses.length - 1) {
                this.selectHouse(this.houses[currentIndex + 1]);
            } else {
                this.selectHouse(this.houses[0]);
            }
        }
    }
}
