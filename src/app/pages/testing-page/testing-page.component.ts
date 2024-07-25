import {AfterContentInit, Component, OnInit} from '@angular/core';
import {BillingUserItemData, FieldItem, WireframeFieldType} from "../../types/transport-interfaces";
import {v4} from "uuid";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiService} from "../../services/api.service";
import {
    bufferTime,
    debounceTime,
    distinctUntilChanged,
    map,
    Observable,
    of,
    range,
    shareReplay,
    switchMap,
    tap
} from "rxjs";
import {RealTimeUpdateService} from "../../services/real-time-update.service";
import {CustomValidators} from "../../custom-validators";
import {PersonalityService} from "../../services/personality.service";
import {AccessFlag} from "../../types/access-flag";
import {FromEvent} from "../../decorators";
import {ITerminalOptions} from "xterm";
import {TaskCreatorService} from "../../services/task-creator.service";

@Component({
    templateUrl: './testing-page.component.html',
    styleUrls: ['./testing-page.component.scss']
})
export class TestingPageComponent implements OnInit, AfterContentInit {

    items: string[] = [];
    AccessFlag = AccessFlag;

    fields: FieldItem[] = [
        {name: 'Булево', id: v4(), type: WireframeFieldType.BOOLEAN, orderPosition: 1, listViewIndex: 1},
        {name: 'Интегер', id: v4(), type: WireframeFieldType.INTEGER, orderPosition: 1, listViewIndex: 1},
        {name: 'Флоат', id: v4(), type: WireframeFieldType.FLOAT, orderPosition: 1, listViewIndex: 1},
        {name: 'Текст', id: v4(), type: WireframeFieldType.LARGE_TEXT, orderPosition: 1, listViewIndex: 1},
        {name: 'Строка', id: v4(), type: WireframeFieldType.SMALL_TEXT, orderPosition: 1, listViewIndex: 1},
        {name: 'Адрес', id: v4(), type: WireframeFieldType.ADDRESS, orderPosition: 1, listViewIndex: 1},
        {name: 'Телефон', id: v4(), type: WireframeFieldType.PHONE_ARRAY, orderPosition: 1, listViewIndex: 1},
    ]
    ips$ = range(1, 150).pipe(map(i => `10.163.35.${i}`), bufferTime(1000));
    form: FormGroup = new FormGroup({});
    employees$ = this.api.getEmployees();
    users: BillingUserItemData[] = [];
    filterForm = new FormGroup({
        mode: new FormControl('login'),
        query: new FormControl(''),
    })
    filterChange$ = this.filterForm.valueChanges.pipe(debounceTime(1000), distinctUntilChanged(), switchMap((value: any) => {
        if (!value.query) return of([] as any[]);
        switch (value.mode) {
            case 'login':
                return this.api.getBillingUsersByLogin(value.query, true);
            case 'fio':
                return this.api.getBillingUsersByFio(value.query, true);
            case 'address':
                return this.api.getBillingUsersByAddress(value.query, true);
        }
        return of([] as any[]);
    }));
    filterModeItems = [
        {label: "Логин", value: "login"},
        {label: "ФИО", value: "fio"},
        {label: "Адрес", value: "address"},
    ]

    usersHandler = {
        next: (users: BillingUserItemData[]) => {
            this.users = users;
        }
    }

    ips = ["10.163.35.26"];

    // ips=["8.8.8.8","193.111.3.1","10.163.35.140","10.163.35.254"];
    workPickerControl = new FormControl(null);
    //Method to generate a random string and push it to the items array
    unsub = true;
    control = new FormControl([{
        "equipment": {
            "clientEquipmentId": 2,
            "name": "Роутер 5",
            "description": "Необычный роутер",
            "price": 2000,
            "created": "2023-08-16T07:12:42.701+00:00",
            "creator": {
                "login": "admin",
                "department": {
                    "departmentId": 1,
                    "name": "ТП",
                    "description": null,
                    "deleted": false,
                    "created": "2023-05-02T13:35:15.746+00:00"
                },
                "position": {
                    "positionId": 1,
                    "name": "Стандартная",
                    "description": null,
                    "access": 0,
                    "created": "2023-05-02T13:40:51.279+00:00",
                    "deleted": false
                },
                "avatar": "9599810d-5d86-4aba-b71b-83fa120ace9c.png",
                "secondName": "Андреевич",
                "firstName": "Максим",
                "lastName": "Ушаков",
                "internalPhoneNumber": "",
                "access": 0,
                "created": "2023-05-01T15:53:59.919+00:00",
                "telegramUserId": "",
                "offsite": false,
                "deleted": false,
                "status": "ONLINE",
                "lastSeen": "2023-08-16T13:08:43.102+00:00",
                "fullName": "Максим Ушаков"
            },
            "editedBy": [],
            "deleted": false,
            "lastEdit": null
        }, "count": 1
    }]);
    ctrl$ = this.control.valueChanges.pipe(shareReplay(1))
    value = new Date();
    testControl = new FormControl(null, CustomValidators.taskInput(WireframeFieldType.ADDRESS, 'APARTMENT_ONLY'));

    sessionId = v4();

    telnetCon$: Observable<string> = this.rt.remoteTelnetConnection('10.100.164.62', this.sessionId)
        .pipe(
            map(r=> {
                return r.data;
            }),
        );

    telnetSendData(event: string) {
        if(event===''){
            this.api.sendDataToTelnetSession(this.sessionId, '\b').subscribe();
            return;
        }
        this.api.sendDataToTelnetSession(this.sessionId, event).subscribe();
    }

    constructor(readonly api: ApiService, readonly rt: RealTimeUpdateService, readonly personality: PersonalityService, private taskCreatorService: TaskCreatorService) {
    }

    ngOnInit(): void {
        for (let i = 0; i < 10000; i++) {
            this.generateRandomString();
        }
        for (const field of this.fields) {
            this.form.addControl(field.id, new FormControl(null));
        }
        this.filterChange$.subscribe(this.usersHandler)
    }

    valueChange(value: any) {
    }

    generateRandomString() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result1 = '';
        const charactersLength = characters.length;
        for (let i = 0; i < 5; i++) {
            result1 += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        this.items.push(result1);
    }

    loadDocument() {

    }

    ngAfterContentInit(): void {
    }

    createTask() {
        this.api.convertBillingAddress("К.М 44-118 (4.7)").subscribe((address) => {
            this.taskCreatorService.wireframe(7, {
                login: '16111630',
                address,
                phone: null,
                description: null
            })
        })
    }
}
