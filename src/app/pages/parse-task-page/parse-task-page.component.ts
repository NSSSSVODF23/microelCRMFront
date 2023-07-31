import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {AddressCorrecting, OldTracker, SimpleMessage} from "../../parsing-interfaces";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {SubscriptionsHolder} from "../../util";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {VirtualScroller} from "primeng/virtualscroller";
import {Address} from "../../transport-interfaces";

@Component({
    templateUrl: './parse-task-page.component.html',
    styleUrls: ['./parse-task-page.component.scss']
})
export class ParseTaskPageComponent implements OnInit, OnDestroy {

    @ViewChild('vs') vs?: VirtualScroller;

    parserState?: OldTracker;

    settingsForm = new FormGroup({
        startId: new FormControl(0, [Validators.required]),
        endId: new FormControl(0, [Validators.required]),
        trackerLogin: new FormControl("", [Validators.required]),
        trackerPassword: new FormControl("", [Validators.required]),
        trackerUrl: new FormControl("", [Validators.required]),
        bindings: new FormControl({}),
    });
    messages: SimpleMessage[] = [];

    subscribes = new SubscriptionsHolder();

    addressCorrectingPool?: { [key: string]: AddressCorrecting };

    currentCorrectingStreetAddress: Address = {};
    currentCorrectingHouseAddress: Address = {};
    currentCorrectingApartAddress: Address = {};

    listOfCorrectedStreets: string[] = [];
    listOfCorrectedHouses: string[] = [];
    listOfCorrectedApartments: string[] = [];

    streetToCorrect: [string, AddressCorrecting] | null[] = [null, null];
    houseToCorrect: [string, AddressCorrecting] | null[] = [null, null];
    apartmentToCorrect: [string, AddressCorrecting] | null[] = [null, null];

    constructor(readonly api: ApiService, readonly rt: RealTimeUpdateService) {
    }

    get progress() {
        if (this.parserState) {
            const {startId, endId} = this.parserState.settings;
            const {currentTask} = this.parserState;
            if (currentTask) {
                const percent = (currentTask - startId) / (endId - startId) * 100;
                return percent > 100 ? 100 : parseFloat(percent.toFixed(2));
            }
        }
        return 0;
    };

    ngOnInit(): void {
        this.api.getTrackerParserState().subscribe(this.setCurrentTrackerParserState.bind(this));
        this.subscribes.addSubscription("updState", this.rt.updateTrackerParserState()
            .subscribe(this.setCurrentTrackerParserState.bind(this)))
        this.subscribes.addSubscription("updMessages", this.rt.parserMessageReceived()
            .subscribe((message) => {
                this.messages = [...this.messages, message];
                if (this.vs) {
                    this.vs.scrollToIndex(this.messages.length, "auto");
                }
            }))
        this.settingsForm.valueChanges.subscribe(value => console.log(value));
        this.api.getAddressCorrectingPool().subscribe(pool => {
            this.addressCorrectingPool = pool;
            this.updateStreetToCorrect();
            this.updateHouseToCorrect();
            this.updateApartmentToCorrect();
        });
    }

    ngOnDestroy() {
        this.subscribes.unsubscribeAll()
    }

    submitSaveSettings() {
        this.api.saveTrackerParserSettings(this.settingsForm.getRawValue()).subscribe();
    }

    startParsing() {
        this.api.startTrackerParser().subscribe();
    }

    stopParsing() {
        this.api.stopTrackerParser().subscribe();
        this.api.getAddressCorrectingPool().subscribe(pool => {
            this.addressCorrectingPool = pool;
            this.updateStreetToCorrect();
            this.updateHouseToCorrect();
            this.updateApartmentToCorrect();
        });
    }

    messageClass(item: SimpleMessage) {
        return 'simple-message ' + item.severity.toLowerCase();
    }

    correctStreet(addressEntry: null[] | [string, AddressCorrecting]) {
        if (addressEntry[0] == null || addressEntry[1] == null) return;
        if (!this.addressCorrectingPool || !this.addressCorrectingPool[addressEntry[0]]) return;

        Object.entries(this.addressCorrectingPool).forEach(e => {
            const [key, value] = e;
            if (addressEntry[0] == null || addressEntry[1] == null) return;
            if (value.streetRaw === addressEntry[1].streetRaw) {
                if(this.addressCorrectingPool && this.currentCorrectingStreetAddress.street)
                    this.addressCorrectingPool[key].address.street = {...this.currentCorrectingStreetAddress.street};
                this.listOfCorrectedStreets = [...this.listOfCorrectedStreets, key];
            }
        })

        this.sendCorrectedAddress();
        this.updateStreetToCorrect();
    }

    updateStreetToCorrect() {
        if (this.addressCorrectingPool)
            this.streetToCorrect = Object.entries(this.addressCorrectingPool).filter(e => {
                const [key, value] = e;
                return value.types.includes("STREET") && !this.listOfCorrectedStreets.includes(key)
            })[0] ?? [null, null];
    }

    updateHouseToCorrect() {
        if (this.addressCorrectingPool)
            this.houseToCorrect = Object.entries(this.addressCorrectingPool).filter(e => {
                const [key, value] = e;
                return value.types.includes("HOUSE") && !this.listOfCorrectedHouses.includes(key)
            })[0] ?? [null, null];
    }

    updateApartmentToCorrect() {
        if (this.addressCorrectingPool)
            this.apartmentToCorrect = Object.entries(this.addressCorrectingPool).filter(e => {
                const [key, value] = e;
                return value.types.includes("APART") && !this.listOfCorrectedApartments.includes(key)
            })[0] ?? [null, null];
    }

    private setCurrentTrackerParserState(state: OldTracker) {
        this.parserState = state;
        this.settingsForm.setValue(state.settings);
    }

    correctHouse(houseToCorrect: [string, AddressCorrecting] | null[]) {
        if (houseToCorrect[0] == null || houseToCorrect[1] == null) return;
        if (!this.addressCorrectingPool || !this.addressCorrectingPool[houseToCorrect[0]]) return;

        this.addressCorrectingPool[houseToCorrect[0]].address.houseNum = this.currentCorrectingHouseAddress.houseNum;
        this.addressCorrectingPool[houseToCorrect[0]].address.fraction = this.currentCorrectingHouseAddress.fraction;
        this.addressCorrectingPool[houseToCorrect[0]].address.build = this.currentCorrectingHouseAddress.build;
        this.addressCorrectingPool[houseToCorrect[0]].address.letter = this.currentCorrectingHouseAddress.letter;
        this.listOfCorrectedHouses = [...this.listOfCorrectedHouses, houseToCorrect[0]];

        this.sendCorrectedAddress();
        this.updateHouseToCorrect();
    }

    correctApart(apartmentToCorrect: [string, AddressCorrecting] | null[]) {
        if (apartmentToCorrect[0] == null || apartmentToCorrect[1] == null) return;
        if (!this.addressCorrectingPool || !this.addressCorrectingPool[apartmentToCorrect[0]]) return;

        this.addressCorrectingPool[apartmentToCorrect[0]].address.entrance = this.currentCorrectingApartAddress.entrance;
        this.addressCorrectingPool[apartmentToCorrect[0]].address.floor = this.currentCorrectingApartAddress.floor;
        this.addressCorrectingPool[apartmentToCorrect[0]].address.apartmentNum = this.currentCorrectingApartAddress.apartmentNum;
        this.addressCorrectingPool[apartmentToCorrect[0]].address.apartmentMod = this.currentCorrectingApartAddress.apartmentMod;
        this.listOfCorrectedApartments = [...this.listOfCorrectedApartments, apartmentToCorrect[0]];

        this.sendCorrectedAddress();
        this.updateApartmentToCorrect();
    }

    gettingFullCorrectedAddress() {
        if(!this.addressCorrectingPool) return {} as {[key:string]:AddressCorrecting};
        return Object.entries(this.addressCorrectingPool).filter(e=>{
            let streetCorrected = true;
            let houseCorrected = true;
            let apartCorrected = true;
            const [key, value] = e;

            if(value.types.includes("STREET") && !this.listOfCorrectedStreets.includes(key)) streetCorrected = false;
            if(value.types.includes("HOUSE") && !this.listOfCorrectedHouses.includes(key)) houseCorrected = false;
            if(value.types.includes("APART") && !this.listOfCorrectedApartments.includes(key)) apartCorrected = false;

            return streetCorrected && houseCorrected && apartCorrected;
        }).reduce((acc,cur)=>{
            const [key, value] = cur;
            acc[key] = value;
            return acc;
        }, {} as {[key:string]:AddressCorrecting})
    }

    sendCorrectedAddress() {
        const correctedAddress = this.gettingFullCorrectedAddress();
        this.api.sendCorrectedAddress(correctedAddress).subscribe();
    }
}
