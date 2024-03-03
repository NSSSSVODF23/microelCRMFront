import {Injectable} from '@angular/core';
import {ApiService} from "../api.service";
import {RealTimeUpdateService} from "../real-time-update.service";
import {
    BehaviorSubject,
    combineLatest,
    debounceTime,
    delay,
    distinctUntilChanged,
    filter, Observable,
    Subject,
    switchMap,
    tap
} from "rxjs";
import {AcpUserBrief, DhcpBinding, Page} from "../../types/transport-interfaces";
import {TelnetTerminalsService} from "../telnet-terminals.service";
import {MenuItem, MessageService} from "primeng/api";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {TableFilter} from "../../types/service-interfaces";
import {BlockUiService} from "../block-ui.service";
import {Menu} from "primeng/menu";

@Injectable({
    providedIn: 'root'
})
export class UserSessionsListService {

    tableOffset = 0;
    tableContent?: Page<DhcpBinding>;
    bindingsUserBriefs: { [key: string]: AcpUserBrief } = {};

    tableLazyLoad$ = new Subject<any>();
    previousPageRequest = "";
    tableLazyLoadDistinctChanges$ = this.tableLazyLoad$
        .pipe(
            delay(1),
            distinctUntilChanged((previous, current) => {
                return this.previousPageRequest === JSON.stringify(current)
            }),
            tap(paging => this.previousPageRequest = JSON.stringify(paging))
        )
    updateContent$ = new BehaviorSubject(true);
    tableContentLoading = false;


    bindingContextOptions: MenuItem[] = [];
    userAuthDialogVisible = false;
    selectBindingForAuth: DhcpBinding | null = null;
    authUserForm = new FormGroup({
        login: new FormControl('', [Validators.required]),
        macaddr: new FormControl('', [Validators.required])
    })

    constructor(private api: ApiService, private blockService: BlockUiService, private toast: MessageService) {
        combineLatest([this.tableLazyLoadDistinctChanges$, this.updateContent$])
            .pipe(
                tap(() => this.tableContentLoading = true),
                switchMap(([paging]) => {
                    delete paging.filters['global'];
                    return this.api.getBindingsTable(paging);
                }),
            )
            .subscribe(loadedPage => {
                this.tableContent = loadedPage;
                this.tableContentLoading = false;
                this.api.getBulkUserBriefInfo(loadedPage.content.filter(b => b.authName).map(b => b.authName))
                    .subscribe(
                        (userBriefs: { [key: string]: AcpUserBrief }) => this.bindingsUserBriefs = userBriefs
                    )
            })
    }

    selectBinding(event: MouseEvent, binding: DhcpBinding, menuRef: Menu) {
        const {clientX, clientY} = event;

        const menuTarget = document.createElement("div");
        menuTarget.className = "fixed w-1rem h-1rem pointer-events-none";
        menuTarget.style.left = clientX + 'px';
        menuTarget.style.top = clientY + 'px';
        document.body.appendChild(menuTarget);

        this.bindingContextOptions = [
            {
                icon: 'mdi-web',
                label: 'Удаленка',
                disabled: !binding.ipaddr,
                command: () => {
                    this.openWeb(binding.ipaddr)
                }
            },
            {
                icon: 'mdi-password',
                label: 'Авторизовать',
                command: () => {
                    this.selectBindingForAuth = binding;
                    this.userAuthDialogVisible = true;
                    this.authUserForm.reset({
                        login: '', macaddr: binding.macaddr
                    })
                }
            }
        ]
        menuRef.show(event);
        setTimeout(() => {
            menuRef.target = menuTarget;
            menuRef.alignOverlay();
            document.body.removeChild(menuTarget);
        })
    }

    openWeb(ip: string) {
        this.blockService.wait({message: "Проверка наличия удаленного доступа"})
        this.api.checkRemoteControl(ip).subscribe(
            {
                next: (ra) => {
                    this.blockService.unblock();
                    if (ra.hasAccess && ra.webPort) {
                        window.open(`http://${ip}:${ra.webPort}`, '_blank');
                    } else {
                        this.toast.add({
                            detail: 'Нет удаленного доступа',
                            severity: 'dark',
                            key: 'darktoast',
                            icon: 'mdi-web',
                            closable: false
                        });
                    }
                },
                error: () => {
                    this.blockService.unblock();
                }
            }
        )
    }

    authUser() {
        const {login, macaddr} = this.authUserForm.value;
        if (!login || !macaddr)
            return;
        this.blockService.wait({message: "Авторизация устройства"});
        this.api.authDhcpBinding(login, macaddr)
            .subscribe(
                {
                    next: () => {
                        this.blockService.unblock();
                        this.userAuthDialogVisible = false;
                    },
                    error: () => this.blockService.unblock()
                }
            )
    }
}
