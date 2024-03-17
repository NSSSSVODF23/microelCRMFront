import {Injectable} from '@angular/core';
import {NavigationEnd, Router} from "@angular/router";
import {filter, map, ReplaySubject, shareReplay, tap} from "rxjs";
import {AccessFlag} from "../types/access-flag";
import {PersonalityService} from "./personality.service";
import {TaskCreatorService} from "./task-creator.service";
import {ImageCroppedEvent} from "ngx-image-cropper";
import {FormControl} from "@angular/forms";
import {MenuItem} from "primeng/api";
import {ApiService} from "./api.service";

type MainMenuItem = {
    link: string[],
    caption: string,
    icon: string,
    accessFlags?: number[],
    exactMatch?: boolean,
    children?: MainMenuItem[],
};

@Injectable({
    providedIn: 'root'
})
export class MainMenuService {

    currentRoute$ = new ReplaySubject<string[]>(1);

    menuModel: MainMenuItem[] = [
        {
            caption: "Главная",
            icon: "mdi-home",
            link: ["/"],
            exactMatch: true
        },
        {
            caption: "Задачи",
            icon: "mdi-task",
            link: ["/tasks"],
            children: [
                {
                    caption: "Каталог",
                    icon: "mdi-inventory_2",
                    link: ["/tasks", "catalog"]
                },
                {
                    caption: "Реестр",
                    icon: "mdi-format_list_bulleted",
                    link: ["/tasks", "registry"]
                },
                {
                    caption: "Календарь",
                    icon: "mdi-calendar_month",
                    link: ["/tasks", "calendar"]
                },
                {
                    caption: "Теги/Шаблоны",
                    icon: "mdi-ballot",
                    link: ["/tasks", "templates"],
                    accessFlags: [AccessFlag.EDIT_TASK_TEMPLATES, AccessFlag.EDIT_TASK_TAGS, AccessFlag.EDIT_DEVICES]
                }
            ]
        },
        {
            caption: "Абоненты",
            icon: "mdi-group",
            link: ["/clients", "billing", "search"],
            accessFlags: [AccessFlag.BILLING]
        },
        {
            caption: "Адреса",
            icon: "mdi-home_work",
            link: ["/addresses"],
            accessFlags: [AccessFlag.EDIT_ADDRESS_BOOK, AccessFlag.EDIT_HOUSE_ADDRESS_BOOK],
            children: [
                {
                    caption: "Список",
                    icon: "mdi-view_list",
                    link: ["/addresses", "list"]
                },
                {
                    caption: "Схемы домов",
                    icon: "mdi-schema",
                    link: ["/addresses", "schemes"]
                }
            ]
        },
        {
            caption: "Топология",
            icon: "mdi-hub",
            link: ["/topology"],
            accessFlags: [AccessFlag.VIEW_SWITCH, AccessFlag.EDIT_SWITCH],
            children: [
                {
                    caption: "Дома",
                    icon: "mdi-maps_home_work",
                    link: ["/topology", "houses"]
                },
                {
                    caption: "Коммутаторы",
                    icon: "mdi-dns",
                    link: ["/topology", "commutators"]
                },
                {
                    caption: "Сети",
                    icon: "mdi-lan",
                    link: ["/topology", "nets"]
                },
                {
                    caption: "Сессии",
                    icon: "mdi-stream",
                    link: ["/topology", "sessions"]
                }
            ]
        },
        {
            caption: "PON",
            icon: "mdi-device_hub",
            link: ["/pon"],
            children: [
                {
                    caption: "Терминалы",
                    icon: "mdi-memory",
                    link: ["/pon", "terminals"]
                },
                {
                    caption: "События",
                    icon: "mdi-fact_check",
                    link: ["/pon", "events"]
                },
            ]
        },
        {
            caption: "Сотрудники",
            icon: "mdi-account_circle",
            link: ["/employees"],
            accessFlags: [AccessFlag.MANAGE_EMPLOYEES, AccessFlag.MANAGE_DEPARTMENTS, AccessFlag.MANAGE_POSITIONS]
        },
        {
            caption: "Зарплата",
            icon: "mdi-currency_ruble",
            link: ["/salary"],
            accessFlags: [AccessFlag.COUNT_SALARY, AccessFlag.EDIT_PRICE],
            children: [
                {
                    caption: "Таблица",
                    icon: "mdi-table_chart",
                    link: ["/salary", "table"],
                    accessFlags: [AccessFlag.COUNT_SALARY]
                },
                {
                    caption: "Подсчет работ",
                    icon: "mdi-exposure_plus_2",
                    link: ["/salary", "estimation"],
                    exactMatch: true,
                    accessFlags: [AccessFlag.COUNT_SALARY]
                },
                {
                    caption: "Подсчет работ (альт.)",
                    icon: "mdi-auto_awesome",
                    link: ["/salary", "estimation", "bypass"],
                    accessFlags: [AccessFlag.COUNT_SALARY]
                },
                {
                    caption: "Список работ",
                    icon: "mdi-construction",
                    link: ["/salary", "works"],
                    accessFlags: [AccessFlag.EDIT_PRICE]
                },
                {
                    caption: "Платные действия",
                    icon: "mdi-toc",
                    link: ["/salary", "paid-actions"],
                    accessFlags: [AccessFlag.EDIT_PRICE]
                }
            ]
        },
        {
            caption: "Договоры",
            icon: "mdi-description",
            link: ["/contracts"],
            accessFlags: [AccessFlag.MANAGE_CONTRACTS_TYPES, AccessFlag.VIEW_CONTRACTS],
            children: [
                {
                    caption: "Приемка",
                    icon: "mdi-verified",
                    link: ["/contracts", "inspection"],
                    accessFlags: [AccessFlag.VIEW_CONTRACTS]
                },
                {
                    caption: "Типы договоров",
                    icon: "mdi-plagiarism",
                    link: ["/contracts", "types"],
                    accessFlags: [AccessFlag.MANAGE_CONTRACTS_TYPES]
                }
            ]
        },
        {
            caption: "Статистика",
            icon: "mdi-analytics",
            link: ["/statistics"],
            accessFlags: [AccessFlag.VIEW_STATISTICS],
            children: [
                {
                    caption: "Работники",
                    icon: "mdi-work_history",
                    link: ["/statistics", "employee-works"]
                }
            ]
        },
        {
            caption: "Файлы",
            icon: "mdi-insert_drive_file",
            link: ["/files"],
            accessFlags: [AccessFlag.READ_WRITE_FILES]
        },
        {
            caption: "Система",
            icon: "mdi-settings",
            link: ["/system"],
            accessFlags: [AccessFlag.MANAGE_SYSTEM_SETTINGS],
            children: [
                {
                    caption: "Биллинг",
                    icon: "mdi-person_search",
                    link: ["/system", "billing"]
                },
                {
                    caption: "Telegram",
                    icon: "pi pi-telegram text-2xl",
                    link: ["/system", "telegram"]
                },
                {
                    caption: "ACP",
                    icon: "mdi-developer_board",
                    link: ["/system", "acp"]
                }
            ]
        }
    ]

    currentSubmenu$ = this.currentRoute$
        .pipe(
            map(route => {
                const parent = this.menuModel.find(item => item.link[0].substring(1) === route[0]);
                if(!parent || !parent.children || parent.children.length === 0) return null;
                return parent.children
            }),
            shareReplay(1)
        );

    currentUser$ = this.personality.userData$;

    avatarChangeDialogVisible = false;
    phyPhoneSelectionDialogVisible = false;
    phyPhoneControl = new FormControl<number | null>(null);
    isPhyPhoneIsBinding = false
    userMenuOptions: MenuItem[] = [
        {label: "Изменить аватар", command: () => this.avatarChangeDialogVisible = true},
        {label: "Выбрать телефон", command: () => this.openPhyPhoneSelectionDialog()},
        {label: "Выйти из аккаунта", command: this.exitFromAccount.bind(this)}
    ];

    constructor(private router: Router, private personality: PersonalityService,
                private api: ApiService, private taskCreator: TaskCreatorService) {
        this.currentRoute$.next(this.router.url.substring(1).split('/'));
        this.router.events
            .pipe(
                filter((event: any) => event instanceof NavigationEnd),
                map(event => event.url.substring(1).split('/')),
            ).subscribe(this.currentRoute$);
    }

    hasAccess(item: MainMenuItem): boolean {
        if(!item.accessFlags || item.accessFlags.length == 0) return true;
        return this.personality.isHasAccess(...item.accessFlags)
    }

    createTask() {
        this.taskCreator.standard();
    }

    exitFromAccount() {
        this.api.signOut().subscribe(() => {
            this.router.navigate(['/login']).then()
        })
    }

    imageChangedEvent: any = '';
    croppedImage: any = '';
    avatarUpload = false;
    phones$ = this.api.getPhyPhoneList().pipe(map(list=>[{label:"Без телефона", value: null}, ...list]));

    openPhyPhoneSelectionDialog() {
        if(this.personality.me)
            this.phyPhoneControl.setValue(this.personality.me.phyPhoneInfo?.phyPhoneInfoId ?? null);
        this.phyPhoneSelectionDialogVisible = true;
    }

    imageCropped(event: ImageCroppedEvent) {
        this.croppedImage = event.base64;
    }

    saveAvatar() {
        if(!this.croppedImage) return;
        this.avatarUpload = true;
        this.api.setAvatar(this.croppedImage).subscribe({
            next: () => {
                this.avatarUpload = false;
                this.avatarChangeDialogVisible = false;
                this.imageChangedEvent = undefined;
            },
            error: () => {
                this.avatarUpload = false;
            }
        })
    }

    selectFile(fileInput: HTMLInputElement) {
        fileInput.click();
    }

    bindPhone(){
        this.isPhyPhoneIsBinding = true;
        this.api.setPhyPhoneBind(this.phyPhoneControl.value).subscribe({
            next: () => {
                this.isPhyPhoneIsBinding = false;
                this.phyPhoneSelectionDialogVisible = false;
            },
            error: () => {
                this.isPhyPhoneIsBinding = false;
            }
        })
    }

}
